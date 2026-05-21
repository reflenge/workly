import { type projects } from "@/db/schema";

export type ProjectBudgetStatus =
    | "ok"
    | "caution"
    | "warning"
    | "over"
    | "out_of_scope";

export interface BudgetThresholds {
    caution: number; // %
    warning: number; // %
    over: number; // %
}

export interface RoleBreakdown {
    roleCode: string;
    roleLabel: string;
    hours: number;
    amount: number;
}

export interface DailyDataPoint {
    date: string; // YYYY-MM-DD（JST）
    cumulativeHours: number;
    cumulativeAmount: number;
}

export interface ProjectBudgetSummary {
    project: typeof projects.$inferSelect;
    isOutOfScope: boolean;

    actualHours: number;
    actualAmount: number;

    periodProgress: number | null;
    hoursConsumption: number | null;
    amountConsumption: number | null;
    paceProjection: number | null;

    status: ProjectBudgetStatus;
    thresholds: BudgetThresholds | null;

    roleBreakdown: RoleBreakdown[];
    dailyTrend: DailyDataPoint[];
}

/**
 * ステータスごとの表示メタ情報を返す純関数（クライアント側でも利用可）
 */
export function getStatusBadgeInfo(status: ProjectBudgetStatus): {
    label: string;
    emoji: string;
    className: string;
} {
    switch (status) {
        case "ok":
            return {
                label: "順調",
                emoji: "🟢",
                className:
                    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
            };
        case "caution":
            return {
                label: "注意",
                emoji: "🟡",
                className:
                    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
            };
        case "warning":
            return {
                label: "警告",
                emoji: "🟠",
                className:
                    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
            };
        case "over":
            return {
                label: "超過",
                emoji: "🔴",
                className:
                    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
            };
        case "out_of_scope":
            return {
                label: "対象外",
                emoji: "💤",
                className:
                    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
            };
    }
}
