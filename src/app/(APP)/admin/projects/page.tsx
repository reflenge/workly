import { db } from "@/db";
import { projects } from "@/db/schema";
import { requireUser } from "@/lib/auth/requireUser";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import ProjectRateItems from "./_components/project-rate-items";
import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import { getProjectBudgetSummaries } from "@/lib/budget/service";

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

    // 一括取得（N+1 を回避）
    const summaries = await getProjectBudgetSummaries(list);

    const activeSummaries = summaries.filter((s) => s.project.isActive);
    const inactiveSummaries = summaries.filter((s) => !s.project.isActive);

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="プロジェクト単価・予算管理"
                description="プロジェクトごとの役職別時給単価、見積もり総量、期間、バッファ率を設定します。見積もり超過リスクをカード上で素早く確認できます。プロジェクトの名称・説明・有効状態の編集は /projects から行ってください。"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSummaries.map((s) => (
                    <ProjectRateItems key={s.project.id} summary={s} />
                ))}
                {inactiveSummaries.length > 0 && (
                    <>
                        <div className="col-span-full py-4">
                            <hr className="border-t border-border" />
                            <p className="text-sm text-muted-foreground mt-2">
                                無効なプロジェクト
                            </p>
                        </div>
                        {inactiveSummaries.map((s) => (
                            <ProjectRateItems key={s.project.id} summary={s} />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
