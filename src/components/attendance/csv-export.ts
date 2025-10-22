/**
 * CSV出力関連のユーティリティ関数
 */

/**
 * ミリ秒を「hh時間mm分ss秒SSSミリ秒」形式にフォーマット
 */
export const formatTimeForCSV = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    const ms = Math.floor(milliseconds % 1000);
    return `${hours}時間${minutes}分${seconds}秒${ms}ミリ秒`;
};

/**
 * 日時をCSV用にフォーマット (YYYY/MM/DD HH:MM:SS.SSS)
 */
export const formatDateTimeForCSV = (date: Date | null): string => {
    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const ms = String(date.getMilliseconds()).padStart(3, "0");

    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}.${ms}`;
};

/**
 * ユーザー別勤務時間のCSVをエクスポート
 */
export const exportUserWorkTimeCSV = (
    year: number,
    month: number,
    userSummary: Array<{
        userName: string;
        totalWorkingTimeMs: number;
    }>
): void => {
    // CSVヘッダー
    const headers = ["年", "月", "ユーザー名", "総労働時間"];

    // CSVデータ行
    const rows = userSummary.map((user) => [
        year.toString(),
        month.toString(),
        user.userName,
        formatTimeForCSV(user.totalWorkingTimeMs),
    ]);

    // CSVコンテンツを生成
    const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
    ].join("\n");

    // BOMを追加してExcelで文字化けしないようにする
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], {
        type: "text/csv;charset=utf-8;",
    });

    // ダウンロード
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Reflenge_勤務集計_${year}年${month}月.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * 個別ユーザーの詳細な勤務レコードをCSVでエクスポート
 */
export const exportUserDetailRecordsCSV = (
    year: number,
    month: number,
    userName: string,
    records: Array<{
        log: {
            startedAt: Date;
            endedAt: Date | null;
        };
        status: {
            label: string;
        } | null;
    }>
): void => {
    // CSVヘッダー
    const headers = ["年", "月", "ユーザー名", "開始", "終了", "ステータス"];

    // CSVデータ行
    const rows = records.map((record) => [
        year.toString(),
        month.toString(),
        userName,
        formatDateTimeForCSV(record.log.startedAt),
        formatDateTimeForCSV(record.log.endedAt),
        record.status?.label || "",
    ]);

    // CSVコンテンツを生成
    const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
    ].join("\n");

    // BOMを追加してExcelで文字化けしないようにする
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], {
        type: "text/csv;charset=utf-8;",
    });

    // ダウンロード
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
        "download",
        `Reflenge_勤務詳細_${userName}_${year}年${month}月.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
