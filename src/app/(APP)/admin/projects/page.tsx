import { db } from "@/db";
import { projects } from "@/db/schema";
import { requireUser } from "@/lib/auth/requireUser";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import ProjectRateItems from "./_components/project-rate-items";
import { PageHeaderMeta } from "@/components/page-header/page-header-meta";

export default async function Page() {
    const user = await requireUser();

    // admin 権限のユーザーのみアクセス可能
    if (!user.isAdmin) {
        redirect("/");
    }

    const list = await db
        .select()
        .from(projects)
        .orderBy(desc(projects.updatedAt));

    const activeProjects = list.filter((p) => p.isActive);
    const inactiveProjects = list.filter((p) => !p.isActive);

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="プロジェクト単価管理"
                description="プロジェクトごとの役職別時給単価を設定します。請求書付きCSV出力で使用される値で、未設定の場合は請求計算から除外されます。プロジェクトの名称・説明・有効状態の編集は /projects から行ってください。"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeProjects.map((p) => (
                    <ProjectRateItems key={p.id} project={p} />
                ))}
                {inactiveProjects.length > 0 && (
                    <>
                        <div className="col-span-full py-4">
                            <hr className="border-t border-border" />
                            <p className="text-sm text-muted-foreground mt-2">
                                無効なプロジェクト
                            </p>
                        </div>
                        {inactiveProjects.map((p) => (
                            <ProjectRateItems key={p.id} project={p} />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
