import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import { redirect } from "next/navigation";

interface AttendancePageProps {
    searchParams: Promise<{
        year?: string;
        month?: string; // 1-12
    }>;
}

export default async function AttendancePage({
    searchParams,
}: AttendancePageProps) {
    const now = new Date();
    // JST基準の現在年月を採用（UTCだと月境界がJSTとズレるため）
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);

    // searchParamsをawaitで取得
    const params = await searchParams;

    let year = Number.parseInt(
        params.year || String(jstNow.getUTCFullYear()),
        10
    );
    let month = Number.parseInt(
        params.month || String(jstNow.getUTCMonth() + 1),
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

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="出勤記録"
                description="あなたの出勤・退勤記録を確認できます。"
            />
        </div>
    );
}
