"use server";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { requireUser } from "@/lib/auth/requireUser";
import { eq } from "drizzle-orm";

export async function updateProjectRates(
    id: string,
    values: Partial<
        Pick<
            typeof projects.$inferInsert,
            "representativeHourlyRate" | "employeeHourlyRate"
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
