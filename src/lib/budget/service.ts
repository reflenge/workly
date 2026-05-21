import "server-only";
import { db } from "@/db";
import {
    attendanceLogs,
    projects,
    userRole,
    users,
    workLogs,
} from "@/db/schema";
import Decimal from "decimal.js";
import { eq, inArray } from "drizzle-orm";
import { formatInTimeZone } from "date-fns-tz";
import type {
    BudgetThresholds,
    DailyDataPoint,
    ProjectBudgetStatus,
    ProjectBudgetSummary,
    RoleBreakdown,
} from "./types";

export type {
    BudgetThresholds,
    DailyDataPoint,
    ProjectBudgetStatus,
    ProjectBudgetSummary,
    RoleBreakdown,
} from "./types";

// userRole マスタは固定シードのため DB lookup は不要。表示ラベルをハードコード。
// （マスタに新ロールが増えた場合はここを更新する）
const ROLE_LABELS: Record<string, string> = {
    REPRESENTATIVE: "代表",
    EMPLOYEE: "その他従業員",
};

interface WorkLogRow {
    attendanceLogId: string;
    startedAt: Date | null;
    endedAt: Date | null;
    userRoleCode: string;
}

const baseLogColumns = {
    attendanceLogId: workLogs.attendanceLogId,
    startedAt: attendanceLogs.startedAt,
    endedAt: attendanceLogs.endedAt,
    userRoleCode: userRole.code,
};

/**
 * プロジェクトの予算ステータスを集計する（単一プロジェクト用）。
 *
 * 計算ロジック:
 * - 実績時間 = workLog に紐づく attendanceLog の時間を、同一 attendance に複数 workLog が
 *   ある場合は等分して積む（請求書付きCSV と同じ方式）
 * - 実績金額 = 役割別実績時間 × 役割別単価（Decimal で精度確保）
 * - 期間進捗率 = (今日 - startDate) / (endDate - startDate)
 * - 消化率 = 実績 / 見積もり
 * - ペース予測 = 消化率 / 期間進捗率 × 100（終了時の予測%）
 * - 閾値は project.bufferRatio から動的計算: 注意=(1-b)×100, 警告=(1-b/2)×100, 超過=100
 * - ステータスは「時間消化率」「金額消化率」「ペース予測」のうち最も厳しい値で判定
 *
 * @param projectId プロジェクトID
 * @param projectRow 既に取得済みのプロジェクトレコード（任意・あれば DB 1往復を節約）
 */
export async function getProjectBudgetSummary(
    projectId: string,
    projectRow?: typeof projects.$inferSelect
): Promise<ProjectBudgetSummary> {
    const project =
        projectRow ??
        (
            await db
                .select()
                .from(projects)
                .where(eq(projects.id, projectId))
                .limit(1)
        )[0];
    if (!project) {
        throw new Error("Project not found");
    }

    const logs = await db
        .select(baseLogColumns)
        .from(workLogs)
        .innerJoin(
            attendanceLogs,
            eq(workLogs.attendanceLogId, attendanceLogs.id)
        )
        .innerJoin(users, eq(workLogs.userId, users.id))
        .innerJoin(userRole, eq(users.roleId, userRole.id))
        .where(eq(workLogs.projectId, projectId));

    return computeSummary(project, logs);
}

/**
 * 複数プロジェクトの予算サマリーを一括取得する。
 * 単一クエリで workLogs を取得し、内部で projectId 別にグルーピングする
 * （単一版を N 回呼ぶと N+1 になるため）。
 */
export async function getProjectBudgetSummaries(
    projectRows: (typeof projects.$inferSelect)[]
): Promise<ProjectBudgetSummary[]> {
    if (projectRows.length === 0) return [];

    const projectIds = projectRows.map((p) => p.id);

    const logs = await db
        .select({
            projectId: workLogs.projectId,
            ...baseLogColumns,
        })
        .from(workLogs)
        .innerJoin(
            attendanceLogs,
            eq(workLogs.attendanceLogId, attendanceLogs.id)
        )
        .innerJoin(users, eq(workLogs.userId, users.id))
        .innerJoin(userRole, eq(users.roleId, userRole.id))
        .where(inArray(workLogs.projectId, projectIds));

    const logsByProject = new Map<string, WorkLogRow[]>();
    logs.forEach((log) => {
        const arr = logsByProject.get(log.projectId);
        if (arr) arr.push(log);
        else logsByProject.set(log.projectId, [log]);
    });

    return projectRows.map((project) =>
        computeSummary(project, logsByProject.get(project.id) ?? [])
    );
}

function computeSummary(
    project: typeof projects.$inferSelect,
    logs: WorkLogRow[]
): ProjectBudgetSummary {
    // 同じ勤怠枠に複数の workLog がある場合、時間を等分するためのカウント
    const attendanceCounts = new Map<string, number>();
    logs.forEach((log) => {
        attendanceCounts.set(
            log.attendanceLogId,
            (attendanceCounts.get(log.attendanceLogId) ?? 0) + 1
        );
    });

    const repRate = project.representativeHourlyRate
        ? Number(project.representativeHourlyRate)
        : 0;
    const empRate = project.employeeHourlyRate
        ? Number(project.employeeHourlyRate)
        : 0;

    let repHours = 0;
    let empHours = 0;
    const dailyMap = new Map<string, { hours: number; amount: number }>();

    logs.forEach((log) => {
        if (!log.startedAt || !log.endedAt) return;
        const diffMs = log.endedAt.getTime() - log.startedAt.getTime();
        if (diffMs <= 0) return;
        const count = attendanceCounts.get(log.attendanceLogId) ?? 1;
        const hours = diffMs / 1000 / 60 / 60 / count;
        const isRep = log.userRoleCode === "REPRESENTATIVE";
        const rate = isRep ? repRate : empRate;
        const amount = new Decimal(hours).mul(rate).toNumber();

        if (isRep) repHours += hours;
        else empHours += hours;

        // JST 基準で日付キーを作成（サーバーの local time に依存しないようにする）
        const dateKey = formatInTimeZone(
            log.startedAt,
            "Asia/Tokyo",
            "yyyy-MM-dd"
        );
        const dayData = dailyMap.get(dateKey) ?? { hours: 0, amount: 0 };
        dayData.hours += hours;
        dayData.amount += amount;
        dailyMap.set(dateKey, dayData);
    });

    const repAmount = new Decimal(repHours).mul(repRate).round().toNumber();
    const empAmount = new Decimal(empHours).mul(empRate).round().toNumber();

    const actualHours = repHours + empHours;
    const actualAmount = repAmount + empAmount;

    const sortedDates = Array.from(dailyMap.keys()).sort();
    let cumHours = 0;
    let cumAmount = 0;
    const dailyTrend: DailyDataPoint[] = sortedDates.map((date) => {
        const data = dailyMap.get(date)!;
        cumHours += data.hours;
        cumAmount += data.amount;
        return {
            date,
            cumulativeHours: cumHours,
            cumulativeAmount: cumAmount,
        };
    });

    const roleBreakdown: RoleBreakdown[] = [
        {
            roleCode: "REPRESENTATIVE",
            roleLabel: ROLE_LABELS.REPRESENTATIVE,
            hours: repHours,
            amount: repAmount,
        },
        {
            roleCode: "EMPLOYEE",
            roleLabel: ROLE_LABELS.EMPLOYEE,
            hours: empHours,
            amount: empAmount,
        },
    ];

    const estimatedHours = project.estimatedTotalHours
        ? Number(project.estimatedTotalHours)
        : null;
    const estimatedAmount = project.estimatedTotalAmount
        ? Number(project.estimatedTotalAmount)
        : null;
    const bufferRatio = Number(project.bufferRatio);

    const hasFullEstimate =
        !!estimatedHours &&
        !!estimatedAmount &&
        !!project.startDate &&
        !!project.endDate;

    if (!hasFullEstimate) {
        return {
            project,
            isOutOfScope: true,
            actualHours,
            actualAmount,
            periodProgress: null,
            hoursConsumption: null,
            amountConsumption: null,
            paceProjection: null,
            status: "out_of_scope",
            thresholds: null,
            roleBreakdown,
            dailyTrend,
        };
    }

    const today = new Date();
    const start = new Date(project.startDate + "T00:00:00");
    const end = new Date(project.endDate + "T23:59:59");

    let periodProgress: number;
    if (today < start) {
        periodProgress = 0;
    } else if (today > end) {
        periodProgress = 100;
    } else {
        const totalMs = end.getTime() - start.getTime();
        const elapsedMs = today.getTime() - start.getTime();
        periodProgress = Math.min(
            100,
            Math.max(0, (elapsedMs / totalMs) * 100)
        );
    }

    const hoursConsumption = (actualHours / estimatedHours!) * 100;
    const amountConsumption = (actualAmount / estimatedAmount!) * 100;
    const paceProjection =
        periodProgress > 0 ? (hoursConsumption / periodProgress) * 100 : 0;

    const thresholds: BudgetThresholds = {
        caution: (1 - bufferRatio) * 100,
        warning: (1 - bufferRatio / 2) * 100,
        over: 100,
    };

    // 「時間消化率」「金額消化率」「ペース予測」のうち最も厳しい値で判定
    const maxRatio = Math.max(
        hoursConsumption,
        amountConsumption,
        paceProjection
    );
    let status: ProjectBudgetStatus;
    if (maxRatio >= thresholds.over) status = "over";
    else if (maxRatio >= thresholds.warning) status = "warning";
    else if (maxRatio >= thresholds.caution) status = "caution";
    else status = "ok";

    return {
        project,
        isOutOfScope: false,
        actualHours,
        actualAmount,
        periodProgress,
        hoursConsumption,
        amountConsumption,
        paceProjection,
        status,
        thresholds,
        roleBreakdown,
        dailyTrend,
    };
}
