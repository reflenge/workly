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
import { projects } from "@/db/schema";
import React, { useState, useTransition } from "react";
import { MoreVerticalIcon } from "lucide-react";
import { updateProjectRates } from "./project-rate-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/components/attendance/format-utils";

const formatRate = (rate: string | null): string => {
    if (!rate) return "未設定";
    const n = Number(rate);
    return Number.isFinite(n) ? formatCurrency(n) : "未設定";
};

const ProjectRateItems = ({
    project,
}: {
    project: typeof projects.$inferSelect;
}) => {
    const [open, setOpen] = useState(false);
    const [representativeRate, setRepresentativeRate] = useState<string>(
        project.representativeHourlyRate ?? ""
    );
    const [employeeRate, setEmployeeRate] = useState<string>(
        project.employeeHourlyRate ?? ""
    );
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const repRateDisplay = formatRate(project.representativeHourlyRate);
    const empRateDisplay = formatRate(project.employeeHourlyRate);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 空文字 → null（未設定扱い）、それ以外 → 0以上の数値であることを検証
        const parseRate = (s: string): string | null | "invalid" => {
            const trimmed = s.trim();
            if (trimmed === "") return null;
            const n = Number(trimmed);
            if (!Number.isFinite(n) || n < 0) return "invalid";
            return String(n);
        };

        const repValue = parseRate(representativeRate);
        const empValue = parseRate(employeeRate);

        if (repValue === "invalid" || empValue === "invalid") {
            toast.error("単価は 0 以上の数値、または空欄を指定してください");
            return;
        }

        startTransition(async () => {
            updateProjectRates(project.id, {
                representativeHourlyRate: repValue,
                employeeHourlyRate: empValue,
            })
                .then(() => {
                    toast.success("単価を更新しました");
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
                                <DialogTitle>役職別単価の編集</DialogTitle>
                                <DialogDescription>
                                    {project.name} の役職別時給単価を設定します。
                                    空欄にすると未設定になり、請求書計算から除外されます。
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={onSubmit} className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="representativeRate">
                                        代表の時給単価（円）
                                    </Label>
                                    <Input
                                        id="representativeRate"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={representativeRate}
                                        onChange={(e) =>
                                            setRepresentativeRate(
                                                e.target.value
                                            )
                                        }
                                        placeholder="未設定の場合は空欄"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="employeeRate">
                                        その他従業員の時給単価（円）
                                    </Label>
                                    <Input
                                        id="employeeRate"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={employeeRate}
                                        onChange={(e) =>
                                            setEmployeeRate(e.target.value)
                                        }
                                        placeholder="未設定の場合は空欄"
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
            <CardContent className="space-y-3">
                {project.description && (
                    <p className="text-sm text-muted-foreground">
                        {project.description}
                    </p>
                )}
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">代表:</span>
                        <span className="font-medium">
                            {repRateDisplay}
                            <span className="text-xs text-muted-foreground ml-1">
                                / 時
                            </span>
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            その他従業員:
                        </span>
                        <span className="font-medium">
                            {empRateDisplay}
                            <span className="text-xs text-muted-foreground ml-1">
                                / 時
                            </span>
                        </span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <div className="w-full text-sm text-muted-foreground">
                    更新日時: {formatToJstDateTime(project.updatedAt)}
                </div>
            </CardFooter>
        </Card>
    );
};

export default ProjectRateItems;
