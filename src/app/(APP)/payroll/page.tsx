import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import { requireUser } from "@/lib/auth/requireUser";
import { getUserPayrollHistory } from "@/lib/payroll/service";
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

export default async function UserPayrollPage() {
    const user = await requireUser();
    const history = await getUserPayrollHistory(user.id);

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="給与明細"
                description="確定した給与明細の履歴を確認できます。"
            />
            <div className="text-sm text-muted-foreground">
                この値は自動で計算された値です。支給される金額と違う可能性があります。
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>対象月</TableHead>
                            <TableHead className="text-right">勤務時間</TableHead>
                            <TableHead className="text-right">総支給額</TableHead>
                            <TableHead className="text-right">手取り額</TableHead>
                            <TableHead className="text-center">状態</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.length > 0 ? (
                            history.map(({ payrollItem: item, period }) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {format(period.startDate, "yyyy年MM月")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {(item.workedMinutes / 60).toFixed(1)}時間
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {formatCurrency(Number(item.grossPay))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(Number(item.netPay))}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {item.isLocked ? (
                                            <Badge variant="secondary">確定済</Badge>
                                        ) : (
                                            <Badge variant="outline">未確定</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    給与明細の履歴がありません
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
