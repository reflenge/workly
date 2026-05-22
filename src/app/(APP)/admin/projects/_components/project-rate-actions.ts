"use server";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { requireUser } from "@/lib/auth/requireUser";
import { eq } from "drizzle-orm";

// このアクションで更新を許可する列。プロジェクト名・説明・有効状態などは含めない
type BudgetFields = Pick<
    typeof projects.$inferInsert,
    | "representativeHourlyRate"
    | "employeeHourlyRate"
    | "estimatedTotalHours"
    | "estimatedTotalAmount"
    | "bufferRatio"
    | "startDate"
    | "endDate"
>;

// 0以上の数値文字列、または null（未設定）のみ許可
const sanitizeNonNegative = (value: unknown, label: string): string | null => {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
        throw new Error(`${label}は0以上の数値で指定してください`);
    }
    return String(n);
};

// バッファ率: 0以上1未満。NOT NULL 制約があるため null は不可
const sanitizeBufferRatio = (value: unknown): string => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n >= 1) {
        throw new Error("バッファ率は0以上1未満で指定してください");
    }
    return String(n);
};

// "YYYY-MM-DD" 形式の妥当な日付文字列、または null のみ許可
const sanitizeDate = (value: unknown): string | null => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error("日付の形式が不正です");
    }
    if (Number.isNaN(Date.parse(value))) {
        throw new Error("日付の形式が不正です");
    }
    return value;
};

/**
 * プロジェクトの予算設定（単価・見積もり・期間・バッファ率）を更新する。
 *
 * セキュリティ: クライアント側の検証は信頼せず（サーバーアクションは画面を経由せず
 * 直接呼べる独立した境界）、許可列のみを抽出してサーバー側で再検証する。プロジェクト
 * 名・説明・有効状態などは values に紛れ込んでいても無視され、ここでは更新しない。
 */
export async function updateProjectBudget(
    id: string,
    values: Partial<BudgetFields>
) {
    const user = await requireUser();

    // 管理者権限チェック (bypassユーザーもisAdmin=trueなのでOK)
    if (!user.isAdmin) {
        throw new Error("権限がありません");
    }

    // 許可列のみを抽出。values に存在するキーだけを部分更新の対象にする
    const patch: Partial<BudgetFields> = {};

    if ("representativeHourlyRate" in values) {
        patch.representativeHourlyRate = sanitizeNonNegative(
            values.representativeHourlyRate,
            "代表の時給単価"
        );
    }
    if ("employeeHourlyRate" in values) {
        patch.employeeHourlyRate = sanitizeNonNegative(
            values.employeeHourlyRate,
            "その他従業員の時給単価"
        );
    }
    if ("estimatedTotalHours" in values) {
        patch.estimatedTotalHours = sanitizeNonNegative(
            values.estimatedTotalHours,
            "見積もり総時間"
        );
    }
    if ("estimatedTotalAmount" in values) {
        patch.estimatedTotalAmount = sanitizeNonNegative(
            values.estimatedTotalAmount,
            "見積もり総金額"
        );
    }
    if ("bufferRatio" in values) {
        patch.bufferRatio = sanitizeBufferRatio(values.bufferRatio);
    }
    if ("startDate" in values) {
        patch.startDate = sanitizeDate(values.startDate);
    }
    if ("endDate" in values) {
        patch.endDate = sanitizeDate(values.endDate);
    }

    if (patch.startDate && patch.endDate && patch.startDate > patch.endDate) {
        throw new Error("終了予定日は開始日以降を指定してください");
    }

    if (Object.keys(patch).length === 0) return;

    await db.update(projects).set(patch).where(eq(projects.id, id));
}
