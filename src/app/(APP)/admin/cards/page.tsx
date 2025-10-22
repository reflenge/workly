import { db } from "@/db";
import { cards } from "@/db/schema";
import { requireUser } from "@/lib/auth/requireUser";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import NewItem from "./_components/new-item";
import CardItems from "./_components/card-items";
import { PageHeaderMeta } from "@/components/page-header/page-header-meta";

export default async function page() {
    const user = await requireUser();

    // admin 権限のユーザーのみアクセス可能
    if (!user.isAdmin) {
        redirect("/");
    }

    const cardResult = await db
        .select()
        .from(cards)
        .orderBy(desc(cards.updatedAt));
    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="カード管理"
                description="勤怠打刻に使用するNFCカードの新規登録、カードUID（固有識別番号）の編集、有効化・無効化の切り替え、無効化理由の記録など、カード情報を総合的に管理します。"
            />
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
