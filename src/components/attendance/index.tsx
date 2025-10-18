import React from "react";
import { db } from "@/db";
import {
    attendanceLogs,
    attendanceStatus,
    attendanceLogSource,
    users,
} from "@/db/schema";

import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core"; // ← 重要

// 同一テーブルの別名を用意
const startSource = alias(attendanceLogSource, "start_source");
const endSource = alias(attendanceLogSource, "end_source");

interface AttendanceViewProps {
    isAdmin: boolean;
}

const AttendanceView = async ({ isAdmin }: AttendanceViewProps) => {
    const attendanceRecordsResult = await db
        .select({
            log: {
                id: attendanceLogs.id,
                startedAt: attendanceLogs.startedAt,
                endedAt: attendanceLogs.endedAt,
                note: attendanceLogs.note,
            },
            user: {
                id: users.id,
                isAdmin: users.isAdmin,
                lastName: users.lastName,
                firstName: users.firstName,
            },
            status: {
                id: attendanceStatus.id,
                label: attendanceStatus.label,
            },
            startedSource: {
                id: startSource.id,
                label: startSource.label,
            },
            endedSource: {
                id: endSource.id,
                label: endSource.label,
            },
        })
        .from(attendanceLogs)
        .innerJoin(users, eq(attendanceLogs.userId, users.id))
        .leftJoin(
            attendanceStatus,
            eq(attendanceLogs.statusId, attendanceStatus.id)
        )
        .leftJoin(startSource, eq(attendanceLogs.startedSource, startSource.id))
        .leftJoin(endSource, eq(attendanceLogs.endedSource, endSource.id))
        .limit(2);
    console.log(
        "🚀 -----------------------------------------------------------------------------------------🚀"
    );
    console.log(
        "🚀 => index.tsx:11 => AttendanceView => attendanceRecordsResult:",
        attendanceRecordsResult
    );
    console.log(
        "🚀 -----------------------------------------------------------------------------------------🚀"
    );
    return (
        <div>
            <p>AttendanceView</p>
            <p>isAdmin: {isAdmin ? "true" : "false"}</p>
            <div>
                attendanceRecordsResult:{" "}
                {JSON.stringify(attendanceRecordsResult, null, 2)}
            </div>
        </div>
    );
};

export default AttendanceView;
