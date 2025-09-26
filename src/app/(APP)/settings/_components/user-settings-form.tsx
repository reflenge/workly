"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateUserSettings } from "./user-settings-actions";
import { users } from "@/db/schema";

type User = typeof users.$inferSelect;

const UserSettingsForm = ({ user }: { user: User }) => {
    const [lastName, setLastName] = useState(user.lastName);
    const [firstName, setFirstName] = useState(user.firstName);
    const [lastNameKana, setLastNameKana] = useState(user.lastNameKana || "");
    const [firstNameKana, setFirstNameKana] = useState(
        user.firstNameKana || ""
    );
    const [bio, setBio] = useState(user.bio || "");
    const [iconUrl, setIconUrl] = useState(user.iconUrl || "");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!lastName.trim() || !firstName.trim()) {
            toast.error("姓と名は必須です");
            return;
        }

        startTransition(async () => {
            updateUserSettings({
                userId: user.id,
                lastName: lastName.trim(),
                firstName: firstName.trim(),
                lastNameKana: lastNameKana.trim() || null,
                firstNameKana: firstNameKana.trim() || null,
                bio: bio.trim() || null,
                iconUrl: iconUrl.trim() || null,
            })
                .then(() => {
                    toast.success("設定を更新しました");
                    router.refresh();
                })
                .catch((error: unknown) => {
                    const message =
                        (error as { message?: string })?.message ??
                        "設定の更新に失敗しました";
                    toast.error(message);
                });
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>プロフィール設定</CardTitle>
                <CardDescription>
                    あなたのプロフィール情報を更新できます
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="lastName">
                                姓 <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="姓を入力"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="firstName">
                                名 <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="名を入力"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="lastNameKana">姓（カナ）</Label>
                            <Input
                                id="lastNameKana"
                                value={lastNameKana}
                                onChange={(e) =>
                                    setLastNameKana(e.target.value)
                                }
                                placeholder="姓（カナ）を入力"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="firstNameKana">名（カナ）</Label>
                            <Input
                                id="firstNameKana"
                                value={firstNameKana}
                                onChange={(e) =>
                                    setFirstNameKana(e.target.value)
                                }
                                placeholder="名（カナ）を入力"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="bio">自己紹介</Label>
                        <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="自己紹介を入力"
                            className="min-h-[100px] resize-y"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="iconUrl">
                            アイコンURL（プレビュー付き）
                        </Label>
                        <Input
                            id="iconUrl"
                            value={iconUrl}
                            onChange={(e) => setIconUrl(e.target.value)}
                            placeholder="アイコン画像のURLを入力"
                        />
                        {iconUrl && (
                            <div className="mt-2">
                                <span className="text-sm text-gray-500">
                                    プレビュー:
                                </span>
                                <div className="mt-1">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={iconUrl}
                                        alt="アイコンプレビュー"
                                        className="w-20 h-20 rounded-full border object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src =
                                                "https://placehold.co/80x80?text=No+Image";
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full"
                    >
                        {isPending ? "更新中..." : "設定を更新"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default UserSettingsForm;
