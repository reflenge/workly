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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createProject } from "./project-actions";

const NewItem = () => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const n = name.trim();
        if (!n) return;
        startTransition(async () => {
            createProject({ name: n, description: description.trim() })
                .then(() => {
                    toast.success("プロジェクトを作成しました");
                    setName("");
                    setDescription("");
                    router.refresh();
                })
                .catch((error: unknown) => {
                    const message =
                        (error as { message?: string })?.message ?? "";
                    toast.error("作成に失敗しました", { description: message });
                });
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>プロジェクト作成</CardTitle>
                    <CardDescription>名称と説明を入力します。</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="name" className="font-medium">
                                名称
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="border rounded px-2 py-1"
                                required
                                placeholder="新規プロジェクト"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="description"
                                className="font-medium"
                            >
                                説明（任意）
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="border rounded px-2 py-1 min-h-24"
                                placeholder="概要"
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        type="submit"
                        disabled={isPending || !name.trim()}
                        className="w-full"
                    >
                        {isPending ? "作成中..." : "作成"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
};

export default NewItem;
