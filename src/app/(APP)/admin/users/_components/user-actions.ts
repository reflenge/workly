"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

import { createClient } from "@supabase/supabase-js";

const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.service_role!, // ← service_role を必ず使う
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function createUser(input: {
    lastName: string;
    firstName: string;
    email: string;
    isAdmin?: boolean;
}) {
    try {
        const { data, error } = await admin.auth.admin.createUser({
            email: input.email,
            email_confirm: true,
        });
        if (error || !data?.user?.id) {
            throw error ?? new Error("Failed to create auth user");
        }

        await db.insert(users).values({
            authId: data.user.id,
            lastName: input.lastName,
            firstName: input.firstName,
            isAdmin: !!input.isAdmin,
        });
    } catch (error) {
        throw error;
    }
}

export async function updateUser(
    id: string,
    values: Partial<
        Pick<
            typeof users.$inferInsert,
            "lastName" | "firstName" | "isActive" | "bio" | "isAdmin"
        >
    >
) {
    try {
        await db.update(users).set(values).where(eq(users.id, id));
    } catch (error) {
        throw error;
    }
}
