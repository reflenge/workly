// クライアントコンポーネントとして実行
"use client";

// UIコンポーネントのインポート
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatToJstDateTime } from "@/lib/utils";
// React Hooks
import { useState, useTransition, useEffect, useCallback } from "react";
// トースト通知ライブラリ
import { toast } from "sonner";
// 作業ログ関連のサーバーアクション
import {
    createWorkLog, // 作業ログ作成関数
    getRecentAttendanceLogs, // 直近の勤務記録取得関数
    getActiveProjects, // アクティブなプロジェクト取得関数
} from "./worklog-actions";
// Lucide React アイコン
import { FileTextIcon } from "lucide-react";

/**
 * 作業ログフォームコンポーネントのプロパティ
 */
interface WorkLogFormProps {
    userId: string; // ユーザーID
}

/**
 * 勤務記録の型定義
 */
interface AttendanceLog {
    id: string; // 勤務ログID
    statusCode: string; // ステータスコード
    statusLabel: string; // ステータスラベル
    startedAt: Date; // 開始時刻
    endedAt: Date | null; // 終了時刻（nullの場合は進行中）
}

/**
 * プロジェクトの型定義
 */
interface Project {
    id: string; // プロジェクトID
    name: string; // プロジェクト名
}

/**
 * 作業ログフォームコンポーネント
 * 勤務時間とプロジェクトを選択して作業内容を記録
 *
 * @param userId ユーザーID
 */
const WorkLogForm = ({ userId }: WorkLogFormProps) => {
    // ===== 状態管理 =====
    // フォームの入力値
    const [attendanceLogId, setAttendanceLogId] = useState(""); // 選択された勤務記録ID
    const [projectId, setProjectId] = useState(""); // 選択されたプロジェクトID
    const [content, setContent] = useState(""); // 作業内容
    // 非同期処理の進行状態（useTransition用）
    const [isPending, startTransition] = useTransition();
    // 初期データ読み込み状態
    const [isLoading, setIsLoading] = useState(true);
    // 取得したデータ
    const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]); // 勤務記録一覧
    const [projects, setProjects] = useState<Project[]>([]); // プロジェクト一覧

    // ===== データ取得関数 =====
    const fetchData = useCallback(async () => {
        try {
            // console.log("Fetching data for userId:", userId);

            // 並列で勤務記録とプロジェクトを取得（パフォーマンス向上）
            const [logs, projs] = await Promise.all([
                getRecentAttendanceLogs(userId), // 直近の勤務記録を取得
                getActiveProjects(), // アクティブなプロジェクトを取得
            ]);

            // console.log("Fetched logs:", logs);
            // console.log("Fetched projects:", projs);

            // 取得したデータを状態に設定
            setAttendanceLogs(logs);
            setProjects(projs);

            // デフォルト値を設定（初回のみ）
            if (logs.length > 0 && !attendanceLogId) {
                setAttendanceLogId(logs[0].id); // 最新の勤務記録を選択
            }
            if (projs.length > 0 && !projectId) {
                setProjectId(projs[0].id); // 最初のプロジェクトを選択
            }
        } catch (error) {
            console.error("データの取得に失敗:", error);
            toast.error("データの取得に失敗しました");
        } finally {
            setIsLoading(false);
        }
    }, [userId, attendanceLogId, projectId]);

    // ===== コンポーネントマウント時にデータを取得 =====
    useEffect(() => {
        fetchData();
    }, [userId, fetchData]);

    // ===== フォーム送信処理 =====
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // デフォルトのフォーム送信を防ぐ

        // バリデーション：すべての項目が入力されているかチェック
        if (!attendanceLogId || !projectId || !content.trim()) {
            toast.error("すべての項目を入力してください");
            return;
        }

        // useTransitionで非同期処理を実行（UIブロックを防ぐ）
        startTransition(async () => {
            // サーバーアクションで作業ログを作成
            const result = await createWorkLog({
                userId, // ユーザーID
                attendanceLogId, // 勤務記録ID
                projectId, // プロジェクトID
                content: content.trim(), // 作業内容（前後の空白を除去）
            });

            if (result.success) {
                // 成功時：成功メッセージを表示してフォームをリセット
                toast.success(result.message);
                setContent(""); // 作業内容フィールドをクリア
            } else {
                // 失敗時：エラーメッセージを表示
                toast.error(result.message);
            }
        });
    };

    // ===== 勤務記録の表示用フォーマット関数 =====
    const formatAttendanceLog = (log: AttendanceLog) => {
        const startDateTime = formatToJstDateTime(log.startedAt); // 開始日時
        const endTime = log.endedAt
            ? formatToJstDateTime(log.endedAt) // 終了日時
            : "進行中"; // 終了していない場合は「進行中」
        return `${log.statusLabel} (${startDateTime} - ${endTime})`;
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileTextIcon className="w-5 h-5" />
                    作業ログ
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ===== 勤務記録選択 ===== */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="attendanceLog">
                            出勤記録 <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={attendanceLogId}
                            onValueChange={setAttendanceLogId}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={`出勤記録を選択 (${attendanceLogs.length}件)`}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {/* 勤務記録の選択肢を表示 */}
                                {attendanceLogs.map((log) => (
                                    <SelectItem key={log.id} value={log.id}>
                                        {formatAttendanceLog(log)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ===== プロジェクト選択 ===== */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="project">
                            プロジェクト <span className="text-red-500">*</span>
                        </Label>
                        <Select value={projectId} onValueChange={setProjectId}>
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={`プロジェクトを選択 (${projects.length}件)`}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {/* プロジェクトの選択肢を表示 */}
                                {projects.map((project) => (
                                    <SelectItem
                                        key={project.id}
                                        value={project.id}
                                    >
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ===== 作業内容入力 ===== */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="content">
                            作業内容 <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="作業内容を入力してください"
                            className="min-h-[100px] resize-y" // 最小高さ100px、縦方向のみリサイズ可能
                            required
                        />
                    </div>

                    {/* ===== 送信ボタン ===== */}
                    <Button
                        type="submit"
                        disabled={isPending} // 処理中は無効化
                        className="w-full"
                    >
                        {isPending ? "作成中..." : "作業ログを作成"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default WorkLogForm;
