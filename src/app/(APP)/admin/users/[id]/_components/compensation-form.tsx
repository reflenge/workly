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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
    const [effectiveFrom, setEffectiveFrom] = useState<Date | undefined>(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });
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
                    const today = new Date();
                    setEffectiveFrom(
                        new Date(today.getFullYear(), today.getMonth(), 1)
                    );
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
                            <Checkbox
                                id="isHourly"
                                checked={isHourly}
                                // onCheckedChange={(checked) => {
                                //     setIsHourly(checked as boolean);
                                //     if (checked) setIsMonthly(false);
                                // }}
                            />
                            <Label htmlFor="isHourly">時給制</Label>
                        </div>
                        {/* <div className="flex items-center gap-2">
                            <Checkbox
                                id="isMonthly"
                                checked={isMonthly}
                                onCheckedChange={(checked) => {
                                    setIsMonthly(checked as boolean);
                                    if (checked) setIsHourly(false);
                                }}
                            />
                            <Label htmlFor="isMonthly">月給制</Label>
                        </div> */}
                    </div>

                    {isHourly && (
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="hourlyRate">時給</Label>
                            <Input
                                id="hourlyRate"
                                type="number"
                                value={hourlyRate}
                                onChange={(e) => setHourlyRate(e.target.value)}
                                placeholder="1000"
                                step="0.01"
                                min="0"
                            />
                        </div>
                    )}

                    {isMonthly && (
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="monthlySalary">月給</Label>
                            <Input
                                id="monthlySalary"
                                type="number"
                                value={monthlySalary}
                                onChange={(e) =>
                                    setMonthlySalary(e.target.value)
                                }
                                placeholder="300000"
                                step="0.01"
                                min="0"
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="currency">通貨</Label>
                        <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger>
                                <SelectValue placeholder="通貨を選択" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="JPY">JPY</SelectItem>
                                {/* <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem> */}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="effectiveFrom">適用開始月</Label>
                        <DatePicker
                            value={effectiveFrom}
                            onChange={setEffectiveFrom}
                            placeholder="適用開始月を選択"
                            monthOnly={true}
                        />
                    </div>

                    {/* <div className="flex flex-col gap-2">
                        <Label htmlFor="effectiveTo">適用終了月（任意）</Label>
                        <DatePicker
                            value={effectiveTo}
                            onChange={setEffectiveTo}
                            placeholder="適用終了月を選択（任意）"
                        />
                    </div> */}

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
