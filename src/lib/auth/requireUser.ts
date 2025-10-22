import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

const ADMIN_BYPASS_COOKIE = "admin_bypass_token";

// アプリ内でクライアントへ渡してOKな型（必要に応じて調整）
export type PublicUser = {
    id: string;
    authId: string;
    firstName: string;
    lastName: string;
    iconUrl: string | null;
    isAdmin: boolean;
};

const toPublicUser = (u: {
    id: string;
    authId: string;
    firstName: string;
    lastName: string;
    iconUrl: string | null;
    isAdmin: boolean;
}): PublicUser => ({
    id: u.id,
    authId: u.authId,
    firstName: u.firstName,
    lastName: u.lastName,
    iconUrl: u.iconUrl ?? null,
    isAdmin: u.isAdmin,
});

// 同一リクエスト内での重複DBアクセスを避ける
export const requireUser = cache(async (): Promise<PublicUser> => {
    // バイパス: Cookieがある場合はダミーの管理者ユーザーを返す
    const cookieStore = await cookies();
    const bypassToken = cookieStore.get(ADMIN_BYPASS_COOKIE)?.value;

    if (bypassToken) {
        // Cookieに保存されているタイムスタンプを検証（有効期限内か確認）
        const timestampNum = parseInt(bypassToken, 10);
        if (!isNaN(timestampNum)) {
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const validityPeriod = 7 * 24 * 60 * 60; // 7日間

            if (currentTimestamp - timestampNum <= validityPeriod) {
                // バイパスユーザーとして認証成功
                return {
                    id: "bypass-user",
                    authId: "bypass-auth-id",
                    firstName: "バイパス",
                    lastName: "ユーザ",
                    iconUrl: null,
                    isAdmin: true,
                };
            }
        }
    }

    // 通常の認証処理
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) redirect("/auth/login");

    const uid = data.user.id;

    const appUser = await db.query.users.findFirst({
        where: eq(users.authId, uid),
        columns: {
            id: true,
            authId: true,
            firstName: true,
            lastName: true,
            iconUrl: true,
            isAdmin: true,
        },
    });

    if (!appUser) redirect("/auth/login");

    return toPublicUser(appUser);
});
