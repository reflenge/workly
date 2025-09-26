"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React, { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createLink } from "./link-actions";

type UserOption = { id: string; lastName: string; firstName: string };
type CardOption = { id: string; uid: string };

const NewItem = ({
    users,
    cards,
}: {
    users: UserOption[];
    cards: CardOption[];
}) => {
    const firstUserId = useMemo(() => users[0]?.id ?? "", [users]);
    const firstCardUid = useMemo(() => cards[0]?.uid ?? "", [cards]);
    const [userId, setUserId] = useState(firstUserId);
    const [cardUid, setCardUid] = useState(firstCardUid);
    const [reason, setReason] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const u = userId.trim();
        const c = cardUid.trim();
        if (!u || !c) return;

        startTransition(async () => {
            createLink({ userId: u, cardUid: c, reason: reason.trim() })
                .then(() => {
                    toast.success("リンクを作成しました");
                    // 先頭候補へリセット（props 変更後も useEffect で追随）
                    setUserId(firstUserId);
                    setCardUid(firstCardUid);
                    setReason("");
                    router.refresh();
                })
                .catch((error: unknown) => {
                    const message =
                        (error as { message?: string })?.message ?? "";
                    toast.error("リンクの作成に失敗しました", {
                        description: message,
                    });
                });
        });
    };

    // 候補が更新されたら、存在しない値を先頭候補に合わせる
    useEffect(() => {
        if (!users.find((u) => u.id === userId)) {
            setUserId(firstUserId);
        }
    }, [users, userId, firstUserId]);
    useEffect(() => {
        if (!cards.find((c) => c.uid === cardUid)) {
            setCardUid(firstCardUid);
        }
    }, [cards, cardUid, firstCardUid]);

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>リンク作成</CardTitle>
                    <CardDescription>
                        ユーザーとカードを紐づけます。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="userId" className="font-medium">
                                ユーザー
                            </label>
                            <select
                                id="userId"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="border rounded px-2 py-1"
                                required
                            >
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.lastName} {u.firstName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="cardUid" className="font-medium">
                                カード
                            </label>
                            <select
                                id="cardUid"
                                value={cardUid}
                                onChange={(e) => setCardUid(e.target.value)}
                                className="border rounded px-2 py-1"
                                required
                            >
                                {cards.map((c) => (
                                    <option key={c.id} value={c.uid}>
                                        {c.uid}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="reason" className="font-medium">
                                理由（任意）
                            </label>
                            <input
                                id="reason"
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="border rounded px-2 py-1"
                                placeholder="replace / lost など"
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        type="submit"
                        disabled={
                            isPending ||
                            !userId ||
                            !cardUid ||
                            users.length === 0 ||
                            cards.length === 0
                        }
                        className="w-full"
                    >
                        {isPending ? "作成中..." : "リンク作成"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
};

export default NewItem;
