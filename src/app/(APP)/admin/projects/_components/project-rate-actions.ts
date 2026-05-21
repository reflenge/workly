"use server";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { requireUser } from "@/lib/auth/requireUser";
import { eq } from "drizzle-orm";

// プロジェクトの管理者向け設定（単価・見積もり・期間・バッファ率）を一括更新する
export async function updateProjectBudget(
    id: string,
    values: Partial<
        Pick<
            typeof projects.$inferInsert,
            | "representativeHourlyRate"
            | "employeeHourlyRate"
            | "estimatedTotalHours"
            | "estimatedTotalAmount"
            | "bufferRatio"
            | "startDate"
            | "endDate"
        >
    >
) {
    const user = await requireUser();

    // 管理者権限チェック (bypassユーザーもisAdmin=trueなのでOK)
    if (!user.isAdmin) {
        throw new Error("権限がありません");
    }

    await db.update(projects).set(values).where(eq(projects.id, id));
}
