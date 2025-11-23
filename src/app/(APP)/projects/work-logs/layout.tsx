import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import { requireUser } from "@/lib/auth/requireUser";

export default async function WorkLogsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireUser();

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="作業ログ"
                description="プロジェクトごとの作業ログ一覧を確認できます。"
            />
            {children}
        </div>
    );
}
