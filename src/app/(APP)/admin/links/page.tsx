import { db } from "@/db";
import { cardAssignments, cards, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import NewItem from "./_components/new-item";
import LinkItems from "./_components/link-items";
import { PageHeaderMeta } from "@/components/page-header/page-header-meta";

export default async function Page() {
    // admin 権限のユーザーのみアクセス可能
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) {
        redirect("/auth/login");
    }
    const me = (
        await db
            .select()
            .from(users)
            .where(eq(users.authId, data?.claims?.sub))
            .limit(1)
    )[0];
    if (!me) redirect("/auth/login");
    if (!me.isAdmin) redirect("/");

    // 現在有効なリンク（未解除）を取得
    const linkHistory = await db
        .select({
            assignmentId: cardAssignments.id,
            assignedAt: cardAssignments.assignedAt,
            assignedByUserId: cardAssignments.assignedByUserId,
            unassignedByUserId: cardAssignments.unassignedByUserId,
            unassignedAt: cardAssignments.unassignedAt,
            reason: cardAssignments.reason,
            user: users,
            card: cards,
        })
        .from(cardAssignments)
        .innerJoin(users, eq(users.id, cardAssignments.userId))
        .innerJoin(cards, eq(cards.id, cardAssignments.cardId))
        .orderBy(desc(cardAssignments.assignedAt));

    // 実施者名の解決（割当者/解除者）
    const actorIds = Array.from(
        new Set(
            linkHistory
                .flatMap((r) => [r.assignedByUserId, r.unassignedByUserId])
                .filter((v): v is string => !!v)
        )
    );
    const actorUsers = actorIds.length
        ? await db.select().from(users).where(inArray(users.id, actorIds))
        : [];
    const actorMap = new Map(
        actorUsers.map((u) => [u.id, `${u.lastName} ${u.firstName}`.trim()])
    );

    // ドロップダウン用: 有効ユーザー、割当可能カード
    const activeUsers = await db
        .select()
        .from(users)
        .where(eq(users.isActive, true));

    const activeCards = await db
        .select()
        .from(cards)
        .where(eq(cards.isActive, true));

    // ビュー v_current_card_assignment を利用して、現在割当中のユーザー・カードを取得
    const assignedRaw = await db.execute(
        sql`select user_id as "userId", card_id as "cardId" from v_current_card_assignment`
    );
    const assignedRows: { userId: string; cardId: string }[] = Array.isArray(
        assignedRaw
    )
        ? (assignedRaw as unknown as { userId: string; cardId: string }[])
        : (((
              assignedRaw as unknown as {
                  rows?: { userId: string; cardId: string }[];
              }
          ).rows ?? []) as { userId: string; cardId: string }[]);
    const assignedCardIds = new Set(assignedRows.map((r) => r.cardId));
    const assignedUserIds = new Set(assignedRows.map((r) => r.userId));
    const availableCards = activeCards.filter(
        (c) => !assignedCardIds.has(c.id)
    );
    const availableUsers = activeUsers.filter(
        (u) => !assignedUserIds.has(u.id)
    );

    // クライアントに渡す軽量 Props
    const dropdownUsers = availableUsers.map((u) => ({
        id: u.id,
        lastName: u.lastName,
        firstName: u.firstName,
    }));
    const dropdownCards = availableCards.map((c) => ({ id: c.id, uid: c.uid }));

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="ユーザーとカードのリンク管理"
                description="ユーザーとNFCカードの紐づけ・管理を行えます"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <NewItem users={dropdownUsers} cards={dropdownCards} />
                {linkHistory.map((row) => (
                    <LinkItems
                        key={row.assignmentId}
                        row={{
                            assignmentId: row.assignmentId,
                            assignedAt: row.assignedAt,
                            user: row.user,
                            card: row.card,
                            assignedByName: actorMap.get(
                                row.assignedByUserId ?? ""
                            ),
                            unassignedAt: row.unassignedAt ?? undefined,
                            unassignedByName: actorMap.get(
                                row.unassignedByUserId ?? ""
                            ),
                            reason: row.reason,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
