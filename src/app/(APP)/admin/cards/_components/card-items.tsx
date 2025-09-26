"use client";

import { cards } from "@/db/schema";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { MoreVerticalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateCard } from "./card-actions";

const CardItems = ({ card }: { card: typeof cards.$inferSelect }) => {
    const [open, setOpen] = useState(false);
    const [isActive, setIsActive] = useState<boolean>(card.isActive);
    const [inactiveReason, setInactiveReason] = useState<string>(
        card.inactiveReason ?? ""
    );
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedReason = (inactiveReason ?? "").trim();

        if (!isActive && trimmedReason.length === 0) {
            toast.error("無効化理由を入力してください");
            return;
        }

        startTransition(async () => {
            updateCard(String(card.id), isActive, isActive ? "" : trimmedReason)
                .then(() => {
                    toast.success("カード情報を更新しました");
                    router.refresh();
                    setOpen(false);
                })
                .catch((error) => {
                    console.error("カード更新中にエラーが発生しました:", error);
                    toast.error("更新に失敗しました", {
                        description: error?.message,
                    });
                });
        });
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{card.uid}</CardTitle>
                <CardDescription>
                    {card.isActive ? "有効" : "無効"}
                </CardDescription>
                <CardAction>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVerticalIcon />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>カード情報の編集</DialogTitle>
                                <DialogDescription>
                                    ステータスと無効化理由を編集できます。
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        id="isActive"
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) =>
                                            setIsActive(e.target.checked)
                                        }
                                    />
                                    <label
                                        htmlFor="isActive"
                                        className="font-medium"
                                    >
                                        有効にする
                                    </label>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label
                                        htmlFor="inactiveReason"
                                        className="font-medium"
                                    >
                                        無効化理由
                                    </label>
                                    <textarea
                                        id="inactiveReason"
                                        value={inactiveReason}
                                        onChange={(e) =>
                                            setInactiveReason(e.target.value)
                                        }
                                        className="border rounded px-2 py-1 min-h-24"
                                        placeholder="無効化する場合は理由を入力"
                                        disabled={isActive}
                                    />
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
                                    <Button type="submit" disabled={isPending}>
                                        {isPending ? "保存中..." : "保存"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardAction>
            </CardHeader>
            <CardContent>
                <p>{card.inactiveReason}</p>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <div className="w-full text-sm">
                    登録日時: {card.createdAt.toLocaleString()}
                </div>
                <div className="w-full text-sm">
                    更新日時: {card.updatedAt.toLocaleString()}
                </div>
            </CardFooter>
        </Card>
    );
};

export default CardItems;
