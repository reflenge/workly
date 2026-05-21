"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { type DailyDataPoint } from "@/lib/budget/types";
import {
    formatCurrency,
    formatHours,
} from "@/components/attendance/format-utils";

interface BudgetChartsProps {
    dailyTrend: DailyDataPoint[];
    estimatedHours: number;
    estimatedAmount: number;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    thresholds: { caution: number; warning: number; over: number };
}

interface ChartPoint {
    date: string;
    actualHoursCum: number | null;
    idealHoursCum: number;
    actualAmountCum: number | null;
    idealAmountCum: number;
}

const buildChartData = (
    dailyTrend: DailyDataPoint[],
    estimatedHours: number,
    estimatedAmount: number,
    startDate: Date,
    endDate: Date
): ChartPoint[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDays = Math.max(
        1,
        Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        )
    );

    const trendMap = new Map(
        dailyTrend.map((d) => [
            d.date,
            { hours: d.cumulativeHours, amount: d.cumulativeAmount },
        ])
    );

    const result: ChartPoint[] = [];
    let lastHours = 0;
    let lastAmount = 0;

    for (let i = 0; i <= totalDays; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateKey = format(date, "yyyy-MM-dd");

        // 未来日付は null にして実績ラインを「今日」で止める（connectNulls=false と連動）
        let actualHoursCum: number | null = null;
        let actualAmountCum: number | null = null;
        if (date <= today) {
            const dayData = trendMap.get(dateKey);
            if (dayData) {
                lastHours = dayData.hours;
                lastAmount = dayData.amount;
            }
            actualHoursCum = lastHours;
            actualAmountCum = lastAmount;
        }

        const ratio = i / totalDays;
        result.push({
            date: dateKey,
            actualHoursCum,
            idealHoursCum: ratio * estimatedHours,
            actualAmountCum,
            idealAmountCum: ratio * estimatedAmount,
        });
    }

    return result;
};

export function BudgetCharts({
    dailyTrend,
    estimatedHours,
    estimatedAmount,
    startDate,
    endDate,
    thresholds,
}: BudgetChartsProps) {
    const chartData = useMemo(() => {
        const start = new Date(startDate + "T00:00:00");
        const end = new Date(endDate + "T00:00:00");
        return buildChartData(
            dailyTrend,
            estimatedHours,
            estimatedAmount,
            start,
            end
        );
    }, [dailyTrend, estimatedHours, estimatedAmount, startDate, endDate]);

    // 閾値ライン（時間軸）
    const hoursCaution = (estimatedHours * thresholds.caution) / 100;
    const hoursWarning = (estimatedHours * thresholds.warning) / 100;
    const hoursOver = estimatedHours;

    // 閾値ライン（金額軸）
    const amountCaution = (estimatedAmount * thresholds.caution) / 100;
    const amountWarning = (estimatedAmount * thresholds.warning) / 100;
    const amountOver = estimatedAmount;

    return (
        <Tabs defaultValue="hours" className="w-full">
            <TabsList>
                <TabsTrigger value="hours">⏱ 時間</TabsTrigger>
                <TabsTrigger value="amount">💴 金額</TabsTrigger>
            </TabsList>

            <TabsContent value="hours" className="mt-4">
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                label={{
                                    value: "時間 (h)",
                                    angle: -90,
                                    position: "insideLeft",
                                }}
                            />
                            <Tooltip
                                formatter={(value: number) =>
                                    value === null ? "-" : formatHours(value)
                                }
                            />
                            <Legend />
                            <ReferenceLine
                                y={hoursCaution}
                                stroke="#eab308"
                                strokeDasharray="4 4"
                                label={{
                                    value: `注意 (${thresholds.caution.toFixed(0)}%)`,
                                    position: "right",
                                    fontSize: 11,
                                }}
                            />
                            <ReferenceLine
                                y={hoursWarning}
                                stroke="#f97316"
                                strokeDasharray="4 4"
                                label={{
                                    value: `警告 (${thresholds.warning.toFixed(0)}%)`,
                                    position: "right",
                                    fontSize: 11,
                                }}
                            />
                            <ReferenceLine
                                y={hoursOver}
                                stroke="#ef4444"
                                label={{
                                    value: `超過 (100%)`,
                                    position: "right",
                                    fontSize: 11,
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="idealHoursCum"
                                stroke="#94a3b8"
                                strokeDasharray="5 5"
                                name="理想ペース"
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="actualHoursCum"
                                stroke="#2563eb"
                                strokeWidth={2}
                                name="実績"
                                dot={false}
                                connectNulls={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </TabsContent>

            <TabsContent value="amount" className="mt-4">
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                label={{
                                    value: "金額 (円)",
                                    angle: -90,
                                    position: "insideLeft",
                                }}
                                tickFormatter={(value: number) =>
                                    value >= 10000
                                        ? `${(value / 10000).toFixed(0)}万`
                                        : `${value}`
                                }
                            />
                            <Tooltip
                                formatter={(value: number) =>
                                    value === null
                                        ? "-"
                                        : formatCurrency(Math.round(value))
                                }
                            />
                            <Legend />
                            <ReferenceLine
                                y={amountCaution}
                                stroke="#eab308"
                                strokeDasharray="4 4"
                                label={{
                                    value: `注意 (${thresholds.caution.toFixed(0)}%)`,
                                    position: "right",
                                    fontSize: 11,
                                }}
                            />
                            <ReferenceLine
                                y={amountWarning}
                                stroke="#f97316"
                                strokeDasharray="4 4"
                                label={{
                                    value: `警告 (${thresholds.warning.toFixed(0)}%)`,
                                    position: "right",
                                    fontSize: 11,
                                }}
                            />
                            <ReferenceLine
                                y={amountOver}
                                stroke="#ef4444"
                                label={{
                                    value: `超過 (100%)`,
                                    position: "right",
                                    fontSize: 11,
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="idealAmountCum"
                                stroke="#94a3b8"
                                strokeDasharray="5 5"
                                name="理想ペース"
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="actualAmountCum"
                                stroke="#2563eb"
                                strokeWidth={2}
                                name="実績"
                                dot={false}
                                connectNulls={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </TabsContent>
        </Tabs>
    );
}
