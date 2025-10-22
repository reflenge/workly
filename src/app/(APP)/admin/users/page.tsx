import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth/requireUser";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import NewItem from "./_components/new-item";
import UserItems from "./_components/user-items";
import { PageHeaderMeta } from "@/components/page-header/page-header-meta";

export default async function page() {
    const user = await requireUser();

    // admin 権限のユーザーのみアクセス可能
    if (!user.isAdmin) {
        redirect("/");
    }

    const userList = await db
        .select()
        .from(users)
        .orderBy(desc(users.updatedAt));

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="ユーザー管理"
                description="従業員アカウントの新規作成、プロフィール編集（氏名・メール・電話番号など）、管理者権限の設定、アクティブ状態の管理、給与設定の履歴管理を一元的に行えます。"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <NewItem />
                {userList.length > 0 &&
                    userList.map((u) => <UserItems key={u.id} user={u} />)}
            </div>
        </div>
    );
}
