import { db } from "@/db";
import { userCompensation, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/requireUser";
import { desc, eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import CompensationForm from "./_components/compensation-form";
import CompensationList from "./_components/compensation-list";
import { PageHeaderMeta } from "@/components/page-header/page-header-meta";

export default async function UserDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const currentUser = await requireUser();

    // admin 権限のユーザーのみアクセス可能
    if (!currentUser.isAdmin) {
        redirect("/");
    }

    // 対象ユーザーを取得
    const user = (
        await db.select().from(users).where(eq(users.id, params.id)).limit(1)
    )[0];
    if (!user) notFound();

    // 給与設定履歴を取得
    const compensations = await db
        .select()
        .from(userCompensation)
        .where(eq(userCompensation.userId, params.id))
        .orderBy(desc(userCompensation.effectiveFrom));

    return (
        <div className="container mx-auto p-6">
            <PageHeaderMeta
                title="給与設定"
                description={`${user.lastName} ${
                    user.firstName
                }の給与設定を管理します。時給・基本給の設定、適用開始日の指定、給与変更履歴の確認が可能です。現在のステータス：${
                    user.isActive ? "有効" : "無効"
                } | 権限：${user.isAdmin ? "管理者" : "一般ユーザー"}`}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h2 className="text-lg font-semibold mb-4">
                        新しい給与設定
                    </h2>
                    <CompensationForm userId={params.id} />
                </div>
                <div>
                    <h2 className="text-lg font-semibold mb-4">給与設定履歴</h2>
                    <CompensationList compensations={compensations} />
                </div>
            </div>
        </div>
    );
}
