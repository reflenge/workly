"use client";

import { userCompensation } from "@/db/schema";
import { formatToJstDateTime, formatToJstDate } from "@/lib/utils";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CompensationList = ({
    compensations,
}: {
    compensations: (typeof userCompensation.$inferSelect)[];
}) => {
    if (compensations.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                    給与設定がありません
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {compensations.map((comp) => {
                const now = new Date();
                const effectiveFrom = new Date(comp.effectiveFrom);
                const effectiveTo = comp.effectiveTo
                    ? new Date(comp.effectiveTo)
                    : null;

                // 現在適用中の設定かどうかを判定
                const isCurrentlyActive =
                    effectiveFrom <= now &&
                    (effectiveTo === null || effectiveTo >= now);

                return (
                    <Card
                        key={comp.id}
                        className={
                            isCurrentlyActive
                                ? "border-green-500 bg-green-50"
                                : ""
                        }
                    >
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">
                                    {comp.isHourly ? "時給制" : "月給制"}
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Badge
                                        variant={
                                            comp.isActive
                                                ? "default"
                                                : "secondary"
                                        }
                                    >
                                        {comp.isActive ? "有効" : "無効"}
                                    </Badge>
                                    {isCurrentlyActive && (
                                        <Badge
                                            variant="outline"
                                            className="border-green-500 text-green-700"
                                        >
                                            適用中
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <CardDescription>
                                {formatToJstDate(comp.effectiveFrom)} ～
                                {comp.effectiveTo
                                    ? formatToJstDate(comp.effectiveTo)
                                    : (() => {
                                          const now = new Date();
                                          const effectiveFrom = new Date(
                                              comp.effectiveFrom
                                          );
                                          if (effectiveFrom > now) {
                                              return "将来";
                                          } else {
                                              return "現在";
                                          }
                                      })()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                {comp.isHourly && comp.hourlyRate && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            時給
                                        </p>
                                        <p className="text-lg font-semibold">
                                            {Number(
                                                comp.hourlyRate
                                            ).toLocaleString()}{" "}
                                            {comp.currency}
                                        </p>
                                    </div>
                                )}
                                {comp.isMonthly && comp.monthlySalary && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            月給
                                        </p>
                                        <p className="text-lg font-semibold">
                                            {Number(
                                                comp.monthlySalary
                                            ).toLocaleString()}{" "}
                                            {comp.currency}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 text-sm text-muted-foreground">
                                <p>
                                    作成日:{" "}
                                    {formatToJstDateTime(comp.createdAt)}
                                </p>
                                <p>
                                    更新日:{" "}
                                    {formatToJstDateTime(comp.updatedAt)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};

export default CompensationList;
