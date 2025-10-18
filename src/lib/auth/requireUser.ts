import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

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
