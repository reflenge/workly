"use client";

import { formatToJstDateTime } from "@/lib/utils";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { MoreVerticalIcon } from "lucide-react";
import React, { useState, useTransition } from "react";
import { unlink } from "./link-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Row = {
    assignmentId: string;
    assignedAt: Date;
    user: {
        id: string;
        lastName: string;
        firstName: string;
    };
    card: {
        id: string;
        uid: string;
    };
    assignedByName?: string;
    unassignedAt?: Date;
    unassignedByName?: string;
    reason?: string | null;
};

const LinkItems = ({ row }: { row: Row }) => {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [setCardInactive, setSetCardInactive] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const isInactive = !!row.unassignedAt;

    const onUnlink = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = reason.trim();
        if (!trimmed) {
            toast.error("解除理由は必須です");
            return;
        }
        startTransition(async () => {
            unlink(row.assignmentId, trimmed, { setCardInactive })
                .then(() => {
                    toast.success("リンクを解除しました");
                    setOpen(false);
                    router.refresh();
                })
                .catch((error: unknown) => {
                    const msg = (error as { message?: string })?.message ?? "";
                    toast.error("解除に失敗しました", { description: msg });
                });
        });
    };

    return (
        <Card className={`w-full ${isInactive ? "opacity-60" : ""}`}>
            <CardHeader>
                <CardTitle>
                    {row.user.lastName} {row.user.firstName}
                </CardTitle>
                <CardDescription>{row.card.uid}</CardDescription>
                <CardAction>
                    {!isInactive && (
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVerticalIcon />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>リンク解除</DialogTitle>
                                    <DialogDescription>
                                        理由を入力して解除します（任意）。
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={onUnlink} className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <label
                                            htmlFor="reason"
                                            className="font-medium"
                                        >
                                            理由
                                        </label>
                                        <input
                                            id="reason"
                                            type="text"
                                            value={reason}
                                            onChange={(e) =>
                                                setReason(e.target.value)
                                            }
                                            className="border rounded px-2 py-1"
                                            placeholder="必須: 紛失・返却など"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="setCardInactive"
                                            type="checkbox"
                                            checked={setCardInactive}
                                            onChange={(e) =>
                                                setSetCardInactive(
                                                    e.target.checked
                                                )
                                            }
                                        />
                                        <label
                                            htmlFor="setCardInactive"
                                            className="font-medium"
                                        >
                                            カードを無効化する（紛失・破損 等）
                                        </label>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setOpen(false)}
                                            disabled={isPending}
                                        >
                                            キャンセル
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={
                                                isPending || !reason.trim()
                                            }
                                        >
                                            {isPending ? "解除中..." : "解除"}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </CardAction>
            </CardHeader>
            <CardContent>
                <div className="text-sm">
                    割当日時: {formatToJstDateTime(row.assignedAt)}
                </div>
                {row.assignedByName && (
                    <div className="text-sm">実施者: {row.assignedByName}</div>
                )}
                {row.unassignedAt && (
                    <div className="text-sm">
                        解除日時: {formatToJstDateTime(row.unassignedAt)}
                    </div>
                )}
                {row.unassignedByName && (
                    <div className="text-sm">
                        解除実施者: {row.unassignedByName}
                    </div>
                )}
                {row.reason && (
                    <div className="text-sm">理由: {row.reason}</div>
                )}
            </CardContent>
            <CardFooter></CardFooter>
        </Card>
    );
};

export default LinkItems;
