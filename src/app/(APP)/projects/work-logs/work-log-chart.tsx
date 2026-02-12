"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LabelList,
} from "recharts";

// チャートデータの型定義
// name: プロジェクト名 (X軸のキー)
// [key: string]: ユーザー名ごとの作業時間 (動的なキー)
export type ChartData = {
    name: string;
    [key: string]: string | number;
};

interface WorkLogChartProps {
    data: ChartData[];
    users: string[]; // 凡例と積み上げバーの生成に使用するユーザー名のリスト
}

// チャートの色定義 (ユーザーごとに異なる色を割り当てるため)
const COLORS = [
    "#8f8fd0",
    "#8fcf90",
    "#ffcf50",
    "#ff8f40",
    "#0f8ff0",
    "#0fcf90",
    "#ffbf20",
    "#ff8f40",
    "#afdf60",
    "#dfef50",
];

const formatHoursToTime = (value: number) => {
    if (!Number.isFinite(value)) return "";
    const totalMinutes = Math.round(value * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}分`;
    if (minutes === 0) return `${hours}時間`;
    return `${hours}時間${minutes}分`;
};

export function WorkLogChart({ data, users }: WorkLogChartProps) {
    const chartData = data.map((item) => {
        const total = users.reduce((sum, key) => {
            const value = item[key];
            const numeric = typeof value === "string" ? Number(value) : value;
            return typeof numeric === "number" && !Number.isNaN(numeric) ? sum + numeric : sum;
        }, 0);

        return { ...item, __total: total };
    });

    return (
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: '時間 (h)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    {/* ユーザーごとに積み上げ棒グラフ(Bar)を生成 */}
                    {users.map((user, index) => (
                        <Bar
                            key={user}
                            dataKey={user}
                            stackId="a" // 同じstackIdを指定することで積み上げグラフになります
                            fill={COLORS[index % COLORS.length]} // 色を循環して割り当て
                        >
                            {index === users.length - 1 && (
                                <LabelList
                                    dataKey="__total"
                                    position="top"
                                    formatter={(value: unknown) => {
                                        if (typeof value === "number") {
                                            return formatHoursToTime(value);
                                        }
                                        if (typeof value === "string") {
                                            return value;
                                        }
                                        return "";
                                    }}
                                />
                            )}
                        </Bar>
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
