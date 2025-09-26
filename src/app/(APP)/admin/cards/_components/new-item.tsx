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
import React, { useState, useTransition } from "react";
import { createCard } from "./card-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const NewItem = () => {
    const [uid, setUid] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const handleSubmit = (e: React.FormEvent) => {
        // これはフォームのデフォルト送信（ページリロード）を防ぐための処理です
        e.preventDefault();

        // trim() は文字列の先頭と末尾の空白文字（スペースやタブ、改行など）を取り除きます。
        const trimmed = uid.trim();
        if (!trimmed) {
            return;
        }

        startTransition(async () => {
            createCard(trimmed)
                .then(() => {
                    toast.success("カードが登録されました");
                    setUid("");
                    router.refresh();
                })
                .catch((error) => {
                    console.error(
                        "カードの追加中にエラーが発生しました:",
                        error
                    );
                    toast.error("カードの登録に失敗しました", {
                        description: error.message,
                    });
                });
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Card 登録</CardTitle>
                    <CardDescription>
                        新しいNFCカードのUIDを入力して登録します。
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="uid" className="font-medium">
                            カードUID
                        </label>
                        <input
                            id="uid"
                            type="text"
                            value={uid}
                            onChange={(e) => setUid(e.target.value)}
                            className="border rounded px-2 py-1"
                            required
                            placeholder="カードのUIDを入力"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        type="submit"
                        disabled={isPending || !uid}
                        className="w-full"
                    >
                        {isPending ? "登録中..." : "Card 登録"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
};

export default NewItem;
