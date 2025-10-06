"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatToJstDateTime } from "@/lib/utils";
import { useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCcwIcon } from "lucide-react";
import type { AdminAttendanceLogItem } from "./admin-attendance-actions";

interface AdminAttendanceDataTableProps {
    data: AdminAttendanceLogItem[];
    users: Array<{ id: string; name: string; isActive: boolean }>;
    statuses: Array<{ id: number; code: string; label: string }>;
    year: number;
    month: number;
    selectedUserId?: string;
    selectedStatusId?: number;
    onFilterChange: (filters: {
        year: number;
        month: number;
        userId?: string;
        statusId?: number;
    }) => void;
    loading?: boolean;
}

export function AdminAttendanceDataTable({
    data,
    users,
    statuses,
    year,
    month,
    selectedUserId,
    selectedStatusId,
    onFilterChange,
    loading = false,
}: AdminAttendanceDataTableProps) {
    const [localUserId, setLocalUserId] = useState(selectedUserId || "all");
    const [localStatusId, setLocalStatusId] = useState(
        selectedStatusId?.toString() || "all"
    );

    const getStatusBadgeVariant = (statusId: number) => {
        switch (statusId) {
            case 1:
                return "destructive"; // 退勤
            case 2:
                return "default"; // 出勤中
            case 3:
                return "secondary"; // 休憩中
            default:
                return "outline"; // その他
        }
    };

    const formatDateTime = (dateString: string) => {
        return formatToJstDateTime(dateString);
    };

    const handleFilterChange = () => {
        onFilterChange({
            year,
            month,
            userId: localUserId !== "all" ? localUserId : undefined,
            statusId:
                localStatusId !== "all" ? Number(localStatusId) : undefined,
        });
    };

    const handleMonthChange = (direction: "prev" | "next") => {
        const newDate = new Date(
            year,
            month - 1 + (direction === "next" ? 1 : -1),
            1
        );
        onFilterChange({
            year: newDate.getFullYear(),
            month: newDate.getMonth() + 1,
            userId: localUserId !== "all" ? localUserId : undefined,
            statusId:
                localStatusId !== "all" ? Number(localStatusId) : undefined,
        });
    };

    const clearFilters = () => {
        setLocalUserId("all");
        setLocalStatusId("all");
        onFilterChange({
            year,
            month,
        });
    };

    return (
        <div className="space-y-4">
            {/* フィルターコントロール */}
            <div className="flex flex-wrap gap-4 items-end p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleMonthChange("prev")}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-lg font-semibold min-w-[120px] text-center">
                        {year}年{month}月
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleMonthChange("next")}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="user-filter">ユーザー</Label>
                    <Select value={localUserId} onValueChange={setLocalUserId}>
                        <SelectTrigger>
                            <SelectValue placeholder="全ユーザー" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全ユーザー</SelectItem>
                            {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                    {user.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1 min-w-[150px]">
                    <Label htmlFor="status-filter">ステータス</Label>
                    <Select
                        value={localStatusId}
                        onValueChange={setLocalStatusId}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="全ステータス" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全ステータス</SelectItem>
                            {statuses.map((status) => (
                                <SelectItem
                                    key={status.id}
                                    value={status.id.toString()}
                                >
                                    {status.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-2">
                    <Button onClick={handleFilterChange} size="sm">
                        フィルター適用
                    </Button>
                    <Button onClick={clearFilters} variant="outline" size="sm">
                        クリア
                    </Button>
                </div>
            </div>

            {/* データテーブル */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="font-bold">
                                ユーザー
                            </TableHead>
                            <TableHead className="font-bold">
                                ステータス
                            </TableHead>
                            <TableHead className="font-bold">
                                開始時刻
                            </TableHead>
                            <TableHead className="font-bold">
                                終了時刻
                            </TableHead>
                            <TableHead>開始ソース</TableHead>
                            <TableHead>終了ソース</TableHead>
                            <TableHead>メモ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <RefreshCcwIcon className="w-5 h-5 animate-spin" />
                                        読み込み中...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    出勤記録がありません
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-semibold text-foreground">
                                        {log.userLastName} {log.userFirstName}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={getStatusBadgeVariant(
                                                log.statusId
                                            )}
                                        >
                                            {log.statusLabel}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-semibold text-foreground">
                                        {formatDateTime(log.startedAt)}
                                    </TableCell>
                                    <TableCell className="font-semibold text-foreground">
                                        {log.endedAt ? (
                                            formatDateTime(log.endedAt)
                                        ) : (
                                            <span className="text-muted-foreground">
                                                未終了
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {log.startedSourceLabel}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {log.endedSourceLabel || "-"}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                        {log.note || "-"}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* 件数表示 */}
            <div className="text-sm text-muted-foreground text-center">
                全{data.length}件の記録を表示中
            </div>
        </div>
    );
}
