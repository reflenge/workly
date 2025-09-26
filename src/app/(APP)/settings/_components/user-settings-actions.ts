"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function updateUserSettings(input: {
    userId: string;
    lastName: string;
    firstName: string;
    lastNameKana: string | null;
    firstNameKana: string | null;
    bio: string | null;
    iconUrl: string | null;
}) {
    try {
        // 認証チェック
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            throw new Error("認証が必要です");
        }

        // ユーザーが自分の情報を更新しているかチェック
        const userData = await db
            .select({ authId: users.authId })
            .from(users)
            .where(eq(users.id, input.userId))
            .limit(1);

        if (userData.length === 0) {
            throw new Error("ユーザーが見つかりません");
        }

        if (userData[0].authId !== user.id) {
            throw new Error("権限がありません");
        }

        // ユーザー情報を更新
        await db
            .update(users)
            .set({
                lastName: input.lastName,
                firstName: input.firstName,
                lastNameKana: input.lastNameKana,
                firstNameKana: input.firstNameKana,
                bio: input.bio,
                iconUrl: input.iconUrl,
                updatedAt: new Date(),
            })
            .where(eq(users.id, input.userId));
    } catch (error) {
        throw error;
    }
}
