"use server";

import { db } from "@/db";
import { workLogs } from "@/db/schema";
import { requireUser } from "@/lib/auth/requireUser";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateWorkLog(
    id: string,
    projectId: string,
    content: string
) {
    const user = await requireUser();

    // Verify ownership and update
    const result = await db
        .update(workLogs)
        .set({
            projectId: projectId,
            content: content,
            updatedAt: new Date(),
        })
        .where(and(eq(workLogs.id, id), eq(workLogs.userId, user.id)))
        .returning();

    if (result.length === 0) {
        throw new Error("Failed to update work log or permission denied.");
    }

    revalidatePath("/projects/work-logs");
    return { success: true };
}

export async function deleteWorkLog(id: string) {
    const user = await requireUser();

    const result = await db
        .delete(workLogs)
        .where(and(eq(workLogs.id, id), eq(workLogs.userId, user.id)))
        .returning();

    if (result.length === 0) {
        throw new Error("Failed to delete work log or permission denied.");
    }

    revalidatePath("/projects/work-logs");
    return { success: true };
}
