import { requireUser } from "@/lib/auth/requireUser";
import { redirect } from "next/navigation";
import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import AttendanceView from "@/components/attendance";

export default async function page() {
    const user = await requireUser();

    // admin 権限のユーザーのみアクセス可能
    if (!user.isAdmin) {
        redirect("/");
    }

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="管理者ダッシュボード"
                description="全ユーザーの出退勤記録を確認できます"
            />
            <AttendanceView isAdmin={true} userId={user.id} />
        </div>
    );
}
