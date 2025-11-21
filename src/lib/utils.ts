import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSSのクラス名を結合・競合解決するユーティリティ
 * @param inputs - クラス名の配列や条件付きオブジェクト
 * @returns 結合されたクラス名文字列
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * UTC時刻をJST(日本標準時)に変換して、読みやすい日本語形式でフォーマットします
 *
 * @param date - UTC時刻（Date オブジェクトまたは ISO文字列）
 * @returns フォーマットされた日時文字列（例: "2024/01/15 14:30:45"）
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
 * UTC時刻をJST(日本標準時)に変換して、日付部分のみをフォーマットします
 *
 * @param date - UTC時刻（Date オブジェクトまたは ISO文字列）
 * @returns フォーマットされた日付文字列（例: "2024/01/15"）
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
