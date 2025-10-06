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
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    NFC Card 登録・管理
                </h1>
                <p className="text-muted-foreground">
                    NFCカードの登録・編集・管理を行えます
                </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                <NewItem />
                {cardResult.length > 0 &&
                    cardResult.map((card) => (
                        <CardItems key={card.id} card={card} />
                    ))}
            </div>
        </div>
    );
}
