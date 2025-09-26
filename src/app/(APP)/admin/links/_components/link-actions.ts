"use server";

import { db } from "@/db";
import { cardAssignments, cards, users } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function createLink(input: {
    userId: string;
    cardUid: string;
    reason?: string;
}) {
    // 実施者（現在の管理者ユーザー）を特定
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } =
        await supabase.auth.getClaims();
    if (claimsError || !claimsData?.claims?.sub) {
        throw new Error("実施者を特定できません");
    }
    const actor = (
        await db
            .select()
            .from(users)
            .where(eq(users.authId, claimsData.claims.sub))
            .limit(1)
    )[0];
    if (!actor || !actor.isAdmin) {
        throw new Error("権限がありません");
    }
    // 仕様: 同一ユーザー/カードともに「未解除リンク」は1件まで
    // スキーマの部分ユニークが守ってくれるが、前検証し分かりやすいエラーにする
    const user = (
        await db.select().from(users).where(eq(users.id, input.userId)).limit(1)
    )[0];
    if (!user) throw new Error("ユーザーが見つかりません");

    const card = (
        await db
            .select()
            .from(cards)
            .where(eq(cards.uid, input.cardUid))
            .limit(1)
    )[0];
    if (!card) throw new Error("カードが見つかりません");
    if (!card.isActive) throw new Error("無効なカードです");

    const existingByUser = (
        await db
            .select()
            .from(cardAssignments)
            .where(
                and(
                    eq(cardAssignments.userId, user.id),
                    isNull(cardAssignments.unassignedAt)
                )
            )
            .limit(1)
    )[0];
    if (existingByUser) throw new Error("このユーザーは既にカードに割当中です");

    const existingByCard = (
        await db
            .select()
            .from(cardAssignments)
            .where(
                and(
                    eq(cardAssignments.cardId, card.id),
                    isNull(cardAssignments.unassignedAt)
                )
            )
            .limit(1)
    )[0];
    if (existingByCard)
        throw new Error("このカードは既に他のユーザーに割当中です");

    await db.insert(cardAssignments).values({
        userId: user.id,
        cardId: card.id,
        reason: input.reason,
        assignedByUserId: actor.id,
    });
}

export async function unlink(
    assignmentId: string,
    reason: string,
    options?: { setCardInactive?: boolean }
) {
    // 実施者（現在の管理者ユーザー）を特定
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } =
        await supabase.auth.getClaims();
    if (claimsError || !claimsData?.claims?.sub) {
        throw new Error("実施者を特定できません");
    }
    const actor = (
        await db
            .select()
            .from(users)
            .where(eq(users.authId, claimsData.claims.sub))
            .limit(1)
    )[0];
    if (!actor || !actor.isAdmin) {
        throw new Error("権限がありません");
    }
    const assignment = (
        await db
            .select()
            .from(cardAssignments)
            .where(eq(cardAssignments.id, assignmentId))
            .limit(1)
    )[0];
    if (!assignment) throw new Error("リンクが見つかりません");
    if (assignment.unassignedAt) return; // 既に解除

    await db
        .update(cardAssignments)
        .set({
            unassignedAt: new Date(),
            reason: reason || assignment.reason,
            unassignedByUserId: actor.id,
        })
        .where(eq(cardAssignments.id, assignmentId));

    if (options?.setCardInactive) {
        await db
            .update(cards)
            .set({
                isActive: false,
                inactiveReason: reason || assignment.reason,
            })
            .where(eq(cards.id, assignment.cardId));
    }
}
