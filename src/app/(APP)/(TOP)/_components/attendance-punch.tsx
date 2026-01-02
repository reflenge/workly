// クライアントコンポーネントとして実行
"use client";

// UIコンポーネントのインポート
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
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
import { formatToJstDateTime } from "@/lib/utils";
// Lucide React アイコン
import {
    ClockIcon,
    PlayIcon,
    PauseIcon,
    SquareIcon,
    RefreshCcwIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

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
    // 経過時間の状態
    const [elapsedTime, setElapsedTime] = useState<string>("");

    const router = useRouter();

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

    // ===== 経過時間を計算・更新する関数 =====
    const updateElapsedTime = useCallback(() => {
        if (!currentAttendance) {
            setElapsedTime("");
            return;
        }

        const now = new Date();
        const startTime = new Date(currentAttendance.startedAt);
        const diffMs = now.getTime() - startTime.getTime();

        if (diffMs < 0) {
            setElapsedTime("00:00:00");
            return;
        }

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        setElapsedTime(formattedTime);
    }, [currentAttendance]);

    // ===== コンポーネントマウント時に現在の打刻状況を取得 =====
    useEffect(() => {
        fetchCurrentAttendance();
    }, [userId, fetchCurrentAttendance]);

    // ===== 経過時間の定期更新 =====
    useEffect(() => {
        if (!currentAttendance) {
            setElapsedTime("");
            return;
        }

        // 初回実行
        updateElapsedTime();

        // 1秒ごとに更新
        const interval = setInterval(updateElapsedTime, 1000);

        return () => clearInterval(interval);
    }, [currentAttendance, updateElapsedTime]);

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
                router.refresh();
            } else {
                // 失敗時：エラーメッセージを表示
                // console.error(result.message);
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

    // ===== ボタンの有効/無効状態を判定 =====
    const isButtonEnabled = (action: AttendanceAction) => {
        if (isPending) return false; // 処理中は全て無効

        if (!currentAttendance) {
            // 打刻中でない場合は勤務開始のみ有効
            return action === "WORKING";
        }

        const currentStatus = currentAttendance.statusCode;
        switch (currentStatus) {
            case "WORKING":
                // 出勤時は休憩・退勤のみ有効
                return action === "BREAK" || action === "OFF";
            case "BREAK":
                // 休憩時は出勤・退勤のみ有効
                return action === "WORKING" || action === "OFF";
            case "OFF":
                // 退勤時は出勤のみ有効
                return action === "WORKING";
            default:
                return true; // 不明な状態の場合は全て有効
        }
    };

    // ===== ローディング状態の表示 =====
    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <RefreshCcwIcon className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                        読み込み中...
                    </p>
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
                                    {formatToJstDateTime(
                                        currentAttendance.startedAt
                                    )}
                                </span>
                            </div>
                            {/* 経過時間の表示 */}
                            {elapsedTime && (
                                <div className="flex items-center gap-2">
                                    <ClockIcon className="w-4 h-4 text-blue-600" />
                                    <span className="text-lg font-semibold text-blue-600">
                                        経過時間: {elapsedTime}
                                    </span>
                                </div>
                            )}
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
                            disabled={!isButtonEnabled("WORKING")}
                            className="w-full h-12 text-lg"
                            variant={
                                isButtonEnabled("WORKING")
                                    ? "default"
                                    : "outline"
                            }
                        >
                            {isPending ? (
                                <RefreshCcwIcon className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                                <PlayIcon className="w-5 h-5 mr-2" />
                            )}
                            勤務開始
                        </Button>

                        {/* 休憩開始ボタン */}
                        <Button
                            onClick={() => handlePunch("BREAK")}
                            disabled={!isButtonEnabled("BREAK")}
                            className="w-full h-12 text-lg"
                            variant={
                                isButtonEnabled("BREAK") ? "default" : "outline"
                            }
                        >
                            {isPending ? (
                                <RefreshCcwIcon className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                                <PauseIcon className="w-5 h-5 mr-2" />
                            )}
                            休憩開始
                        </Button>

                        {/* 退勤ボタン */}
                        <Button
                            onClick={() => handlePunch("OFF")}
                            disabled={!isButtonEnabled("OFF")}
                            className="w-full h-12 text-lg"
                            variant={
                                isButtonEnabled("OFF") ? "default" : "outline"
                            }
                        >
                            {isPending ? (
                                <RefreshCcwIcon className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                                <SquareIcon className="w-5 h-5 mr-2" />
                            )}
                            退勤
                        </Button>
                    </div>
                </CardContent>

                {/* 注意事項フッター */}
                <CardFooter className="">
                    <div className="flex items-center gap-3 w-full">
                        {/* 時計アイコン */}
                        <ClockIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />

                        {/* 注意メッセージ */}
                        <span className="text-blue-900 text-sm">
                            休憩から勤務に戻るときも
                            <span className="font-semibold underline decoration-blue-300 decoration-2 underline-offset-2 mx-1">
                                勤務開始
                            </span>
                            ボタンを押してください。
                        </span>
                    </div>
                </CardFooter>
            </Card>
        </>
    );
};

export default AttendancePunch;
