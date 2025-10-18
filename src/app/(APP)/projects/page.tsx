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

    // admin 権限のユーザーのみアクセス可能
    if (!user.isAdmin) {
        redirect("/");
    }

    const list = await db
        .select()
        .from(projects)
        .orderBy(desc(projects.updatedAt));

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="プロジェクト管理"
                description="プロジェクトの作成・編集・管理を行えます"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <NewItem />
                {list.map((p) => (
                    <ProjectItems key={p.id} project={p} />
                ))}
            </div>
        </div>
    );
}
