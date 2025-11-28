import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import { requireUser } from "@/lib/auth/requireUser";
import { getPayrollItems } from "@/lib/payroll/service";
import { redirect } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/components/attendance/format-utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface PageProps {
    params: Promise<{ periodId: string }>;
}

export default async function AdminPayrollDetailPage({ params }: PageProps) {
    const user = await requireUser();
    const { periodId } = await params;

    if (!user.isAdmin) {
        redirect("/");
    }

    const items = await getPayrollItems(periodId);

    // 期間情報を取得（items[0]から取れるが、itemsが空の場合は取れないので別途取得すべきだが、
    // ここでは簡易的にitems[0]から取るか、なければ「データなし」表示）
    const period = items[0]?.period;

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="給与明細詳細"
                description={period ? `${format(period.startDate, "yyyy年MM月")}の給与明細一覧` : "給与明細一覧"}
            />

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>氏名</TableHead>
                            <TableHead className="text-right">勤務時間 (分)</TableHead>
                            <TableHead className="text-right">時給</TableHead>
                            <TableHead className="text-right">総支給額</TableHead>
                            <TableHead className="text-right">手取り額</TableHead>
                            <TableHead className="text-center">状態</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length > 0 ? (
                            items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {item.user.lastName} {item.user.firstName}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.workedMinutes.toLocaleString()}分
                                        <span className="text-xs text-muted-foreground ml-1">
                                            ({(item.workedMinutes / 60).toFixed(1)}時間)
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.hourlyRate ? formatCurrency(Number(item.hourlyRate)) : "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {formatCurrency(Number(item.grossPay))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(Number(item.netPay))}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {item.isLocked ? (
                                            <Badge variant="secondary">確定</Badge>
                                        ) : (
                                            <Badge variant="outline">未確定</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    データがありません
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
