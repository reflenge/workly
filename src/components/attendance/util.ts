import { eachDayOfInterval } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { AttendanceRecordsResultType } from "./actions";

/**
 * カンマ区切りの文字列を整数配列に変換します。オプションでmin/maxの範囲フィルタも可能です。
 * 無効な値や範囲外の値は除外されます。
 *
 * @param {string | null} paramStr - 変換対象のカンマ区切り文字列
 * @param {Object} [opts] - 値のフィルタオプション
 * @param {number} [opts.min] - 許容する最小値（含む）
 * @param {number} [opts.max] - 許容する最大値（含む）
 * @returns {number[] | null} 有効な整数値配列。該当値がなければnull。
 */
export const parseNumberArrayParam = (
    paramStr: string | null,
    opts?: { min?: number; max?: number }
): number[] | null => {
    if (!paramStr) return null;
    const filtered = paramStr
        .split(",")
        .map((s) => {
            s = s.trim();
            if (!/^\d+$/.test(s)) return null;
            const num = Number(s);
            if (!Number.isInteger(num)) return null;
            if (
                (opts?.min != null && num < opts.min) ||
                (opts?.max != null && num > opts.max)
            )
                return null;
            return num;
        })
        .filter((num): num is number => num !== null);
    return filtered.length > 0 ? filtered : null;
};

/**
 * UUIDv4かを判定するヘルパー
 */
const isUUIDv4 = (s: string) => {
    // UUIDv4の厳密な正規表現
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        s
    );
};

/**
 * カンマ区切り文字列をUUIDv4配列にして返す。1つも有効値がなければnull。
 */
export const parseUuidV4ArrayParam = (
    paramStr: string | null
): string[] | null => {
    if (!paramStr) return null;
    const uuids = paramStr
        .split(",")
        .map((s) => s.trim())
        .filter(isUUIDv4);
    return uuids.length > 0 ? uuids : null;
};

/**
 * 年月の検索パラメータをバリデーションして返します。
 * 2025年6月から今月の範囲でバリデーションし、不正な値や値がない場合は今月を返します。
 *
 * @param {string | null} monthParam - 年月パラメータ (yyyyMM形式)
 * @returns {{ year: number; month: number }} バリデーションされた年月
 */
export const parseYearMonthParams = (
    monthParam: string | null
): { year: number; month: number } => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScriptの月は0から始まるため+1

    const minYear = 2025;
    const minMonth = 6; // 2025年6月

    // monthParamがない場合は現在の年月を返す
    if (!monthParam || !/^\d{6}$/.test(monthParam.trim())) {
        return { year: currentYear, month: currentMonth };
    }

    const trimmed = monthParam.trim();
    const year = parseInt(trimmed.substring(0, 4), 10);
    const month = parseInt(trimmed.substring(4, 6), 10);

    // 年の範囲チェック
    if (year < minYear || year > currentYear) {
        return { year: currentYear, month: currentMonth };
    }

    // 月の範囲チェック
    if (month < 1 || month > 12) {
        return { year: currentYear, month: currentMonth };
    }

    // 年と月の組み合わせをチェック（2025年6月以降、今月以前）
    const targetDate = new Date(year, month - 1); // JavaScriptの月は0から始まるため-1
    const minDate = new Date(minYear, minMonth - 1);
    const currentDate = new Date(currentYear, currentMonth - 1);

    if (targetDate < minDate || targetDate > currentDate) {
        return { year: currentYear, month: currentMonth };
    }

    return { year, month };
};

/**
 * 年月を前後移動するヘルパー関数
 */
const adjustMonth = (year: number, month: number, delta: number) => {
    const date = new Date(year, month - 1 + delta);
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
    };
};

/**
 * 年月が有効範囲内かチェックする関数
 */
const isDateInRange = (
    year: number,
    month: number,
    minYear: number,
    minMonth: number,
    currentYear: number,
    currentMonth: number
) => {
    const targetDate = new Date(year, month - 1);
    const minDate = new Date(minYear, minMonth - 1);
    const currentDate = new Date(currentYear, currentMonth - 1);

    return targetDate >= minDate && targetDate <= currentDate;
};

export const getYearMonthPagination = (year: number, month: number) => {
    const minYear = 2025;
    const minMonth = 6;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // 前の月を計算
    const prevMonth1 = adjustMonth(year, month, -1);
    const prevMonth2 = adjustMonth(year, month, -2);
    const nextMonth1 = adjustMonth(year, month, 1);
    const nextMonth2 = adjustMonth(year, month, 2);

    // 各月が有効かチェック
    const hasPrevMonth1 = isDateInRange(
        prevMonth1.year,
        prevMonth1.month,
        minYear,
        minMonth,
        currentYear,
        currentMonth
    );
    const hasPrevMonth2 = isDateInRange(
        prevMonth2.year,
        prevMonth2.month,
        minYear,
        minMonth,
        currentYear,
        currentMonth
    );
    const hasNextMonth1 = isDateInRange(
        nextMonth1.year,
        nextMonth1.month,
        minYear,
        minMonth,
        currentYear,
        currentMonth
    );
    const hasNextMonth2 = isDateInRange(
        nextMonth2.year,
        nextMonth2.month,
        minYear,
        minMonth,
        currentYear,
        currentMonth
    );

    // さらに前後があるかチェック
    const hasPrev3 = isDateInRange(
        adjustMonth(year, month, -3).year,
        adjustMonth(year, month, -3).month,
        minYear,
        minMonth,
        currentYear,
        currentMonth
    );
    const hasNext3 = isDateInRange(
        adjustMonth(year, month, 3).year,
        adjustMonth(year, month, 3).month,
        minYear,
        minMonth,
        currentYear,
        currentMonth
    );

    return {
        prevYear: prevMonth1.year,
        prevMonth: prevMonth1.month,
        nextYear: nextMonth1.year,
        nextMonth: nextMonth1.month,
        hasPrev: hasPrevMonth1,
        hasNext: hasNextMonth1,

        // ±1月の情報
        prevMonth1: hasPrevMonth1 ? prevMonth1 : null,
        nextMonth1: hasNextMonth1 ? nextMonth1 : null,

        // ±2月の情報
        prevMonth2: hasPrevMonth2 ? prevMonth2 : null,
        nextMonth2: hasNextMonth2 ? nextMonth2 : null,

        // さらに先があるか
        hasMorePrev: hasPrev3,
        hasMoreNext: hasNext3,
    };
};

/**
 * 指定された年月でstartedAtをフィルタリングします。
 * URLパラメータはJST、データはUTCで比較します。
 *
 * @param records - 出勤記録の配列
 * @param year - フィルタリングする年
 * @param month - フィルタリングする月
 * @returns フィルタリングされた配列
 */
export const filterRecordsByYearMonth = <
    T extends { log: { startedAt: Date } }
>(
    records: T[],
    year: number,
    month: number
): T[] => {
    const timeZone = "Asia/Tokyo";

    return records.filter((record) => {
        const startedAtUtc = record.log.startedAt;

        // UTCのstartedAtをJSTに変換
        const jstDate = toZonedTime(startedAtUtc, timeZone);

        // JSTで年月が一致するかチェック
        return (
            jstDate.getFullYear() === year && jstDate.getMonth() + 1 === month // JavaScriptの月は0から始まるため+1
        );
    });
};

/**
 * 指定された出勤記録配列からユニークな勤務日数（カレンダー日単位、タイムゾーンJST基準）をカウントします。
 *
 * 各レコードはlog.startedAtおよび（あれば）log.endedAtを持つ必要があります。
 * 各レコードの勤務日（在席が跨いだ場合もすべてのカレンダー日をカウントする）を抽出してユニークな日付数を返します。
 * 日付は"Asia/Tokyo"タイムゾーンを基準にyyyy-MM-dd形式で算出します。
 *
 * @param {AttendanceRecordsResultType[]} records - 出勤記録配列
 * @returns {number} カレンダー日ベースでのユニークな勤務日数
 */
export const getWorkingDaysCount = (
    records: AttendanceRecordsResultType[]
): number => {
    const uniqueDays = new Set<string>();
    const tz = "Asia/Tokyo";

    records.forEach((record) => {
        // JSTタイムゾーンを基準に、各勤務の開始・終了をDateに変換
        const startUtc = fromZonedTime(record.log.startedAt, tz);
        const endUtc = record.log.endedAt
            ? fromZonedTime(record.log.endedAt, tz)
            : startUtc; // endedAtがなければ開始日のみ

        // start～endまでのすべてのカレンダー日リストを作成
        const days = eachDayOfInterval({ start: startUtc, end: endUtc });
        // それぞれのカレンダー日を"yyyy-MM-dd"（JST）で文字列化
        const formatDays = days.map((day) =>
            formatInTimeZone(day, tz, "yyyy-MM-dd")
        );
        // 重複なくセットに追加
        formatDays.forEach((day) => {
            uniqueDays.add(day);
        });
    });
    return uniqueDays.size;
};
