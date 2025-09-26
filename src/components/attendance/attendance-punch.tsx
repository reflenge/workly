"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useTransition, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
    recordAttendance,
    getCurrentAttendance,
    AttendanceAction,
} from "@/lib/attendance/attendance-actions";
import { ClockIcon, PlayIcon, PauseIcon, SquareIcon } from "lucide-react";
import WorkLogForm from "@/components/worklog/worklog-form";

interface AttendancePunchProps {
    userId: string;
}

interface CurrentAttendance {
    id: string;
    statusCode: string;
    statusLabel: string;
    startedAt: Date;
    note: string | null;
}

const AttendancePunch = ({ userId }: AttendancePunchProps) => {
    const [currentAttendance, setCurrentAttendance] =
        useState<CurrentAttendance | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);

    // 現在の打刻状況を取得
    const fetchCurrentAttendance = useCallback(async () => {
        try {
            const attendance = await getCurrentAttendance(userId);
            setCurrentAttendance(attendance);
        } catch (error) {
            console.error("打刻状況の取得に失敗:", error);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchCurrentAttendance();
    }, [userId, fetchCurrentAttendance]);

    const handlePunch = (action: AttendanceAction) => {
        startTransition(async () => {
            const result = await recordAttendance({
                userId,
                action,
                source: "WEB",
            });

            if (result.success) {
                toast.success(result.message);
                await fetchCurrentAttendance(); // 状態を更新
            } else {
                toast.error(result.message);
            }
        });
    };

    const getStatusColor = (statusCode: string) => {
        switch (statusCode) {
            case "WORKING":
                return "bg-blue-100 text-blue-800";
            case "BREAK":
                return "bg-yellow-100 text-yellow-800";
            case "OFF":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusIcon = (statusCode: string) => {
        switch (statusCode) {
            case "WORKING":
                return <PlayIcon className="w-4 h-4" />;
            case "BREAK":
                return <PauseIcon className="w-4 h-4" />;
            case "OFF":
                return <SquareIcon className="w-4 h-4" />;
            default:
                return <ClockIcon className="w-4 h-4" />;
        }
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
        <div className="space-y-4">
            {/* 現在の状況 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClockIcon className="w-5 h-5" />
                        現在の状況
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {currentAttendance ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
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
                                <span className="text-sm text-gray-500">
                                    開始:{" "}
                                    {new Date(
                                        currentAttendance.startedAt
                                    ).toLocaleString()}
                                </span>
                            </div>
                            {currentAttendance.note && (
                                <p className="text-sm text-gray-600">
                                    メモ: {currentAttendance.note}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500">
                            現在打刻中ではありません
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* 打刻ボタン */}
            <Card>
                <CardHeader>
                    <CardTitle>打刻</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                        <Button
                            onClick={() => handlePunch("WORKING")}
                            disabled={isPending}
                            className="w-full h-12 text-lg"
                            variant={
                                currentAttendance?.statusCode === "WORKING"
                                    ? "default"
                                    : "outline"
                            }
                        >
                            <PlayIcon className="w-5 h-5 mr-2" />
                            勤務開始
                        </Button>
                        <Button
                            onClick={() => handlePunch("BREAK")}
                            disabled={isPending}
                            className="w-full h-12 text-lg"
                            variant={
                                currentAttendance?.statusCode === "BREAK"
                                    ? "default"
                                    : "outline"
                            }
                        >
                            <PauseIcon className="w-5 h-5 mr-2" />
                            休憩開始
                        </Button>
                        <Button
                            onClick={() => handlePunch("OFF")}
                            disabled={isPending}
                            className="w-full h-12 text-lg"
                            variant={
                                currentAttendance?.statusCode === "OFF"
                                    ? "default"
                                    : "outline"
                            }
                        >
                            <SquareIcon className="w-5 h-5 mr-2" />
                            退勤
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 作業ログフォーム */}
            <WorkLogForm userId={userId} />
        </div>
    );
};

export default AttendancePunch;
