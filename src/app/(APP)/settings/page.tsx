import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import UserSettingsForm from "./_components/user-settings-form";
import { formatToJstDate } from "@/lib/utils";
import { PageHeaderMeta } from "../_components/page-header-meta";

export default async function SettingsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    // ユーザー情報を取得
    const userData = await db
        .select()
        .from(users)
        .where(eq(users.authId, user.id))
        .limit(1);

    if (userData.length === 0) {
        redirect("/auth/login");
    }

    // ユーザーの現在のカード情報を取得（v_current_card_assignment ビューを使用）
    const currentCardRaw = await db.execute(sql`
        SELECT
            c.id as "cardId",
            c.uid as "cardUid",
            c.is_active as "isActive",
            c.inactive_reason as "inactiveReason",
            ca.assigned_at as "assignedAt"
        FROM v_current_card_assignment vca
        INNER JOIN card c ON vca.card_id = c.id
        INNER JOIN card_assignment ca ON vca.user_id = ca.user_id AND vca.card_id = ca.card_id
        WHERE vca.user_id = ${userData[0].id}
        LIMIT 1
    `);

    const currentCard = Array.isArray(currentCardRaw)
        ? (currentCardRaw as unknown as {
              cardId: string;
              cardUid: string;
              isActive: boolean;
              inactiveReason: string | null;
              assignedAt: string;
          }[])
        : ((currentCardRaw as unknown as { rows?: unknown[] }).rows as {
              cardId: string;
              cardUid: string;
              isActive: boolean;
              inactiveReason: string | null;
              assignedAt: string;
          }[]) ?? [];

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="設定"
                description="アカウント情報とカード設定を管理できます"
            />
            <div className="max-w-2xl mx-auto space-y-6">
                {/* カード情報表示 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">カード情報</h2>
                    {currentCard.length > 0 ? (
                        <div className="space-y-2">
                            <p>
                                <span className="font-medium">カードID:</span>{" "}
                                {currentCard[0].cardUid}
                            </p>
                            <p>
                                <span className="font-medium">ステータス:</span>
                                <span
                                    className={`ml-2 px-2 py-1 rounded text-sm ${
                                        currentCard[0].isActive
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                    }`}
                                >
                                    {currentCard[0].isActive ? "有効" : "無効"}
                                </span>
                            </p>
                            {currentCard[0].assignedAt && (
                                <p>
                                    <span className="font-medium">
                                        割り当て日:
                                    </span>{" "}
                                    {formatToJstDate(currentCard[0].assignedAt)}
                                </p>
                            )}
                            {!currentCard[0].isActive &&
                                currentCard[0].inactiveReason && (
                                    <p>
                                        <span className="font-medium">
                                            無効理由:
                                        </span>{" "}
                                        {currentCard[0].inactiveReason}
                                    </p>
                                )}
                        </div>
                    ) : (
                        <p className="text-gray-500">
                            カードが割り当てられていません
                        </p>
                    )}
                </div>

                {/* プロフィール設定 */}
                <UserSettingsForm user={userData[0]} />
            </div>
        </div>
    );
}
