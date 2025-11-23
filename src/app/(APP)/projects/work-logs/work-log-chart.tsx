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
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#0088fe",
    "#00c49f",
    "#ffbb28",
    "#ff8042",
    "#a4de6c",
    "#d0ed57",
];

export function WorkLogChart({ data, users }: WorkLogChartProps) {
    return (
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
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
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
