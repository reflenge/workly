"use client";

import React, { useMemo } from "react";
import { AttendanceRecordsResultType } from "./actions";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Info } from "lucide-react";
import { getWorkingDaysCount } from "./util";
import Decimal from "decimal.js";
import { Button } from "../ui/button";
import {
    exportUserWorkTimeCSV,
    exportUserDetailRecordsCSV,
} from "./csv-export";
import { formatTime, formatCurrency } from "./format-utils";

interface DataDashboardProps {
    data: AttendanceRecordsResultType[];
    isAdmin: boolean;
    year: number;
    month: number;
}

interface SummaryData {
    totalWorkingDays: number;
    totalWorkingTimeMs: number;
    averageWorkingTimeMs: number;
    totalPay: number;
    userSummary: {
        userId: string;
        userName: string;
        totalWorkingDays: number;
        totalWorkingTimeMs: number;
        averageWorkingTimeMs: number;
        totalPay: number;
    }[];
}

const DataDashboard = ({ data, isAdmin, year, month }: DataDashboardProps) => {
    // 勤務中（id:2）のレコードのみをフィルタリング
    const workData = useMemo(() => {
        return data
            .filter((record) => record.status?.id === 2)
            .filter(
                (record) =>
                    process.env.NODE_ENV !== "production" ||
                    record.user.id !== "19d544de-3046-40bb-8cd4-8b311f665210"
            );
    }, [data]);

    // 集計データ・各種表示フォーマット関数の定義（コメント強化版）

    // useMemoで集計データの算出をメモ化
    // workDataが変更された場合のみ再計算される
    const summaryData = useMemo((): SummaryData => {
        // ==========================
        // 全体の集計値（総日数・総労働時間・平均・総支給額）を計算
        // ==========================
        // 勤務日数 → 勤務中(ステータス2)のレコード件数
        const totalWorkingDays = getWorkingDaysCount(workData);

        // 総労働時間（ミリ秒合計）の計算
        const totalWorkingTimeMs = workData.reduce((sum, record) => {
            // レコードごとにcalculatedPayが存在しないことも考慮
            return sum + (record.calculatedPay?.workingTimeMs || 0);
        }, 0);

        // 勤務日数で割って平均勤務時間（ゼロ除算にも考慮）
        const averageWorkingTimeMs =
            totalWorkingDays > 0 ? totalWorkingTimeMs / totalWorkingDays : 0;

        // 総支給額（hourlyPay合計）
        // ユーザの合計を足す
        // const totalPay = workData.reduce((sum, record) => {
        //     // 勤務記録ごとに支給額
        //     return sum + (record.calculatedPay?.hourlyPay || 0);
        // }, 0);

        // ==========================
        // ユーザー（user.id）毎の個別集計情報
        // ==========================
        // userIdごとに勤務記録をまとめるMap
        const userMap = new Map<string, typeof workData>();
        workData.forEach((record) => {
            const userId = record.user.id;
            // Mapに未登録のuserIdなら空配列を初期化
            if (!userMap.has(userId)) {
                userMap.set(userId, []);
            }
            // ユーザーごとの勤務記録配列に追加
            userMap.get(userId)!.push(record);
        });

        // userMapからユーザーごとの統計情報（勤務日数・総時間・平均・支給額など）を生成
        const userSummary = Array.from(userMap.entries()).map(
            ([userId, userRecords]) => {
                // 該当ユーザーの勤務日数
                const userTotalWorkingDays = getWorkingDaysCount(userRecords);
                // 該当ユーザーの総労働時間
                const userTotalWorkingTimeMs = userRecords.reduce(
                    (sum, record) => {
                        return sum + (record.calculatedPay?.workingTimeMs || 0);
                    },
                    0
                );
                // 勤務日数で割った平均勤務時間
                const userAverageWorkingTimeMs =
                    userTotalWorkingDays > 0
                        ? userTotalWorkingTimeMs / userTotalWorkingDays
                        : 0;
                // ユーザーごとの総支給額

                // 総時間の秒以下を切り捨て 分以上を残す
                // decimal.js で分単位に切り捨て
                const userTotalWorkingTimeMsMathFloor = new Decimal(
                    userTotalWorkingTimeMs
                )
                    .div(60000) // ミリ秒→分
                    .floor()
                    .mul(60000) // 分→ミリ秒
                    .toNumber();
                const userTotalPay = userRecords[0]?.compensation?.hourlyRate
                    ? new Decimal(userRecords[0]?.compensation?.hourlyRate)
                          .mul(userTotalWorkingTimeMsMathFloor / 3_600_000)
                          .floor()
                          .toNumber()
                    : 0;
                console.log(
                    "🚀 => data-dashboard.tsx:112 => DataDashboard => userRecords:",
                    userRecords
                );

                // ユーザー名（勤務記録配列の最初のrecordから）
                return {
                    userId,
                    userName: userRecords[0]?.user.fullName || "",
                    totalWorkingDays: userTotalWorkingDays,
                    totalWorkingTimeMs: userTotalWorkingTimeMs,
                    averageWorkingTimeMs: userAverageWorkingTimeMs,
                    totalPay: userTotalPay,
                };
            }
        );

        const totalPay = userSummary.reduce((sum, user) => {
            return sum + user.totalPay;
        }, 0);

        // 集計データをまとめて返す
        return {
            totalWorkingDays,
            totalWorkingTimeMs,
            averageWorkingTimeMs,
            totalPay,
            userSummary,
        };
    }, [workData]);

    // CSV出力ハンドラー（全体）
    const handleExportCSV = () => {
        exportUserWorkTimeCSV(year, month, summaryData.userSummary);
    };

    // CSV出力ハンドラー（個別ユーザーの詳細レコード）
    const handleExportUserDetail = (userId: string, userName: string) => {
        // 該当ユーザーのレコードをフィルタリング
        const userRecords = workData.filter(
            (record) => record.user.id === userId
        );

        exportUserDetailRecordsCSV(year, month, userName, userRecords);
    };

    return (
        <div className="py-2 space-y-2">
            {/* 全体の集計 */}
            <Card>
                <CardHeader className="">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                            全体の集計 {year}
                            <span className="text-xs ">年</span>
                            {month}
                            <span className="text-xs ">月</span>
                        </CardTitle>
                        <Dialog>
                            <DialogTrigger asChild>
                                <button
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label="詳細情報"
                                >
                                    <Info className="h-4 w-4" />
                                </button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>総支給額について</DialogTitle>
                                    <DialogDescription className="pt-2">
                                        ※「総支給額」は正しい計算ルール（端数処理など）に基づいて算出された値です。各勤務記録の暫定支給額の合計とは異なる場合があります。
                                    </DialogDescription>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                        <div className="p-1 bg-muted/30 rounded-lg">
                            <div className="text-xl font-bold">
                                {summaryData.totalWorkingDays}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                勤務日数
                            </div>
                        </div>
                        <div className="p-1 bg-muted/30 rounded-lg">
                            <div className="text-xl font-bold">
                                {formatTime(summaryData.totalWorkingTimeMs, {
                                    showSeconds: true,
                                    showMilliseconds: false,
                                })}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                総時間
                            </div>
                        </div>
                        <div className="p-1 bg-muted/30 rounded-lg">
                            <div className="text-xl font-bold">
                                {formatTime(summaryData.averageWorkingTimeMs, {
                                    showSeconds: true,
                                    showMilliseconds: false,
                                })}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                平均時間
                            </div>
                        </div>
                        <div className="p-1 bg-muted/30 rounded-lg">
                            <div className="text-xl font-bold">
                                {formatCurrency(summaryData.totalPay)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                総支給額
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ユーザー別の集計（管理者のみ） */}
            {isAdmin && summaryData.userSummary.length > 0 && (
                <Card>
                    <CardHeader className="">
                        <CardTitle className="text-lg">
                            ユーザー別の集計 {year}
                            <span className="text-xs">年</span>
                            {month}
                            <span className="text-xs">月</span>
                            <div className="text-xs float-right ml-auto inline-block">
                                <Button
                                    variant="default"
                                    onClick={handleExportCSV}
                                >
                                    勤務集計出力
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ユーザー</TableHead>
                                        <TableHead className="text-center">
                                            勤務日数
                                        </TableHead>
                                        <TableHead className="text-center">
                                            総時間
                                        </TableHead>
                                        <TableHead className="text-center">
                                            平均時間
                                        </TableHead>
                                        <TableHead className="text-center">
                                            支給額
                                        </TableHead>
                                        <TableHead className="text-center">
                                            詳細
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {summaryData.userSummary.map((user) => (
                                        <TableRow key={user.userId}>
                                            <TableCell className="font-medium">
                                                {user.userName}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {user.totalWorkingDays}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatTime(
                                                    user.totalWorkingTimeMs,
                                                    {
                                                        showSeconds: true,
                                                        showMilliseconds: false,
                                                    }
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {formatTime(
                                                    user.averageWorkingTimeMs,
                                                    {
                                                        showSeconds: true,
                                                        showMilliseconds: false,
                                                    }
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center font-medium">
                                                {formatCurrency(user.totalPay)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() =>
                                                        handleExportUserDetail(
                                                            user.userId,
                                                            user.userName
                                                        )
                                                    }
                                                >
                                                    <span className="sr-only">
                                                        Download CSV
                                                    </span>
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default DataDashboard;
