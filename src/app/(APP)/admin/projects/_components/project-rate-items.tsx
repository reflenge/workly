"use client";

import { cn } from "@/lib/utils";
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
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import Link from "next/link";
import React, { useState, useTransition } from "react";
import {
    ChevronRightIcon,
    CoinsIcon,
    MoreVerticalIcon,
    TrendingUpIcon,
} from "lucide-react";
import { updateProjectBudget } from "./project-rate-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format, parse } from "date-fns";
import { formatCurrency } from "@/components/attendance/format-utils";
import {
    type ProjectBudgetSummary,
    getStatusBadgeInfo,
} from "@/lib/budget/types";
import { BudgetGauge } from "./budget-gauge";
import { BudgetLandingBar } from "./budget-landing-bar";

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

    const [rateDialogOpen, setRateDialogOpen] = useState(false);
    const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);

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

    const runSave = (
        patch: Parameters<typeof updateProjectBudget>[1],
        successMsg: string,
        closeDialog: () => void
    ) => {
        startTransition(() => {
            updateProjectBudget(project.id, patch)
                .then(() => {
                    toast.success(successMsg);
                    router.refresh();
                    closeDialog();
                })
                .catch((error: unknown) => {
                    const message =
                        (error as { message?: string })?.message ?? "";
                    toast.error("更新に失敗しました", { description: message });
                });
        });
    };

    const resetRateFields = () => {
        setRepresentativeRate(project.representativeHourlyRate ?? "");
        setEmployeeRate(project.employeeHourlyRate ?? "");
    };

    const resetBudgetFields = () => {
        setEstimatedHours(project.estimatedTotalHours ?? "");
        setEstimatedAmount(project.estimatedTotalAmount ?? "");
        setBufferRatio(project.bufferRatio ?? "0.3");
        setStartDate(stringToDate(project.startDate));
        setEndDate(stringToDate(project.endDate));
    };

    const onRateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const repValue = parseNonNegative(representativeRate);
        const empValue = parseNonNegative(employeeRate);
        if (repValue === "invalid" || empValue === "invalid") {
            toast.error("単価は 0 以上の数値、または空欄を指定してください");
            return;
        }
        runSave(
            {
                representativeHourlyRate: repValue,
                employeeHourlyRate: empValue,
            },
            "単価を更新しました",
            () => setRateDialogOpen(false)
        );
    };

    const onBudgetSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const hoursValue = parseNonNegative(estimatedHours);
        const amountValue = parseNonNegative(estimatedAmount);
        const bufferValue = parseBufferRatio(bufferRatio);
        if (hoursValue === "invalid" || amountValue === "invalid") {
            toast.error(
                "見積もりは 0 以上の数値、または空欄を指定してください"
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
        runSave(
            {
                estimatedTotalHours: hoursValue,
                estimatedTotalAmount: amountValue,
                bufferRatio: bufferValue,
                startDate: dateToString(startDate),
                endDate: dateToString(endDate),
            },
            "予算設定を更新しました",
            () => setBudgetDialogOpen(false)
        );
    };

    const renderDialogActions = (onCancel: () => void) => (
        <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={onCancel}>
                キャンセル
            </Button>
            <Button type="submit" disabled={isPending}>
                {isPending ? "保存中..." : "保存"}
            </Button>
        </div>
    );

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0">
                        {project.isActive ? "有効" : "無効"}
                    </span>
                    <Badge
                        className={cn("text-xs shrink-0", statusBadge.className)}
                    >
                        {statusBadge.emoji} {statusBadge.label}
                    </Badge>
                    {project.description && (
                        // カード幅に収まらない分は ... で省略。全文は詳細ページで確認できる
                        <span className="min-w-0 flex-1 truncate">
                            {project.description}
                        </span>
                    )}
                </CardDescription>
                <CardAction>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVerticalIcon />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => setRateDialogOpen(true)}
                            >
                                <CoinsIcon className="mr-2 h-4 w-4" />
                                単価を編集
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setBudgetDialogOpen(true)}
                            >
                                <TrendingUpIcon className="mr-2 h-4 w-4" />
                                予算を編集
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
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
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-1">
                            <BudgetGauge
                                value={summary.periodProgress ?? 0}
                                label="期間進捗"
                                color="#3b82f6"
                            />
                            <BudgetGauge
                                value={summary.hoursConsumption ?? 0}
                                label="時間消化"
                                color="#06b6d4"
                            />
                            <BudgetGauge
                                value={summary.amountConsumption ?? 0}
                                label="金額消化"
                                color="#f59e0b"
                            />
                        </div>
                        <Separator />
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">
                                着地予測
                            </p>
                            <BudgetLandingBar
                                value={summary.paceProjection ?? 0}
                                thresholds={summary.thresholds!}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter>
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

            <Dialog
                open={rateDialogOpen}
                onOpenChange={(o) => {
                    setRateDialogOpen(o);
                    if (!o) resetRateFields();
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>単価の編集</DialogTitle>
                        <DialogDescription>
                            {project.name} の役職別時給単価を設定します。請求書付きCSV出力で使用。空欄にすると未設定扱い。
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={onRateSubmit} className="space-y-4">
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
                                    setRepresentativeRate(e.target.value)
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
                        {renderDialogActions(() => setRateDialogOpen(false))}
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={budgetDialogOpen}
                onOpenChange={(o) => {
                    setBudgetDialogOpen(o);
                    if (!o) resetBudgetFields();
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>予算の編集</DialogTitle>
                        <DialogDescription>
                            {project.name} の見積もり総量・期間・バッファ率を設定します。バッファ率から動的に警告閾値を算出。
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={onBudgetSubmit} className="space-y-6">
                        <section className="space-y-3">
                            <h4 className="text-sm font-semibold">
                                見積もり（バッファ込み）
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                クライアントとの契約値をそのまま入力。
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
                                        setEstimatedHours(e.target.value)
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
                                        setEstimatedAmount(e.target.value)
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
                                期間進捗との比較・着地予測に使用。両方未設定の場合は予算管理対象外として扱われます。
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

                        {renderDialogActions(() => setBudgetDialogOpen(false))}
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default ProjectRateItems;
