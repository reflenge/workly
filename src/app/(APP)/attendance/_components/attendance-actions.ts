import { db } from "@/db";
import {
    attendanceLogs,
    users,
    attendanceStatus,
    attendanceLogSource,
} from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { and, desc, eq, sql } from "drizzle-orm";

export interface FetchMyAttendanceParams {
    year: number; // 西暦
    month: number; // 1-12
}

export interface AttendanceLogItem {
    id: string;
    userId: string;
    statusId: number;
    statusLabel: string;
    startedAt: string;
    endedAt: string | null;
    startedSource: number;
    startedSourceLabel: string;
    endedSource: number | null;
    endedSourceLabel: string | null;
    note: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface FetchMyAttendanceResult {
    items: AttendanceLogItem[];
    totalCount: number; // 該当月の総件数
}

export async function fetchMyAttendanceLogs(
    params: FetchMyAttendanceParams
): Promise<FetchMyAttendanceResult> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return {
            items: [],
            totalCount: 0,
        };
    }

    const me = (
        await db.select().from(users).where(eq(users.authId, user.id)).limit(1)
    )[0];
    if (!me) {
        return {
            items: [],
            totalCount: 0,
        };
    }

    // 月初・月末境界をJSTで計算し、UTCで比較するために-9時間した境界を使う
    const jstOffsetHours = 9;
    const startOfMonthUtc = new Date(
        Date.UTC(params.year, params.month - 1, 1, 0 - jstOffsetHours, 0, 0)
    );
    const startOfNextMonthUtc = new Date(
        Date.UTC(params.year, params.month, 1, 0 - jstOffsetHours, 0, 0)
    );

    // マスターデータを取得
    const [statuses, sources] = await Promise.all([
        db.select().from(attendanceStatus),
        db.select().from(attendanceLogSource),
    ]);

    const statusMap = new Map(statuses.map((s) => [s.id, s.label]));
    const sourceMap = new Map(sources.map((s) => [s.id, s.label]));

    const [{ count: totalCount }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(attendanceLogs)
        .where(
            and(
                eq(attendanceLogs.userId, me.id),
                sql`"started_at" >= ${startOfMonthUtc.toISOString()} AND "started_at" < ${startOfNextMonthUtc.toISOString()}`
            )
        );

    const items = await db
        .select()
        .from(attendanceLogs)
        .where(
            and(
                eq(attendanceLogs.userId, me.id),
                sql`"started_at" >= ${startOfMonthUtc.toISOString()} AND "started_at" < ${startOfNextMonthUtc.toISOString()}`
            )
        )
        .orderBy(desc(attendanceLogs.startedAt));

    return {
        items: items.map((x) => ({
            id: x.id,
            userId: x.userId,
            statusId: x.statusId,
            statusLabel: statusMap.get(x.statusId) || "不明",
            startedAt: x.startedAt as unknown as string,
            endedAt: (x.endedAt as unknown as string) ?? null,
            startedSource: x.startedSource,
            startedSourceLabel: sourceMap.get(x.startedSource) || "不明",
            endedSource: (x.endedSource as unknown as number) ?? null,
            endedSourceLabel: x.endedSource
                ? sourceMap.get(x.endedSource) || "不明"
                : null,
            note: x.note ?? null,
            createdAt: x.createdAt as unknown as string,
            updatedAt: x.updatedAt as unknown as string,
        })),
        totalCount,
    };
}

export interface FetchMyAttendanceMonthlySummaryParams {
    year: number; // 西暦
    month: number; // 1-12
}

export interface AttendanceMonthlySummaryResult {
    workedDays: number; // 勤務した日数（JST、同日複数回は1日としてカウント）
    workedMinutes: number; // 勤務合計分（休憩は除外、JST月境界でクリップ）
}

// JSTのYYYY-MM-DD文字列を作る（DateはUTC基準のまま内部で+9hシフト）
function formatJstDateString(date: Date): string {
    const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    const y = jst.getUTCFullYear();
    const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
    const d = String(jst.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

// JSTの深夜0時（その日の開始、UTCに直すと-9h）を返す
function getJstStartOfDay(date: Date): Date {
    const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    const startJst = new Date(
        Date.UTC(
            jst.getUTCFullYear(),
            jst.getUTCMonth(),
            jst.getUTCDate(),
            0,
            0,
            0,
            0
        )
    );
    // UTCに戻す（JST 0:00 は UTCでは前日の15:00）
    return new Date(startJst.getTime() - 9 * 60 * 60 * 1000);
}

export async function fetchMyAttendanceMonthlySummary(
    params: FetchMyAttendanceMonthlySummaryParams
): Promise<AttendanceMonthlySummaryResult> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return { workedDays: 0, workedMinutes: 0 };
    }

    const me = (
        await db.select().from(users).where(eq(users.authId, user.id)).limit(1)
    )[0];
    if (!me) {
        return { workedDays: 0, workedMinutes: 0 };
    }

    // JST月初・翌月初（UTCで-9hシフトした境界を使う）
    const jstOffsetHours = 9;
    const startOfMonthUtc = new Date(
        Date.UTC(params.year, params.month - 1, 1, 0 - jstOffsetHours, 0, 0)
    );
    const startOfNextMonthUtc = new Date(
        Date.UTC(params.year, params.month, 1, 0 - jstOffsetHours, 0, 0)
    );

    // 勤務（WORKING）の区間のみを取得。月範囲に「重なっている」レコードを対象にする。
    // 条件: started_at < 月末境界 かつ (ended_at IS NULL または ended_at > 月初境界)
    const workingStatus = (
        await db
            .select({ id: attendanceStatus.id })
            .from(attendanceStatus)
            .where(eq(attendanceStatus.code, "WORKING"))
            .limit(1)
    )[0];
    if (!workingStatus) {
        return { workedDays: 0, workedMinutes: 0 };
    }

    const rows = await db
        .select({
            startedAt: attendanceLogs.startedAt,
            endedAt: attendanceLogs.endedAt,
        })
        .from(attendanceLogs)
        .where(
            sql`"user_id" = ${me.id} AND "status_id" = ${
                workingStatus.id
            } AND "started_at" < ${startOfNextMonthUtc.toISOString()} AND ("ended_at" IS NULL OR "ended_at" > ${startOfMonthUtc.toISOString()})`
        )
        .orderBy(desc(attendanceLogs.startedAt));

    let workedMinutes = 0;
    const workedDaySet = new Set<string>();
    const now = new Date();

    for (const r of rows) {
        const segStart = new Date(r.startedAt as unknown as string);
        const rawEnd = (r.endedAt as unknown as string) || null;
        const segEnd = rawEnd ? new Date(rawEnd) : now;

        // 月範囲でクリップ
        const clippedStart = new Date(
            Math.max(segStart.getTime(), startOfMonthUtc.getTime())
        );
        const clippedEnd = new Date(
            Math.min(segEnd.getTime(), startOfNextMonthUtc.getTime())
        );
        if (clippedEnd.getTime() <= clippedStart.getTime()) continue;

        // 分を加算
        workedMinutes += Math.floor(
            (clippedEnd.getTime() - clippedStart.getTime()) / 60000
        );

        // JST日単位で日数をカウント（同日複数回は1日）
        let dayCursor = getJstStartOfDay(clippedStart);
        while (dayCursor.getTime() < clippedEnd.getTime()) {
            workedDaySet.add(formatJstDateString(dayCursor));
            // 翌日のJST開始に進める
            dayCursor = new Date(dayCursor.getTime() + 24 * 60 * 60 * 1000);
        }
    }

    return { workedDays: workedDaySet.size, workedMinutes };
}
