import { db } from "@/db";
import { users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import NewItem from "./_components/new-item";
import UserItems from "./_components/user-items";

export default async function page() {
    // admin 権限のユーザーのみアクセス可能
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) {
        redirect("/auth/login");
    }
    const userResult = await db
        .select()
        .from(users)
        .where(eq(users.authId, data?.claims?.sub))
        .limit(1);
    const me = userResult[0];
    if (!me) {
        redirect("/auth/login");
    }
    if (!me.isAdmin) {
        redirect("/");
    }

    const userList = await db
        .select()
        .from(users)
        .orderBy(desc(users.updatedAt));

    return (
        <div className="">
            <h1 className="text-2xl font-bold mb-4 px-6 text-center">
                ユーザー登録・管理
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                <NewItem />
                {userList.length > 0 &&
                    userList.map((u) => <UserItems key={u.id} user={u} />)}
            </div>
        </div>
    );
}
