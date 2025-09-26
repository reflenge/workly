"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createCompensation } from "./compensation-actions";

const CompensationForm = ({ userId }: { userId: string }) => {
    const [isHourly, setIsHourly] = useState(true);
    const [isMonthly, setIsMonthly] = useState(false);
    const [hourlyRate, setHourlyRate] = useState("");
    const [monthlySalary, setMonthlySalary] = useState("");
    const [currency, setCurrency] = useState("JPY");
    const [effectiveFrom, setEffectiveFrom] = useState<Date | undefined>(
        new Date()
    );
    const [effectiveTo, setEffectiveTo] = useState<Date | undefined>(undefined);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isHourly && !hourlyRate.trim()) {
            toast.error("時給を入力してください");
            return;
        }
        if (isMonthly && !monthlySalary.trim()) {
            toast.error("月給を入力してください");
            return;
        }

        startTransition(async () => {
            createCompensation({
                userId,
                isHourly,
                isMonthly,
                hourlyRate: isHourly ? hourlyRate : null,
                monthlySalary: isMonthly ? monthlySalary : null,
                currency,
                effectiveFrom: effectiveFrom!,
                effectiveTo: effectiveTo || null,
            })
                .then(() => {
                    toast.success("給与設定を作成しました");
                    // フォームリセット
                    setHourlyRate("");
                    setMonthlySalary("");
                    setEffectiveFrom(new Date());
                    setEffectiveTo(undefined);
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
        <Card>
            <CardHeader>
                <CardTitle>給与設定作成</CardTitle>
                <CardDescription>
                    <span className="text-red-600">
                        一度設定したあとは変更できません。間違えて設定した場合はシステム管理者まで。
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <input
                                id="isHourly"
                                type="checkbox"
                                checked={isHourly}
                                onChange={(e) => {
                                    setIsHourly(e.target.checked);
                                    if (e.target.checked) setIsMonthly(false);
                                }}
                            />
                            <label htmlFor="isHourly" className="font-medium">
                                時給制
                            </label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                id="isMonthly"
                                type="checkbox"
                                checked={isMonthly}
                                onChange={(e) => {
                                    setIsMonthly(e.target.checked);
                                    if (e.target.checked) setIsHourly(false);
                                }}
                            />
                            <label htmlFor="isMonthly" className="font-medium">
                                月給制
                            </label>
                        </div>
                    </div>

                    {isHourly && (
                        <div className="flex flex-col gap-2">
                            <label htmlFor="hourlyRate" className="font-medium">
                                時給
                            </label>
                            <input
                                id="hourlyRate"
                                type="number"
                                value={hourlyRate}
                                onChange={(e) => setHourlyRate(e.target.value)}
                                className="border rounded px-2 py-1"
                                placeholder="1000"
                                step="0.01"
                                min="0"
                            />
                        </div>
                    )}

                    {isMonthly && (
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="monthlySalary"
                                className="font-medium"
                            >
                                月給
                            </label>
                            <input
                                id="monthlySalary"
                                type="number"
                                value={monthlySalary}
                                onChange={(e) =>
                                    setMonthlySalary(e.target.value)
                                }
                                className="border rounded px-2 py-1"
                                placeholder="300000"
                                step="0.01"
                                min="0"
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label htmlFor="currency" className="font-medium">
                            通貨
                        </label>
                        <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger>
                                <SelectValue placeholder="通貨を選択" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="JPY">JPY</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="effectiveFrom" className="font-medium">
                            適用開始日
                        </label>
                        <DatePicker
                            value={effectiveFrom}
                            onChange={setEffectiveFrom}
                            placeholder="適用開始日を選択"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="effectiveTo" className="font-medium">
                            適用終了日（任意）
                        </label>
                        <DatePicker
                            value={effectiveTo}
                            onChange={setEffectiveTo}
                            placeholder="適用終了日を選択（任意）"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full"
                    >
                        {isPending ? "作成中..." : "作成"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default CompensationForm;
