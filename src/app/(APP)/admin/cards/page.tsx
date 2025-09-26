import { db } from "@/db";
import { cards, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import NewItem from "./_components/new-item";
import CardItems from "./_components/card-items";

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
    const user = userResult[0];
    if (!user) {
        redirect("/auth/login");
    }
    if (!user.isAdmin) {
        redirect("/");
    }

    const cardResult = await db
        .select()
        .from(cards)
        .orderBy(desc(cards.updatedAt));
    return (
        <div className="">
            <h1 className="text-2xl font-bold mb-4 px-6 text-center">
                NFC Card 登録・管理
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                <NewItem />
                {cardResult.length > 0 &&
                    cardResult.map((card) => (
                        <CardItems key={card.id} card={card} />
                    ))}
            </div>
        </div>
    );
}
