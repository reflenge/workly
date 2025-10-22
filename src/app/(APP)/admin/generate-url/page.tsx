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

    // 税理士ユーザー（バイパスユーザー）はアクセス不可
    const isBypassUser = user.id === "bypass-user";
    if (isBypassUser) {
        redirect("/admin");
    }

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="税理士用アクセスURL生成"
                description="税理士など外部の方が一時的に管理画面にアクセスするためのURLを生成します"
            />
            <GenerateBypassUrlButton />
        </div>
    );
}
