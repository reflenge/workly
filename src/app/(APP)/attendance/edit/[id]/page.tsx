import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/requireUser";
import { db } from "@/db";
import { attendanceLogs, attendanceStatus } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatToJstDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AttendanceEditPageProps {
    params: {
        id: string;
    };
}

export default async function AttendanceEditPage({ params }: AttendanceEditPageProps) {
    const user = await requireUser();
    const { id } = params;

    // ログの取得
    const logs = await db
        .select({
            id: attendanceLogs.id,
            userId: attendanceLogs.userId,
            startedAt: attendanceLogs.startedAt,
            endedAt: attendanceLogs.endedAt,
            note: attendanceLogs.note,
            status: {
                label: attendanceStatus.label,
            },
        })
        .from(attendanceLogs)
        .innerJoin(
            attendanceStatus,
            eq(attendanceLogs.statusId, attendanceStatus.id)
        )
        .where(eq(attendanceLogs.id, id))
        .limit(1);

    const log = logs[0];

    if (!log) {
        notFound();
    }

    // 権限チェック（本人のログか管理者のみ）
    // ※簡易的なチェック。本来は管理者権限も考慮すべきだが、requireUserで取得したuser情報にはisAdminが含まれていない可能性があるため、
    // 安全側に倒して本人のみとするか、別途管理者チェックを入れる。
    // ここでは本人のログのみ許可とする。
    if (log.userId !== user.id) {
        // 管理者かどうかのチェックが必要ならここで行う
        // 今回は簡易的にForbidden的な扱いとしてnotFoundにするか、メッセージを出す
        return (
            <div className="container mx-auto py-6 px-4">
                <div className="bg-red-50 text-red-600 p-4 rounded-md">
                    このログを編集する権限がありません。
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="勤怠ログ修正"
                description="勤怠ログの詳細を確認・修正します。"
            />

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>現在の登録内容</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">ステータス</label>
                                <p className="text-lg font-semibold">{log.status.label}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">ID</label>
                                <p className="text-sm font-mono text-gray-600">{log.id}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">開始日時</label>
                                <p className="text-lg">{formatToJstDateTime(log.startedAt)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">終了日時</label>
                                <p className="text-lg">
                                    {log.endedAt ? formatToJstDateTime(log.endedAt) : <span className="text-gray-400">進行中</span>}
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-500">メモ</label>
                                <p className="whitespace-pre-wrap">{log.note || <span className="text-gray-400">なし</span>}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>修正フォーム</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-4">
                            <p className="text-sm">
                                <strong>注意:</strong> 現在、編集機能は実装中です。表示のみ可能です。
                            </p>
                        </div>

                        {/* ここにフォームを実装予定 */}
                        <div className="flex justify-end gap-4">
                            <Button variant="outline" asChild>
                                <Link href="/attendance/edit">一覧に戻る</Link>
                            </Button>
                            <Button disabled>保存する</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
