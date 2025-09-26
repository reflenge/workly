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
import { createUser } from "./user-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const NewItem = () => {
    const [lastName, setLastName] = useState("");
    const [firstName, setFirstName] = useState("");
    const [email, setEmail] = useState("");
    const [isPending, startTransition] = useTransition();
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const ln = lastName.trim();
        const fn = firstName.trim();
        const em = email.trim();
        if (!ln || !fn || !em) {
            return;
        }

        startTransition(async () => {
            createUser({ lastName: ln, firstName: fn, email: em, isAdmin })
                .then(() => {
                    toast.success("ユーザーを登録しました");
                    setLastName("");
                    setFirstName("");
                    setEmail("");
                    setIsAdmin(false);
                    router.refresh();
                })
                .catch((error: unknown) => {
                    console.error(
                        "ユーザー登録中にエラーが発生しました:",
                        error
                    );
                    const message =
                        (error as { message?: string })?.message ?? "";
                    toast.error("ユーザーの登録に失敗しました", {
                        description: message,
                    });
                });
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>User 登録</CardTitle>
                    <CardDescription>
                        姓名とメールアドレスを入力して新しいユーザーを作成します。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="lastName" className="font-medium">
                                姓
                            </label>
                            <input
                                id="lastName"
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="border rounded px-2 py-1"
                                required
                                placeholder="山田"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="firstName" className="font-medium">
                                名
                            </label>
                            <input
                                id="firstName"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="border rounded px-2 py-1"
                                required
                                placeholder="太郎"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="email" className="font-medium">
                                メールアドレス
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="border rounded px-2 py-1"
                                required
                                placeholder="taro@example.com"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                id="isAdmin"
                                type="checkbox"
                                checked={isAdmin}
                                onChange={(e) => setIsAdmin(e.target.checked)}
                            />
                            <label htmlFor="isAdmin" className="font-medium">
                                管理者にする
                            </label>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        type="submit"
                        disabled={
                            isPending || !lastName || !firstName || !email
                        }
                        className="w-full"
                    >
                        {isPending ? "登録中..." : "User 登録"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
};

export default NewItem;
