// クライアントコンポーネントとして実行
"use client";

// UIコンポーネントのインポート
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// React Hooks
import { useState, useTransition, useEffect, useCallback } from "react";
// トースト通知ライブラリ
import { toast } from "sonner";
// 勤務打刻関連のサーバーアクション
import {
    recordAttendance, // 打刻記録関数
    getCurrentAttendance, // 現在の打刻状況取得関数
    AttendanceAction, // 打刻アクション型
} from "./attendance-actions";
// Lucide React アイコン
import { ClockIcon, PlayIcon, PauseIcon, SquareIcon } from "lucide-react";

/**
 * 勤務打刻コンポーネントのプロパティ
 */
interface AttendancePunchProps {
    userId: string; // ユーザーID
}

/**
 * 現在の打刻状況の型定義
 */
interface CurrentAttendance {
    id: string; // ログID
    statusCode: string; // ステータスコード（WORKING、BREAK、OFF）
    statusLabel: string; // ステータスラベル（勤務、休憩、退勤）
    startedAt: Date; // 開始時刻
    note: string | null; // メモ（オプション）
}

/**
 * 勤務打刻コンポーネント
 * 勤務開始、休憩、退勤の打刻機能を提供
 *
 * @param userId ユーザーID
 */
const AttendancePunch = ({ userId }: AttendancePunchProps) => {
    // ===== 状態管理 =====
    // 現在の打刻状況（進行中の打刻ログ）
    const [currentAttendance, setCurrentAttendance] =
        useState<CurrentAttendance | null>(null);
    // 非同期処理の進行状態（useTransition用）
    const [isPending, startTransition] = useTransition();
    // 初期データ読み込み状態
    const [isLoading, setIsLoading] = useState(true);

    // ===== 現在の打刻状況を取得する関数 =====
    const fetchCurrentAttendance = useCallback(async () => {
        try {
            // サーバーアクションで現在の打刻状況を取得
            const attendance = await getCurrentAttendance(userId);
            setCurrentAttendance(attendance);
        } catch (error) {
            console.error("打刻状況の取得に失敗:", error);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // ===== コンポーネントマウント時に現在の打刻状況を取得 =====
    useEffect(() => {
        fetchCurrentAttendance();
    }, [userId, fetchCurrentAttendance]);

    // ===== 打刻ボタンクリック時の処理 =====
    const handlePunch = (action: AttendanceAction) => {
        // useTransitionで非同期処理を実行（UIブロックを防ぐ）
        startTransition(async () => {
            // サーバーアクションで打刻を記録
            const result = await recordAttendance({
                userId, // ユーザーID
                action, // 打刻アクション（WORKING、BREAK、OFF）
                source: "WEB", // 打刻ソース（WEBアプリケーションから）
            });

            if (result.success) {
                // 成功時：成功メッセージを表示
                toast.success(result.message);
                // 現在の打刻状況を再取得して状態を更新
                await fetchCurrentAttendance();
            } else {
                // 失敗時：エラーメッセージを表示
                toast.error(result.message);
            }
        });
    };

    // ===== ステータスに応じたバッジの色を取得 =====
    const getStatusColor = (statusCode: string) => {
        switch (statusCode) {
            case "WORKING":
                return "bg-blue-100 text-blue-800"; // 勤務中：青
            case "BREAK":
                return "bg-yellow-100 text-yellow-800"; // 休憩中：黄
            case "OFF":
                return "bg-gray-100 text-gray-800"; // 退勤：グレー
            default:
                return "bg-gray-100 text-gray-800"; // デフォルト：グレー
        }
    };

    // ===== ステータスに応じたアイコンを取得 =====
    const getStatusIcon = (statusCode: string) => {
        switch (statusCode) {
            case "WORKING":
                return <PlayIcon className="w-4 h-4" />; // 勤務中：再生アイコン
            case "BREAK":
                return <PauseIcon className="w-4 h-4" />; // 休憩中：一時停止アイコン
            case "OFF":
                return <SquareIcon className="w-4 h-4" />; // 退勤：停止アイコン
            default:
                return <ClockIcon className="w-4 h-4" />; // デフォルト：時計アイコン
        }
    };

    // ===== ローディング状態の表示 =====
    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    {/* スピナーアニメーション */}
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">読み込み中...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            {/* ===== 現在の打刻状況表示カード ===== */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClockIcon className="w-5 h-5" />
                        現在の状況
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {currentAttendance ? (
                        // 進行中の打刻がある場合
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                {/* ステータスバッジ（色とアイコン付き） */}
                                <Badge
                                    className={getStatusColor(
                                        currentAttendance.statusCode
                                    )}
                                >
                                    {getStatusIcon(
                                        currentAttendance.statusCode
                                    )}
                                    <span className="ml-1">
                                        {currentAttendance.statusLabel}
                                    </span>
                                </Badge>
                                {/* 開始時刻の表示 */}
                                <span className="text-sm text-gray-500">
                                    開始:{" "}
                                    {new Date(
                                        currentAttendance.startedAt
                                    ).toLocaleString()}
                                </span>
                            </div>
                            {/* メモがある場合の表示 */}
                            {currentAttendance.note && (
                                <p className="text-sm text-gray-600">
                                    メモ: {currentAttendance.note}
                                </p>
                            )}
                        </div>
                    ) : (
                        // 進行中の打刻がない場合
                        <p className="text-gray-500">
                            現在打刻中ではありません
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* ===== 打刻ボタンカード ===== */}
            <Card>
                <CardHeader>
                    <CardTitle>打刻</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                        {/* 勤務開始ボタン */}
                        <Button
                            onClick={() => handlePunch("WORKING")}
                            disabled={
                                isPending ||
                                currentAttendance?.statusCode === "WORKING"
                            }
                            className="w-full h-12 text-lg"
                            variant={
                                currentAttendance?.statusCode === "WORKING"
                                    ? "outline" // 現在勤務中の場合はアウトライン
                                    : "default" // それ以外は強調表示
                            }
                        >
                            <PlayIcon className="w-5 h-5 mr-2" />
                            勤務開始
                        </Button>

                        {/* 休憩開始ボタン */}
                        <Button
                            onClick={() => handlePunch("BREAK")}
                            disabled={
                                isPending ||
                                currentAttendance?.statusCode === "BREAK"
                            }
                            className="w-full h-12 text-lg"
                            variant={
                                currentAttendance?.statusCode === "BREAK"
                                    ? "outline" // 現在勤務中の場合はアウトライン
                                    : "default" // それ以外は強調表示
                            }
                        >
                            <PauseIcon className="w-5 h-5 mr-2" />
                            休憩開始
                        </Button>

                        {/* 退勤ボタン */}
                        <Button
                            onClick={() => handlePunch("OFF")}
                            disabled={
                                isPending ||
                                currentAttendance?.statusCode === "OFF"
                            }
                            className="w-full h-12 text-lg"
                            variant={
                                currentAttendance?.statusCode === "OFF"
                                    ? "outline" // 現在勤務中の場合はアウトライン
                                    : "default" // それ以外は強調表示
                            }
                        >
                            <SquareIcon className="w-5 h-5 mr-2" />
                            退勤
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </>
    );
};

export default AttendancePunch;
