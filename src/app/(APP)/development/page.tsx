import { requireUser } from "@/lib/auth/requireUser";
import { redirect } from "next/navigation";
import { DevelopmentClient } from "./_components/development-client";
import { PageHeaderMeta } from "@/components/page-header/page-header-meta";

export default async function DevelopmentPage() {
    const user = await requireUser();

    if (!user.isAdmin) {
        redirect("/");
    }

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="開発ツール"
                description="テストデータの生成・登録・削除を行います。"
            />
            <DevelopmentClient userId="19d544de-3046-40bb-8cd4-8b311f665210" />
        </div>
    );
}
