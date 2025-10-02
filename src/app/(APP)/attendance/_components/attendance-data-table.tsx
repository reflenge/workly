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
import type { AttendanceLogItem } from "./attendance-actions";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

interface AttendanceDataTableProps {
    data: AttendanceLogItem[];
    onUpdate: (args: {
        logId: string;
        target: "startedAt" | "endedAt";
        newDateTimeIso: string; // JST "YYYY-MM-DDTHH:MM"
        reason: string;
    }) => Promise<{ success: boolean; message: string }>;
}

export function AttendanceDataTable({
    data,
    onUpdate,
}: AttendanceDataTableProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [noteOpen, setNoteOpen] = useState(false);
    const [noteText, setNoteText] = useState<string>("");
    const [isPending, startTransition] = useTransition();
    const [editing, setEditing] = useState<{
        id: string;
        target: "startedAt" | "endedAt";
        iso: string;
        reason: string;
    } | null>(null);

    const openEdit = (
        log: AttendanceLogItem,
        target: "startedAt" | "endedAt"
    ) => {
        if (target === "endedAt" && !log.endedAt) return; // 進行中は編集不可
        const raw =
            target === "startedAt" ? log.startedAt : (log.endedAt as string);
        const d = new Date(raw);
        const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
        // UTC基準で秒を0に設定
        jst.setUTCSeconds(0, 0);
        const pad = (n: number) => String(n).padStart(2, "0");
        const local = `${jst.getUTCFullYear()}-${pad(
            jst.getUTCMonth() + 1
        )}-${pad(jst.getUTCDate())}T${pad(jst.getUTCHours())}:${pad(
            jst.getUTCMinutes()
        )}`;
        setEditing({ id: log.id, target, iso: local, reason: "" });
        setOpen(true);
    };

    const submit = () => {
        if (!editing || isPending) return;
        if (!editing.reason.trim()) return;
        startTransition(async () => {
            const result = await onUpdate({
                logId: editing.id,
                target: editing.target,
                newDateTimeIso: editing.iso,
                reason: editing.reason,
            });
            if (result.success) {
                toast.success("更新しました");
                setEditing(null);
                setOpen(false);
                router.refresh();
            } else {
                toast.error(result.message || "更新に失敗しました");
            }
        });
    };
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
        return new Date(dateString).toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="font-bold">ステータス</TableHead>
                        <TableHead className="font-bold">開始時刻</TableHead>
                        <TableHead className="font-bold">終了時刻</TableHead>
                        <TableHead>開始ソース</TableHead>
                        <TableHead>終了ソース</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={6}
                                className="text-center py-8 text-muted-foreground"
                            >
                                出勤記録がありません
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((log) => (
                            <TableRow key={log.id}>
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
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setNoteText(
                                                        log.note || "-"
                                                    );
                                                    setNoteOpen(true);
                                                }}
                                            >
                                                メモを表示
                                            </DropdownMenuItem>
                                            {log.endedAt && (
                                                <>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            openEdit(
                                                                log,
                                                                "startedAt"
                                                            )
                                                        }
                                                    >
                                                        開始時刻を修正
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            openEdit(
                                                                log,
                                                                "endedAt"
                                                            )
                                                        }
                                                    >
                                                        終了時刻を修正
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            {/* メモ表示 */}
            <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>メモ</DialogTitle>
                    </DialogHeader>
                    <div className="whitespace-pre-wrap text-sm">
                        {noteText || "-"}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setNoteOpen(false)}
                        >
                            閉じる
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            打刻の
                            {editing?.target === "startedAt" ? "開始" : "終了"}
                            時刻を修正
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label>日時（分単位、秒は0固定）</Label>
                            <Input
                                type="datetime-local"
                                value={editing ? editing.iso : ""}
                                onChange={(e) =>
                                    setEditing((prev) =>
                                        prev
                                            ? { ...prev, iso: e.target.value }
                                            : prev
                                    )
                                }
                                step={60}
                            />
                        </div>
                        <div>
                            <Label>理由（必須）</Label>
                            <Input
                                placeholder="理由を入力"
                                value={editing?.reason ?? ""}
                                onChange={(e) =>
                                    setEditing((p) =>
                                        p ? { ...p, reason: e.target.value } : p
                                    )
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            キャンセル
                        </Button>
                        <Button
                            onClick={submit}
                            disabled={isPending || !editing?.reason.trim()}
                        >
                            保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
