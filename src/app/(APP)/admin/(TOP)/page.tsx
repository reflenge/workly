import { db } from "@/db";
import { users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminAttendancePageWrapper } from "../_components/admin-attendance-page-wrapper";

export default async function page() {
    // admin 権限のユーザーのみアクセス可能
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) {
        redirect("/auth/login");
    }
    const userResult = await db
        .select()
        .from(users)
        .where(eq(users.authId, data?.claims?.sub))
        .limit(1);
    const user = userResult[0];
    if (!user) {
        redirect("/auth/login");
    }
    if (!user.isAdmin) {
        redirect("/");
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    管理者ダッシュボード
                </h1>
                <p className="text-muted-foreground">
                    全ユーザーの出退勤記録を確認できます
                </p>
            </div>

            <AdminAttendancePageWrapper />
        </div>
    );
}
