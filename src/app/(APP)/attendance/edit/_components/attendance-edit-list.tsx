"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { formatToJstDateTime } from "@/lib/utils";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateAttendanceLog } from "../actions";
import { toast } from "sonner";
import { DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquareText, Info } from "lucide-react";

export interface AttendanceLog {
    id: string;
    startedAt: Date;
    endedAt: Date | null;
    statusId: number;
    statusLabel: string;
    note: string | null;
}

interface AttendanceEditListProps {
    logs: AttendanceLog[];
}

export function AttendanceEditList({ logs }: AttendanceEditListProps) {
    const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Note View Dialog State
    const [viewNoteLog, setViewNoteLog] = useState<AttendanceLog | null>(null);
    const [isViewNoteDialogOpen, setIsViewNoteDialogOpen] = useState(false);

    // Form states
    const [startedAt, setStartedAt] = useState<string>("");
    const [endedAt, setEndedAt] = useState<string>("");
    const [note, setNote] = useState<string>("");
    const [reason, setReason] = useState<string>("");
    const [adjustAdjacent, setAdjustAdjacent] = useState<boolean>(true);

    const handleEditClick = (log: AttendanceLog) => {
        setSelectedLog(log);
        // datetime-local用にフォーマット (YYYY-MM-DDThh:mm)
        setStartedAt(format(new Date(log.startedAt), "yyyy-MM-dd'T'HH:mm"));
        setEndedAt(
            log.endedAt
                ? format(new Date(log.endedAt), "yyyy-MM-dd'T'HH:mm")
                : ""
        );
        setNote(log.note || "");
        setReason(""); // 理由は毎回リセット
        setAdjustAdjacent(true); // デフォルトで有効
        setIsDialogOpen(true);
    };

    const handleViewNoteClick = (log: AttendanceLog) => {
        setViewNoteLog(log);
        setIsViewNoteDialogOpen(true);
    };

    const handleSave = async () => {
        if (!selectedLog) return;

        if (!reason.trim()) {
            toast.error("修正理由を入力してください");
            return;
        }

        setIsSaving(true);
        try {
            const result = await updateAttendanceLog({
                id: selectedLog.id,
                startedAt: new Date(startedAt),
                endedAt: endedAt ? new Date(endedAt) : null,
                note: note || null,
                reason: reason,
                adjustAdjacent,
            });

            if (result.success) {
                toast.success(result.message);
                setIsDialogOpen(false);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("予期せぬエラーが発生しました");
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusVariant = (statusId: number) => {
        if (statusId === 2) return "default";
        if (statusId === 3) return "secondary";
        return "destructive";
    };

    return (
        <>
            <div className="mb-6 rounded-md bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">編集時の注意点</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>最新の5件まで編集可能です</li>
                            <li>時間をクリックして編集してください</li>
                            <li>現在のレコードは修正できません</li>
                        </ul>
                        <p className="text-xs pt-1">
                            ※ 前の月のレコードを編集する場合は、管理者に連絡して許可を得てから実行してください
                        </p>
                    </div>
                </div>
            </div>
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>状態</TableHead>
                            <TableHead>開始時刻</TableHead>
                            <TableHead>終了時刻</TableHead>
                            <TableHead>メモ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length > 0 ? (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(log.statusId)}>
                                            {log.statusLabel}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {log.endedAt ? (
                                            <Button
                                                variant="link"
                                                className="p-0 h-auto font-normal"
                                                onClick={() => handleEditClick(log)}
                                            >
                                                {formatToJstDateTime(log.startedAt)}
                                            </Button>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                {formatToJstDateTime(log.startedAt)}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {log.endedAt ? (
                                            <Button
                                                variant="link"
                                                className="p-0 h-auto font-normal"
                                                onClick={() => handleEditClick(log)}
                                            >
                                                {formatToJstDateTime(log.endedAt)}
                                            </Button>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {log.note ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleViewNoteClick(log)}
                                            >
                                                <MessageSquareText className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    履歴がありません。
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>勤怠ログ修正</DialogTitle>
                        <DialogDescription>
                            勤怠ログの内容を修正します。
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="reason" className="text-destructive">修正理由 (必須)</Label>
                                <Input
                                    id="reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="修正理由を入力してください"
                                    required
                                />
                            </div>
                            <div className="flex items-center space-x-2 py-2">
                                <Checkbox
                                    id="adjustAdjacent"
                                    checked={adjustAdjacent}
                                    onCheckedChange={(checked) =>
                                        setAdjustAdjacent(checked as boolean)
                                    }
                                />
                                <Label
                                    htmlFor="adjustAdjacent"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    前後のレコードも自動調整する
                                </Label>
                            </div>
                            {(() => {
                                const current = new Date();
                                const logDate = new Date(selectedLog.startedAt);
                                // UTC timestamp + 9 hours to get JST time components via getUTC* methods
                                const currentJst = new Date(current.getTime() + 9 * 60 * 60 * 1000);
                                const logJst = new Date(logDate.getTime() + 9 * 60 * 60 * 1000);

                                const isDifferentMonth =
                                    currentJst.getUTCFullYear() !== logJst.getUTCFullYear() ||
                                    currentJst.getUTCMonth() !== logJst.getUTCMonth();

                                if (isDifferentMonth) {
                                    return (
                                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                            <p className="font-medium">
                                                注意: このレコードは現在の月と異なります。
                                            </p>
                                            <p>管理者に連絡して許可を得ましたか？</p>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                            <div className="grid gap-2">
                                <Label htmlFor="startedAt">開始時刻</Label>
                                <Input
                                    id="startedAt"
                                    type="datetime-local"
                                    value={startedAt}
                                    onChange={(e) =>
                                        setStartedAt(e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endedAt">終了時刻</Label>
                                <Input
                                    id="endedAt"
                                    type="datetime-local"
                                    value={endedAt}
                                    onChange={(e) => setEndedAt(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isSaving}
                        >
                            キャンセル
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? "保存中..." : "保存する"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isViewNoteDialogOpen} onOpenChange={setIsViewNoteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>メモ詳細</DialogTitle>
                    </DialogHeader>
                    {viewNoteLog && (
                        <div className="grid gap-4 py-4">
                            <div className="whitespace-pre-wrap text-sm">
                                {viewNoteLog.note}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsViewNoteDialogOpen(false)}
                        >
                            閉じる
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
