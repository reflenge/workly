/**
 * カンマ区切りの文字列を整数配列に変換します。オプションでmin/maxの範囲フィルタも可能です。
 * 無効な値や範囲外の値は除外されます。
 *
 * @param {string | null} paramStr - 変換対象のカンマ区切り文字列
 * @param {Object} [opts] - 値のフィルタオプション
 * @param {number} [opts.min] - 許容する最小値（含む）
 * @param {number} [opts.max] - 許容する最大値（含む）
 * @returns {number[] | null} 有効な整数値配列。該当値がなければnull。
 */
export const parseNumberArrayParam = (
    paramStr: string | null,
    opts?: { min?: number; max?: number }
): number[] | null => {
    if (!paramStr) return null;
    const filtered = paramStr
        .split(",")
        .map((s) => {
            s = s.trim();
            if (!/^\d+$/.test(s)) return null;
            const num = Number(s);
            if (!Number.isInteger(num)) return null;
            if (
                (opts?.min != null && num < opts.min) ||
                (opts?.max != null && num > opts.max)
            )
                return null;
            return num;
        })
        .filter((num): num is number => num !== null);
    return filtered.length > 0 ? filtered : null;
};

/**
 * UUIDv4かを判定するヘルパー
 */
const isUUIDv4 = (s: string) => {
    // UUIDv4の厳密な正規表現
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        s
    );
};

/**
 * カンマ区切り文字列をUUIDv4配列にして返す。1つも有効値がなければnull。
 */
export const parseUuidV4ArrayParam = (
    paramStr: string | null
): string[] | null => {
    if (!paramStr) return null;
    const uuids = paramStr
        .split(",")
        .map((s) => s.trim())
        .filter(isUUIDv4);
    return uuids.length > 0 ? uuids : null;
};
