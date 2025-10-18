import { db } from "@/db";
import { users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import AttendanceView from "@/components/attendance";

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
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="管理者ダッシュボード"
                description="全ユーザーの出退勤記録を確認できます"
            />
            <AttendanceView isAdmin={true}/>
        </div>
    );
}
