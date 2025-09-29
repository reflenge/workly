import {
    fetchMyAttendanceLogs,
    fetchMyAttendanceMonthlySummary,
} from "./_components/attendance-actions";
import { AttendancePageWrapper } from "./_components/attendance-page-wrapper";
import { redirect } from "next/navigation";
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
    let year = Number.parseInt(
        searchParams.year || String(jstNow.getUTCFullYear()),
        10
    );
    let month = Number.parseInt(
        searchParams.month || String(jstNow.getUTCMonth() + 1),
        10
    );
    // 明らかにおかしいパラメータは今月にフォールバック（JST）し、クエリを除去してリダイレクト
    let corrected = false;
    // 2025/01から今月までの範囲のみ許可
    const minYear = 2025;
    const minMonth = 1;
    const maxYear = jstNow.getUTCFullYear();
    const maxMonth = jstNow.getUTCMonth() + 1;

    // 年の範囲チェック
    if (Number.isNaN(year) || year < minYear || year > maxYear) {
        year = maxYear;
        month = maxMonth;
        corrected = true;
    }

    // 月の範囲チェック
    if (Number.isNaN(month) || month < 1 || month > 12) {
        month = maxMonth;
        corrected = true;
    }

    // 2025/01より前は不可
    if (year === minYear && month < minMonth) {
        month = minMonth;
        corrected = true;
    }

    // 今月より未来は不可
    if (year === maxYear && month > maxMonth) {
        month = maxMonth;
        corrected = true;
    }

    if (corrected) {
        redirect("/attendance");
    }

    const canPrev = year > minYear || (year === minYear && month > minMonth);
    const canNext = year < maxYear || (year === maxYear && month < maxMonth);

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

            <AttendancePageWrapper
                year={year}
                month={month}
                canPrev={canPrev}
                canNext={canNext}
            >
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
                            {(() => {
                                const totalMs = summary.workedMillis;
                                const hours = Math.floor(totalMs / 3_600_000);
                                const minutes = Math.floor(
                                    (totalMs % 3_600_000) / 60_000
                                );
                                const seconds = Math.floor(
                                    (totalMs % 60_000) / 1000
                                );
                                return `${hours}時間${minutes}分${seconds}秒`;
                            })()}
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
