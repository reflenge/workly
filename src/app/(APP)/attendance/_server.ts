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
    page: number;
    pageSize: number;
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
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
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
            totalPages: 0,
            currentPage: params.page,
            hasNextPage: false,
            hasPrevPage: false,
        };
    }

    const me = (
        await db.select().from(users).where(eq(users.authId, user.id)).limit(1)
    )[0];
    if (!me) {
        return {
            items: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: params.page,
            hasNextPage: false,
            hasPrevPage: false,
        };
    }

    const [{ count: totalCount }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(attendanceLogs)
        .where(eq(attendanceLogs.userId, me.id));

    const totalPages = Math.ceil(totalCount / params.pageSize);
    const offset = (params.page - 1) * params.pageSize;

    // マスターデータを取得
    const [statuses, sources] = await Promise.all([
        db.select().from(attendanceStatus),
        db.select().from(attendanceLogSource),
    ]);

    const statusMap = new Map(statuses.map((s) => [s.id, s.label]));
    const sourceMap = new Map(sources.map((s) => [s.id, s.label]));

    const items = await db
        .select()
        .from(attendanceLogs)
        .where(eq(attendanceLogs.userId, me.id))
        .orderBy(desc(attendanceLogs.startedAt))
        .limit(params.pageSize)
        .offset(offset);

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
        totalPages,
        currentPage: params.page,
        hasNextPage: params.page < totalPages,
        hasPrevPage: params.page > 1,
    };
}
