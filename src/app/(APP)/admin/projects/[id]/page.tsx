import { requireUser } from "@/lib/auth/requireUser";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getProjectBudgetSummary } from "@/lib/budget/service";
import { getStatusBadgeInfo } from "@/lib/budget/types";
import {
    formatCurrency,
    formatHours,
    formatPercent,
} from "@/components/attendance/format-utils";
import { BudgetCharts } from "./_components/budget-charts";

export default async function ProjectDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await requireUser();

    if (!user.isAdmin) {
        redirect("/");
    }

    const project = (
        await db.select().from(projects).where(eq(projects.id, id)).limit(1)
    )[0];
    if (!project) notFound();

    // 取得済みの project を渡して、service 内部での重複 SELECT を回避
    const summary = await getProjectBudgetSummary(id, project);
    const statusBadge = getStatusBadgeInfo(summary.status);

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/admin">管理画面</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/admin/projects">
                                プロジェクト単価・予算管理
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{project.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <PageHeaderMeta
                title={project.name}
                description={
                    project.description ??
                    "プロジェクトの予算・実績ダッシュボード"
                }
            />

            <div className="flex items-center gap-2">
                <Badge variant="outline">
                    {project.isActive ? "有効" : "無効"}
                </Badge>
                <Badge className={cn(statusBadge.className)}>
                    {statusBadge.emoji} {statusBadge.label}
                </Badge>
            </div>

            {summary.isOutOfScope ? (
                <Card>
                    <CardHeader>
                        <CardTitle>💤 予算管理対象外</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            このプロジェクトは見積もり時間・金額・期間のいずれかが未設定のため、予算管理の対象外です。
                            <br />
                            プロジェクト単価・予算管理ページから「⋮」→
                            設定して有効化してください。
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    期間進捗
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatPercent(summary.periodProgress ?? 0, 1)}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {project.startDate} 〜 {project.endDate}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    時間消化
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatPercent(
                                        summary.hoursConsumption ?? 0,
                                        1
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {formatHours(summary.actualHours)} /{" "}
                                    {formatHours(
                                        Number(project.estimatedTotalHours)
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    金額消化
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatPercent(
                                        summary.amountConsumption ?? 0,
                                        1
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {formatCurrency(summary.actualAmount)} /{" "}
                                    {formatCurrency(
                                        Number(project.estimatedTotalAmount)
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                ⚡ ペース予測
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-2">
                                このペースで進むと、プロジェクト終了時の消化率は:
                            </p>
                            <div className="text-3xl font-bold mb-2">
                                {formatPercent(summary.paceProjection ?? 0, 1)}{" "}
                                <Badge
                                    className={cn(
                                        "text-base",
                                        statusBadge.className
                                    )}
                                >
                                    {statusBadge.emoji} {statusBadge.label}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                閾値: 注意 {summary.thresholds!.caution.toFixed(0)}% /
                                警告 {summary.thresholds!.warning.toFixed(0)}% /
                                超過 100%（バッファ率{" "}
                                {(Number(project.bufferRatio) * 100).toFixed(0)}
                                % から動的算出）
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                📊 消化トレンド
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <BudgetCharts
                                dailyTrend={summary.dailyTrend}
                                estimatedHours={Number(
                                    project.estimatedTotalHours
                                )}
                                estimatedAmount={Number(
                                    project.estimatedTotalAmount
                                )}
                                startDate={project.startDate!}
                                endDate={project.endDate!}
                                thresholds={summary.thresholds!}
                            />
                        </CardContent>
                    </Card>
                </>
            )}

            {/* 役割別の内訳（予算未設定でも実績は出すべきなので out_of_scope でも表示） */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        👥 役割別の実績内訳
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>役職</TableHead>
                                <TableHead className="text-right">
                                    実績時間
                                </TableHead>
                                <TableHead className="text-right">
                                    単価
                                </TableHead>
                                <TableHead className="text-right">
                                    実績金額
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {summary.roleBreakdown.map((row) => {
                                const rate =
                                    row.roleCode === "REPRESENTATIVE"
                                        ? project.representativeHourlyRate
                                        : project.employeeHourlyRate;
                                return (
                                    <TableRow key={row.roleCode}>
                                        <TableCell>{row.roleLabel}</TableCell>
                                        <TableCell className="text-right">
                                            {formatHours(row.hours)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {rate
                                                ? formatCurrency(Number(rate))
                                                : "未設定"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(row.amount)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            <TableRow>
                                <TableCell className="font-semibold">
                                    合計
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                    {formatHours(summary.actualHours)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                    -
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                    {formatCurrency(summary.actualAmount)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Separator />
        </div>
    );
}
