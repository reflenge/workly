import React from "react";
import { fetchMyAttendanceLogs } from "./_server";
import { AttendancePageWrapper } from "./_components/attendance-page-wrapper";

interface AttendancePageProps {
    searchParams: {
        page?: string;
    };
}

export default async function AttendancePage({
    searchParams,
}: AttendancePageProps) {
    const pageSize = 20;
    const currentPage = parseInt(searchParams.page || "1", 10);

    const {
        items,
        totalCount,
        totalPages,
        currentPage: page,
        hasNextPage,
        hasPrevPage,
    } = await fetchMyAttendanceLogs({
        page: currentPage,
        pageSize,
    });

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">出勤記録</h1>
                <p className="text-muted-foreground">
                    あなたの出勤・退勤記録を確認できます。全{totalCount}件中
                    {items.length}件を表示
                </p>
            </div>

            <AttendancePageWrapper
                currentPage={page}
                totalPages={totalPages}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
            >
                <div className="space-y-4">
                    {items.length === 0 && (
                        <div className="text-center text-muted-foreground py-10">
                            出勤記録がありません。
                        </div>
                    )}

                    {items.map((log) => (
                        <div
                            key={log.id}
                            className="border rounded-md p-4 space-y-2"
                        >
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    開始:{" "}
                                    {new Date(log.startedAt).toLocaleString(
                                        "ja-JP"
                                    )}
                                    {log.endedAt && (
                                        <>
                                            {" "}
                                            / 終了:{" "}
                                            {new Date(
                                                log.endedAt
                                            ).toLocaleString("ja-JP")}{" "}
                                        </>
                                    )}
                                </div>
                                <span
                                    className={`text-xs px-2 py-1 rounded text-white ${
                                        log.statusId === 1
                                            ? "bg-red-500" // 退勤
                                            : log.statusId === 2
                                            ? "bg-green-500" // 出勤中
                                            : log.statusId === 3
                                            ? "bg-yellow-500" // 休憩中
                                            : "bg-gray-500" // その他
                                    }`}
                                >
                                    ステータス: {log.statusLabel}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div className="text-muted-foreground">
                                    開始ソース:{" "}
                                    <span className="text-foreground">
                                        {log.startedSourceLabel}
                                    </span>
                                </div>
                                <div className="text-muted-foreground">
                                    終了ソース:{" "}
                                    <span className="text-foreground">
                                        {log.endedSourceLabel ?? "-"}
                                    </span>
                                </div>
                                <div className="text-muted-foreground">
                                    作成:{" "}
                                    <span className="text-foreground">
                                        {new Date(log.createdAt).toLocaleString(
                                            "ja-JP"
                                        )}
                                    </span>
                                </div>
                                <div className="text-muted-foreground">
                                    更新:{" "}
                                    <span className="text-foreground">
                                        {new Date(log.updatedAt).toLocaleString(
                                            "ja-JP"
                                        )}
                                    </span>
                                </div>
                            </div>

                            {log.note && (
                                <div className="mt-2 text-sm">
                                    メモ: {log.note}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </AttendancePageWrapper>
        </div>
    );
}
