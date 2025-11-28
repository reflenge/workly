import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import { requireUser } from "@/lib/auth/requireUser";
import { getMonthlyPeriods } from "./actions";
import { PayrollPeriodList } from "./_components/payroll-period-list";
import { redirect } from "next/navigation";

export default async function AdminPayrollPage() {
    const user = await requireUser();

    if (!user.isAdmin) {
        redirect("/");
    }

    const periods = await getMonthlyPeriods(12);

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="給与計算期間管理"
                description="給与計算期間の締め切り管理を行います。期間を締め切ると、その期間の勤怠データは修正できなくなり、給与データが確定されます。"
            />

            <PayrollPeriodList periods={periods} />
        </div>
    );
}
