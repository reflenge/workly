import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * UTC時刻をJSTに変換して日本語形式で表示する
 * @param date UTC時刻（Date オブジェクトまたは文字列）
 * @returns JST時刻の日本語表示文字列（例: "2024/01/15 14:30:45"）
 */
export function formatToJstDateTime(date: Date | string): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const jstDate = new Date(dateObj.getTime() + 9 * 60 * 60 * 1000);
    return jstDate.toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "UTC",
    });
}

/**
 * UTC時刻をJSTに変換して日付のみ表示する
 * @param date UTC時刻（Date オブジェクトまたは文字列）
 * @returns JST時刻の日付表示文字列（例: "2024/01/15"）
 */
export function formatToJstDate(date: Date | string): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const jstDate = new Date(dateObj.getTime() + 9 * 60 * 60 * 1000);
    return jstDate.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "UTC",
    });
}
