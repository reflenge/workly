"use client";

import { users } from "@/db/schema";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { MoreVerticalIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateUser } from "./user-actions";
import Link from "next/link";

const UserItems = ({ user }: { user: typeof users.$inferSelect }) => {
    const [open, setOpen] = useState(false);
    const [lastName, setLastName] = useState<string>(user.lastName ?? "");
    const [firstName, setFirstName] = useState<string>(user.firstName ?? "");
    const [isActive, setIsActive] = useState<boolean>(user.isActive);
    const [isAdmin, setIsAdmin] = useState<boolean>(user.isAdmin);
    const [bio, setBio] = useState<string>(user.bio ?? "");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const ln = (lastName ?? "").trim();
        const fn = (firstName ?? "").trim();
        if (!ln || !fn) {
            toast.error("姓・名は必須です");
            return;
        }

        startTransition(async () => {
            updateUser(String(user.id), {
                lastName: ln,
                firstName: fn,
                isActive,
                isAdmin,
                bio,
            })
                .then(() => {
                    toast.success("ユーザー情報を更新しました");
                    router.refresh();
                    setOpen(false);
                })
                .catch((error) => {
                    console.error(
                        "ユーザー更新中にエラーが発生しました:",
                        error
                    );
                    toast.error("更新に失敗しました", {
                        description: error?.message,
                    });
                });
        });
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>
                    {user.lastName} {user.firstName}
                </CardTitle>
                <CardDescription>
                    {user.isActive ? "有効" : "無効"}
                </CardDescription>
                <CardAction>
                    <div className="flex gap-2">
                        <Link href={`/admin/users/${user.id}`}>
                            <Button
                                variant="ghost"
                                size="icon"
                                title="詳細・給与設定"
                            >
                                <UserIcon />
                            </Button>
                        </Link>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVerticalIcon />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        ユーザー情報の編集
                                    </DialogTitle>
                                    <DialogDescription>
                                        ステータス・プロフィールを編集できます。
                                    </DialogDescription>
                                </DialogHeader>
                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="lastName">姓</Label>
                                            <Input
                                                id="lastName"
                                                type="text"
                                                value={lastName}
                                                onChange={(e) =>
                                                    setLastName(e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="firstName">
                                                名
                                            </Label>
                                            <Input
                                                id="firstName"
                                                type="text"
                                                value={firstName}
                                                onChange={(e) =>
                                                    setFirstName(e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="isActive"
                                            checked={isActive}
                                            onCheckedChange={(checked) =>
                                                setIsActive(checked as boolean)
                                            }
                                        />
                                        <Label htmlFor="isActive">
                                            有効にする
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="isAdmin"
                                            checked={isAdmin}
                                            onCheckedChange={(checked) =>
                                                setIsAdmin(checked as boolean)
                                            }
                                        />
                                        <Label htmlFor="isAdmin">
                                            管理者にする
                                        </Label>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="bio">
                                            プロフィール
                                        </Label>
                                        <Textarea
                                            id="bio"
                                            value={bio}
                                            onChange={(e) =>
                                                setBio(e.target.value)
                                            }
                                            className="min-h-24"
                                            placeholder="自己紹介など"
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
                                        <Button
                                            type="submit"
                                            disabled={isPending}
                                        >
                                            {isPending ? "保存中..." : "保存"}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardAction>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{user.bio}</p>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <div className="w-full text-sm">
                    登録日時: {formatToJstDateTime(user.createdAt)}
                </div>
                <div className="w-full text-sm">
                    更新日時: {formatToJstDateTime(user.updatedAt)}
                </div>
            </CardFooter>
        </Card>
    );
};

export default UserItems;
