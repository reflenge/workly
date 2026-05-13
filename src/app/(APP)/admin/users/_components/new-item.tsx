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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RoleSelect } from "./role-select";
import { userRole } from "@/db/schema";
import React, { useState, useTransition } from "react";
import { createUser } from "./user-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const NewItem = ({
    userRoles,
}: {
    userRoles: (typeof userRole.$inferSelect)[];
}) => {
    // 新規ユーザーのデフォルト役職は EMPLOYEE。schema 側の users.role_id の DEFAULT 2 と同義
    const defaultRoleId =
        userRoles.find((r) => r.code === "EMPLOYEE")?.id ??
        userRoles[0]?.id ??
        0;

    const [lastName, setLastName] = useState("");
    const [firstName, setFirstName] = useState("");
    const [email, setEmail] = useState("");
    const [isPending, startTransition] = useTransition();
    const [isAdmin, setIsAdmin] = useState(false);
    const [roleId, setRoleId] = useState<number>(defaultRoleId);
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
            createUser({
                lastName: ln,
                firstName: fn,
                email: em,
                isAdmin,
                roleId,
            })
                .then(() => {
                    toast.success("ユーザーを登録しました");
                    setLastName("");
                    setFirstName("");
                    setEmail("");
                    setIsAdmin(false);
                    setRoleId(defaultRoleId);
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
                            <Label htmlFor="lastName">姓</Label>
                            <Input
                                id="lastName"
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                placeholder="山田"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="firstName">名</Label>
                            <Input
                                id="firstName"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                placeholder="太郎"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="email">メールアドレス</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="taro@example.com"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="isAdmin"
                                checked={isAdmin}
                                onCheckedChange={(checked) =>
                                    setIsAdmin(checked as boolean)
                                }
                            />
                            <Label htmlFor="isAdmin">管理者にする</Label>
                        </div>
                        <RoleSelect
                            id="roleId"
                            value={roleId}
                            onChange={setRoleId}
                            userRoles={userRoles}
                        />
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
