"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { formatToJstDate } from "@/lib/utils";
import { SettingsIcon } from "lucide-react";

type CompensationData = {
    id: string;
    userId: string;
    lastName: string;
    firstName: string;
    isHourly: boolean;
    isMonthly: boolean;
    hourlyRate: string | null;
    monthlySalary: string | null;
    currency: string;
    effectiveFrom: Date;
    effectiveTo: Date | null;
};

export default function CompensationList({
    data,
}: {
    data: CompensationData[];
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>給与設定一覧</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        給与設定が登録されているユーザーはいません
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>氏名</TableHead>
                                    <TableHead>給与タイプ</TableHead>
                                    <TableHead>金額</TableHead>
                                    <TableHead>通貨</TableHead>
                                    <TableHead>有効期間開始</TableHead>
                                    <TableHead>有効期間終了</TableHead>
                                    <TableHead className="text-right">
                                        操作
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((compensation) => (
                                    <TableRow key={compensation.id}>
                                        <TableCell className="font-medium">
                                            {compensation.lastName}{" "}
                                            {compensation.firstName}
                                        </TableCell>
                                        <TableCell>
                                            {compensation.isHourly &&
                                                "時給制"}
                                            {compensation.isMonthly &&
                                                "月給制"}
                                        </TableCell>
                                        <TableCell>
                                            {compensation.isHourly &&
                                                compensation.hourlyRate &&
                                                `¥${parseFloat(
                                                    compensation.hourlyRate
                                                ).toLocaleString()}/時間`}
                                            {compensation.isMonthly &&
                                                compensation.monthlySalary &&
                                                `¥${parseFloat(
                                                    compensation.monthlySalary
                                                ).toLocaleString()}/月`}
                                        </TableCell>
                                        <TableCell>
                                            {compensation.currency}
                                        </TableCell>
                                        <TableCell>
                                            {formatToJstDate(
                                                compensation.effectiveFrom
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {compensation.effectiveTo
                                                ? formatToJstDate(
                                                    compensation.effectiveTo
                                                )
                                                : "無期限"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={`/admin/users/${compensation.userId}`}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <SettingsIcon className="h-4 w-4 mr-2" />
                                                    設定変更
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
