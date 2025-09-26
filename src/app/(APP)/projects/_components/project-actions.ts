"use server";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createProject(input: {
    name: string;
    description?: string;
}) {
    try {
        await db.insert(projects).values({
            name: input.name,
            description: input.description,
        });
    } catch (error) {
        throw error;
    }
}

export async function updateProject(
    id: string,
    values: Partial<
        Pick<
            typeof projects.$inferInsert,
            "name" | "description" | "isActive" | "inactiveReason"
        >
    >
) {
    try {
        await db.update(projects).set(values).where(eq(projects.id, id));
    } catch (error) {
        throw error;
    }
}
