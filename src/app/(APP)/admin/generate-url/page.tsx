import { requireUser } from "@/lib/auth/requireUser";
import { redirect } from "next/navigation";
import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import { GenerateBypassUrlButton } from "./_components/generate-bypass-url-button";

export default async function page() {
    const user = await requireUser();

    // admin 権限のユーザーのみアクセス可能
    if (!user.isAdmin) {
        redirect("/");
    }

    // バイパスユーザーはアクセス不可
    const isBypassUser = user.id === "bypass-user";
    if (isBypassUser) {
        redirect("/admin");
    }

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="URL生成"
                description="外部の監査担当者やコンサルタントなど、一時的に管理画面へのアクセスが必要な方向けの限定URLを生成します。セキュアな認証バイパス機能により、安全かつ簡単にゲストアクセスを提供できます。"
            />
            <GenerateBypassUrlButton />
        </div>
    );
}
