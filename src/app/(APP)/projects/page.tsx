import { db } from "@/db";
import { projects } from "@/db/schema";
import { requireUser } from "@/lib/auth/requireUser";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import NewItem from "./_components/new-item";
import ProjectItems from "./_components/project-items";
import { PageHeaderMeta } from "@/components/page-header/page-header-meta";

export default async function Page() {
    const user = await requireUser();

    // 管理者じゃなくても入れる
    // if (!user.isAdmin) {
    //     redirect("/");
    // }

    const list = await db
        .select()
        .from(projects)
        .orderBy(desc(projects.updatedAt));

    const activeProjects = list.filter((p) => p.isActive);
    const inactiveProjects = list.filter((p) => !p.isActive);

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="プロジェクト"
                description="作業ログに紐づけるプロジェクトの新規作成・編集・削除が可能です。プロジェクト名や説明文を設定し、作業内容を効率的に分類・管理できます。"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <NewItem />
                {activeProjects.map((p) => (
                    <ProjectItems key={p.id} project={p} />
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
                            <ProjectItems key={p.id} project={p} />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
