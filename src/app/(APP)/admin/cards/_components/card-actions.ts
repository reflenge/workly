"use server";

import { db } from "@/db";
import { cards } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createCard(uid: string) {
    try {
        await db.insert(cards).values({ uid });
    } catch (error) {
        // console.error("カードの追加中にエラーが発生しました:", error);
        throw error;
    }
}

export async function updateCard(
    id: string,
    isActive: boolean,
    inactiveReason: string
) {
    try {
        await db
            .update(cards)
            .set({ isActive, inactiveReason })
            .where(eq(cards.id, id));
    } catch (error) {
        throw error;
    }
}
