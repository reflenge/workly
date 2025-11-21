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

export type ChartData = {
    name: string; // Project Name
    [key: string]: string | number; // User Name -> Duration
};

interface WorkLogChartProps {
    data: ChartData[];
    users: string[]; // List of user names for keys
}

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
                    {users.map((user, index) => (
                        <Bar
                            key={user}
                            dataKey={user}
                            stackId="a"
                            fill={COLORS[index % COLORS.length]}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
