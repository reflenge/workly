/**
 * データフォーマット用のユーティリティ関数
 */

/**
 * 時間を「○時間△分」形式で返すユーティリティ関数。
 * showSeconds, showMillisecondsがtrueの場合、それぞれ秒・ミリ秒まで表示する。
 *
 * @param milliseconds - ミリ秒単位の時間
 * @param opts - { showSeconds?: boolean, showMilliseconds?: boolean }
 * @returns フォーマット済み時間文字列
 * @example
 * formatTime(8600000) // "2時間23分"
 * formatTime(8600000, { showSeconds: true }) // "2時間23分20秒"
 */
export const formatTime = (
    milliseconds: number,
    opts?: {
        showSeconds?: boolean;
        showMilliseconds?: boolean;
    }
): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    let result = `${hours}時間${minutes}分`;

    if (opts?.showSeconds || opts?.showMilliseconds) {
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
        result += `${seconds}秒`;
    }
    if (opts?.showMilliseconds) {
        // 小数点が出た場合は切り捨て
        const ms = Math.floor(milliseconds % 1000);
        result += `${ms}ミリ秒`;
    }
    return result;
};

/**
 * 金額を日本円形式で表示するヘルパー関数
 *
 * @param amount - 金額（数値）
 * @returns フォーマット済み通貨文字列
 * @example
 * formatCurrency(41234) // "￥41,234"
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency: "JPY",
        maximumFractionDigits: 0,
    }).format(amount);
};
