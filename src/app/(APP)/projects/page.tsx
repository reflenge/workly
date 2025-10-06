import { db } from "@/db";
import { projects, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import NewItem from "./_components/new-item";
import ProjectItems from "./_components/project-items";

export default async function Page() {
    // admin 権限のユーザーのみアクセス可能
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) {
        redirect("/auth/login");
    }
    const me = (
        await db
            .select()
            .from(users)
            .where(eq(users.authId, data?.claims?.sub))
            .limit(1)
    )[0];
    if (!me) redirect("/auth/login");
    if (!me.isAdmin) redirect("/");

    const list = await db
        .select()
        .from(projects)
        .orderBy(desc(projects.updatedAt));

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold mb-4 text-center">
                プロジェクト管理
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <NewItem />
                {list.map((p) => (
                    <ProjectItems key={p.id} project={p} />
                ))}
            </div>
        </div>
    );
}
