"use client";

import { cn, formatToJstDateTime } from "@/lib/utils";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import Link from "next/link";
import React, { useState, useTransition } from "react";
import { ChevronRightIcon, MoreVerticalIcon } from "lucide-react";
import { updateProjectBudget } from "./project-rate-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format, parse } from "date-fns";
import {
    formatCurrency,
    formatHours,
    formatPercent,
} from "@/components/attendance/format-utils";
import {
    type ProjectBudgetSummary,
    getStatusBadgeInfo,
} from "@/lib/budget/types";

const formatRate = (rate: string | null): string => {
    if (!rate) return "未設定";
    const n = Number(rate);
    return Number.isFinite(n) ? formatCurrency(n) : "未設定";
};

// 空文字 → null（未設定扱い）、それ以外 → 0以上の数値文字列であることを検証
const parseNonNegative = (s: string): string | null | "invalid" => {
    const trimmed = s.trim();
    if (trimmed === "") return null;
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n < 0) return "invalid";
    return String(n);
};

// バッファ率: 0以上1未満の小数。空欄は不可（DBに NOT NULL 制約があるため）
const parseBufferRatio = (s: string): string | "invalid" => {
    const trimmed = s.trim();
    if (trimmed === "") return "invalid";
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n < 0 || n >= 1) return "invalid";
    return String(n);
};

// DB の date カラム ("YYYY-MM-DD") <-> Date オブジェクトの相互変換
const stringToDate = (s: string | null): Date | undefined =>
    s ? parse(s, "yyyy-MM-dd", new Date()) : undefined;
const dateToString = (d: Date | undefined): string | null =>
    d ? format(d, "yyyy-MM-dd") : null;

const ProjectRateItems = ({ summary }: { summary: ProjectBudgetSummary }) => {
    const { project } = summary;
    const [open, setOpen] = useState(false);
    const [representativeRate, setRepresentativeRate] = useState<string>(
        project.representativeHourlyRate ?? ""
    );
    const [employeeRate, setEmployeeRate] = useState<string>(
        project.employeeHourlyRate ?? ""
    );
    const [estimatedHours, setEstimatedHours] = useState<string>(
        project.estimatedTotalHours ?? ""
    );
    const [estimatedAmount, setEstimatedAmount] = useState<string>(
        project.estimatedTotalAmount ?? ""
    );
    const [bufferRatio, setBufferRatio] = useState<string>(
        project.bufferRatio ?? "0.3"
    );
    const [startDate, setStartDate] = useState<Date | undefined>(
        stringToDate(project.startDate)
    );
    const [endDate, setEndDate] = useState<Date | undefined>(
        stringToDate(project.endDate)
    );

    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const repRateDisplay = formatRate(project.representativeHourlyRate);
    const empRateDisplay = formatRate(project.employeeHourlyRate);
    const statusBadge = getStatusBadgeInfo(summary.status);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const repValue = parseNonNegative(representativeRate);
        const empValue = parseNonNegative(employeeRate);
        const hoursValue = parseNonNegative(estimatedHours);
        const amountValue = parseNonNegative(estimatedAmount);
        const bufferValue = parseBufferRatio(bufferRatio);

        if (
            repValue === "invalid" ||
            empValue === "invalid" ||
            hoursValue === "invalid" ||
            amountValue === "invalid"
        ) {
            toast.error(
                "単価・見積もりは 0 以上の数値、または空欄を指定してください"
            );
            return;
        }
        if (bufferValue === "invalid") {
            toast.error(
                "バッファ率は 0 以上 1 未満（例: 0.3 = 30%）で指定してください"
            );
            return;
        }
        if (startDate && endDate && startDate > endDate) {
            toast.error("終了予定日は開始日以降を指定してください");
            return;
        }

        startTransition(async () => {
            updateProjectBudget(project.id, {
                representativeHourlyRate: repValue,
                employeeHourlyRate: empValue,
                estimatedTotalHours: hoursValue,
                estimatedTotalAmount: amountValue,
                bufferRatio: bufferValue,
                startDate: dateToString(startDate),
                endDate: dateToString(endDate),
            })
                .then(() => {
                    toast.success("プロジェクト設定を更新しました");
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
                <CardDescription className="flex items-center gap-2">
                    <span>{project.isActive ? "有効" : "無効"}</span>
                    <Badge className={cn("text-xs", statusBadge.className)}>
                        {statusBadge.emoji} {statusBadge.label}
                    </Badge>
                </CardDescription>
                <CardAction>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVerticalIcon />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    プロジェクト設定の編集
                                </DialogTitle>
                                <DialogDescription>
                                    {project.name} の単価・見積もり・期間を設定します。
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={onSubmit} className="space-y-6">
                                <section className="space-y-3">
                                    <h4 className="text-sm font-semibold">
                                        役職別の時給単価
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        請求書付きCSV出力で使用。空欄にすると未設定扱い。
                                    </p>
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
                                </section>

                                <Separator />

                                <section className="space-y-3">
                                    <h4 className="text-sm font-semibold">
                                        見積もり（バッファ込み）
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        クライアントとの契約値をそのまま入力。バッファ率から動的に警告閾値を算出します。
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="estimatedHours">
                                            見積もり総時間（h）
                                        </Label>
                                        <Input
                                            id="estimatedHours"
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={estimatedHours}
                                            onChange={(e) =>
                                                setEstimatedHours(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="例: 200"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="estimatedAmount">
                                            見積もり総金額（円）
                                        </Label>
                                        <Input
                                            id="estimatedAmount"
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={estimatedAmount}
                                            onChange={(e) =>
                                                setEstimatedAmount(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="例: 1000000"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="bufferRatio">
                                            バッファ率（0〜0.99、例: 0.3 = 30%）
                                        </Label>
                                        <Input
                                            id="bufferRatio"
                                            type="number"
                                            min="0"
                                            max="0.99"
                                            step="0.01"
                                            value={bufferRatio}
                                            onChange={(e) =>
                                                setBufferRatio(e.target.value)
                                            }
                                            placeholder="0.3"
                                        />
                                    </div>
                                </section>

                                <Separator />

                                <section className="space-y-3">
                                    <h4 className="text-sm font-semibold">
                                        プロジェクト期間
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        期間進捗との比較・ペース予測に使用。両方未設定の場合は予算管理対象外として扱われます。
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        <Label>開始日</Label>
                                        <DatePicker
                                            value={startDate}
                                            onChange={setStartDate}
                                            placeholder="開始日を選択"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label>終了予定日</Label>
                                        <DatePicker
                                            value={endDate}
                                            onChange={setEndDate}
                                            placeholder="終了予定日を選択"
                                        />
                                    </div>
                                </section>

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

                <Separator />

                {summary.isOutOfScope ? (
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p className="font-medium">💤 予算管理対象外</p>
                        <p className="text-xs">
                            見積もり時間・金額・期間のいずれかが未設定です。
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                期間進捗:
                            </span>
                            <span className="font-medium">
                                {formatPercent(summary.periodProgress ?? 0)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                時間消化:
                            </span>
                            <span className="font-medium">
                                {formatHours(summary.actualHours)} /{" "}
                                {formatHours(
                                    Number(project.estimatedTotalHours)
                                )}{" "}
                                ({formatPercent(summary.hoursConsumption ?? 0)})
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                金額消化:
                            </span>
                            <span className="font-medium">
                                {formatCurrency(summary.actualAmount)} /{" "}
                                {formatCurrency(
                                    Number(project.estimatedTotalAmount)
                                )}{" "}
                                ({formatPercent(summary.amountConsumption ?? 0)})
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                ペース予測:
                            </span>
                            <span className="font-medium">
                                終了時 {formatPercent(summary.paceProjection ?? 0)}
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <div className="w-full text-sm text-muted-foreground">
                    更新日時: {formatToJstDateTime(project.updatedAt)}
                </div>
                <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full"
                >
                    <Link href={`/admin/projects/${project.id}`}>
                        📊 詳細を見る
                        <ChevronRightIcon className="ml-1 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
};

export default ProjectRateItems;
