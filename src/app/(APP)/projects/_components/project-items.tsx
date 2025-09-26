"use client";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { projects } from "@/db/schema";
import React, { useState, useTransition } from "react";
import { MoreVerticalIcon } from "lucide-react";
import { updateProject } from "./project-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const ProjectItems = ({
    project,
}: {
    project: typeof projects.$inferSelect;
}) => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description ?? "");
    const [isActive, setIsActive] = useState(project.isActive);
    const [inactiveReason, setInactiveReason] = useState(
        project.inactiveReason ?? ""
    );
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const n = (name ?? "").trim();
        if (!n) {
            toast.error("名称は必須です");
            return;
        }
        if (!isActive && (inactiveReason ?? "").trim().length === 0) {
            toast.error("無効化理由を入力してください");
            return;
        }
        startTransition(async () => {
            updateProject(String(project.id), {
                name: n,
                description: (description ?? "").trim(),
                isActive,
                inactiveReason: isActive ? null : (inactiveReason ?? "").trim(),
            })
                .then(() => {
                    toast.success("プロジェクトを更新しました");
                    router.refresh();
                    setOpen(false);
                })
                .catch((error: unknown) => {
                    const message =
                        (error as { message?: string })?.message ?? "";
                    toast.error("更新に失敗しました", { description: message });
                });
        });
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>
                    {project.isActive ? "有効" : "無効"}
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
                                <DialogTitle>プロジェクトの編集</DialogTitle>
                                <DialogDescription>
                                    状態と説明を編集できます。
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={onSubmit} className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="name">名称</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="description">説明</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(e.target.value)
                                        }
                                        className="min-h-24"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="isActive"
                                        checked={isActive}
                                        onCheckedChange={(checked) =>
                                            setIsActive(checked as boolean)
                                        }
                                    />
                                    <Label htmlFor="isActive">有効にする</Label>
                                </div>
                                {!isActive && (
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="inactiveReason">
                                            無効化理由
                                        </Label>
                                        <Textarea
                                            id="inactiveReason"
                                            value={inactiveReason}
                                            onChange={(e) =>
                                                setInactiveReason(
                                                    e.target.value
                                                )
                                            }
                                            className="min-h-24"
                                            placeholder="必須"
                                        />
                                    </div>
                                )}
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
                <p className="text-sm text-muted-foreground">
                    {project.description}
                </p>
                {!project.isActive && project.inactiveReason && (
                    <p className="text-sm text-red-600">
                        無効化理由: {project.inactiveReason}
                    </p>
                )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <div className="w-full text-sm">
                    登録日時: {project.createdAt.toLocaleString()}
                </div>
                <div className="w-full text-sm">
                    更新日時: {project.updatedAt.toLocaleString()}
                </div>
            </CardFooter>
        </Card>
    );
};

export default ProjectItems;
