"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_BYPASS_COOKIE = "admin_bypass_token";

/**
 * バイパスユーザーのログアウト処理
 * バイパス用のCookieを削除してログインページへリダイレクト
 */
export async function bypassLogout() {
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_BYPASS_COOKIE);
    redirect("/auth/login");
}
