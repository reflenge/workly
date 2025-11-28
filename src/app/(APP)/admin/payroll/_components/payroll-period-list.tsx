"use client";

import { MonthlyPeriodStatus, togglePayrollPeriodStatus } from "../actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Lock, Unlock } from "lucide-react";

interface PayrollPeriodListProps {
    periods: MonthlyPeriodStatus[];
}

export function PayrollPeriodList({ periods }: PayrollPeriodListProps) {
    const [isPending, startTransition] = useTransition();
    const [processingPeriod, setProcessingPeriod] = useState<string | null>(null);

    const handleToggleStatus = (period: MonthlyPeriodStatus) => {
        const isClosed = !!period.period?.isClosed;
        const action = isClosed ? "再開" : "締め切り";

        if (!confirm(`${period.year}年${period.month}月の給与計算期間を${action}しますか？\n${!isClosed ? "締め切ると、この期間の勤怠データは修正できなくなり、給与データが確定されます。" : "再開すると、勤怠データの修正が可能になります。"}`)) {
            return;
        }

        const periodKey = `${period.year}-${period.month}`;
        setProcessingPeriod(periodKey);

        startTransition(async () => {
            try {
                await togglePayrollPeriodStatus(period.year, period.month, !isClosed);
                toast.success(`${period.year}年${period.month}月の期間を${action}しました`);
            } catch (error) {
                toast.error("エラーが発生しました");
                console.error(error);
            } finally {
                setProcessingPeriod(null);
            }
        });
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>年月</TableHead>
                        <TableHead>期間 (JST)</TableHead>
                        <TableHead>状態</TableHead>
                        <TableHead>確定日時</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {periods.map((period) => {
                        const isClosed = !!period.period?.isClosed;
                        const periodKey = `${period.year}-${period.month}`;
                        const isProcessing = isPending && processingPeriod === periodKey;

                        return (
                            <TableRow key={periodKey}>
                                <TableCell className="font-medium">
                                    {period.year}年{period.month}月
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {format(period.startDate, "yyyy/MM/dd HH:mm")} 〜{" "}
                                    {format(period.endDate, "yyyy/MM/dd HH:mm")}
                                </TableCell>
                                <TableCell>
                                    {isClosed ? (
                                        <Badge variant="secondary" className="gap-1">
                                            <Lock className="h-3 w-3" /> 確定済
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                                            <Unlock className="h-3 w-3" /> 修正可能
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {period.period?.closedAt
                                        ? format(new Date(period.period.closedAt), "yyyy/MM/dd HH:mm")
                                        : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant={isClosed ? "outline" : "default"}
                                        size="sm"
                                        onClick={() => handleToggleStatus(period)}
                                        disabled={isProcessing || (isPending && processingPeriod !== null)}
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : isClosed ? (
                                            "再開する"
                                        ) : (
                                            "締め切る"
                                        )}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
