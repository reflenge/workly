import {
    fetchMyAttendanceLogs,
    fetchMyAttendanceMonthlySummary,
} from "./_components/attendance-actions";
import { AttendancePageWrapper } from "./_components/attendance-page-wrapper";
import { AttendanceDataTable } from "./_components/attendance-data-table";

interface AttendancePageProps {
    searchParams: {
        year?: string;
        month?: string; // 1-12
    };
}

export default async function AttendancePage({
    searchParams,
}: AttendancePageProps) {
    const now = new Date();
    // JST基準の現在年月を採用（UTCだと月境界がJSTとズレるため）
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const year = Number.parseInt(
        searchParams.year || String(jstNow.getUTCFullYear()),
        10
    );
    const month = Number.parseInt(
        searchParams.month || String(jstNow.getUTCMonth() + 1),
        10
    );

    const [{ items, totalCount }, summary] = await Promise.all([
        fetchMyAttendanceLogs({
            year,
            month,
        }),
        fetchMyAttendanceMonthlySummary({ year, month }),
    ]);

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">出勤記録</h1>
                <p className="text-muted-foreground">
                    あなたの出勤・退勤記録を確認できます。全{totalCount}件
                </p>
            </div>

            <AttendancePageWrapper year={year} month={month}>
                <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="rounded-md border p-4">
                        <div className="text-sm text-muted-foreground">
                            勤務日数
                        </div>
                        <div className="text-xl font-semibold">
                            {summary.workedDays} 日
                        </div>
                    </div>
                    <div className="rounded-md border p-4">
                        <div className="text-sm text-muted-foreground">
                            勤務時間合計
                        </div>
                        <div className="text-xl font-semibold">
                            {Math.floor(summary.workedMinutes / 60)}時間
                            {summary.workedMinutes % 60}分
                        </div>
                    </div>
                </div>
                <div className="mt-6">
                    <AttendanceDataTable data={items} />
                </div>
            </AttendancePageWrapper>
        </div>
    );
}
