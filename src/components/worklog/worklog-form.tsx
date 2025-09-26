"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import {
    createWorkLog,
    getRecentAttendanceLogs,
    getActiveProjects,
} from "@/lib/worklog/worklog-actions";
import { FileTextIcon } from "lucide-react";

interface WorkLogFormProps {
    userId: string;
}

interface AttendanceLog {
    id: string;
    statusCode: string;
    statusLabel: string;
    startedAt: Date;
    endedAt: Date | null;
}

interface Project {
    id: string;
    name: string;
}

const WorkLogForm = ({ userId }: WorkLogFormProps) => {
    const [attendanceLogId, setAttendanceLogId] = useState("");
    const [projectId, setProjectId] = useState("");
    const [content, setContent] = useState("");
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    // データを取得
    const fetchData = async () => {
        try {
            console.log("Fetching data for userId:", userId);
            const [logs, projs] = await Promise.all([
                getRecentAttendanceLogs(userId),
                getActiveProjects(),
            ]);

            console.log("Fetched logs:", logs);
            console.log("Fetched projects:", projs);

            setAttendanceLogs(logs);
            setProjects(projs);

            // デフォルト値を設定
            if (logs.length > 0 && !attendanceLogId) {
                setAttendanceLogId(logs[0].id);
            }
            if (projs.length > 0 && !projectId) {
                setProjectId(projs[0].id);
            }
        } catch (error) {
            console.error("データの取得に失敗:", error);
            toast.error("データの取得に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!attendanceLogId || !projectId || !content.trim()) {
            toast.error("すべての項目を入力してください");
            return;
        }

        startTransition(async () => {
            const result = await createWorkLog({
                userId,
                attendanceLogId,
                projectId,
                content: content.trim(),
            });

            if (result.success) {
                toast.success(result.message);
                setContent(""); // フォームをリセット
            } else {
                toast.error(result.message);
            }
        });
    };

    const formatAttendanceLog = (log: AttendanceLog) => {
        const startDate = new Date(log.startedAt).toLocaleDateString();
        const startTime = new Date(log.startedAt).toLocaleTimeString();
        const endTime = log.endedAt
            ? `${new Date(log.endedAt).toLocaleDateString()} ${new Date(
                  log.endedAt
              ).toLocaleTimeString()}`
            : "進行中";
        return `${log.statusLabel} (${startDate} ${startTime} - ${endTime})`;
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
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
                    <div className="flex flex-col gap-2">
                        <label htmlFor="attendanceLog" className="font-medium">
                            出勤記録 <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="attendanceLog"
                            value={attendanceLogId}
                            onChange={(e) => setAttendanceLogId(e.target.value)}
                            className="border rounded px-3 py-2"
                            required
                        >
                            <option value="">
                                出勤記録を選択 ({attendanceLogs.length}件)
                            </option>
                            {attendanceLogs.map((log) => (
                                <option key={log.id} value={log.id}>
                                    {formatAttendanceLog(log)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="project" className="font-medium">
                            プロジェクト <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="project"
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            className="border rounded px-3 py-2"
                            required
                        >
                            <option value="">
                                プロジェクトを選択 ({projects.length}件)
                            </option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="content" className="font-medium">
                            作業内容 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="作業内容を入力してください"
                            className="border rounded px-3 py-2 min-h-[100px] resize-y"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isPending}
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
