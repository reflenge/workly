"use client";

import { Button } from "@/components/ui/button";

type DetailRow = {
    workDate: string;
    startTime: string;
    elapsedTime: string;
    roleLabel: string;
    user: string;
    content: string;
};

type RoleTotals = {
    totalElapsedTime: string;
    rate: number | null;
    totalAmount: number | null;
};

type InvoiceTotals = {
    representative: RoleTotals;
    employee: RoleTotals;
    grandTotalAmount: number;
};

interface InvoiceDownloadButtonProps {
    detailRows: DetailRow[];
    totals: InvoiceTotals;
    fileName?: string;
}

const DETAIL_HEADERS = [
    "作業日",
    "開始時刻",
    "作業時間",
    "役職",
    "従業員名",
    "作業内容",
];

const toCsvValue = (value: string) => {
    const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    // CSVインジェクション対策: =,+,-,@,\t,\r で始まるセルはExcel等で数式として
    // 評価される可能性があるため、先頭にシングルクォートを付けて文字列化する。
    const sanitized = /^[=+\-@\t\r]/.test(normalized)
        ? `'${normalized}`
        : normalized;
    const escaped = sanitized.replace(/"/g, '""');
    return `"${escaped}"`;
};

const formatYen = (amount: number | null): string =>
    amount === null ? "" : `${amount.toLocaleString("ja-JP")}円`;

export function InvoiceDownloadButton({
    detailRows,
    totals,
    fileName = "invoice.csv",
}: InvoiceDownloadButtonProps) {
    const handleDownload = () => {
        const lines: string[] = [];

        lines.push(["[明細]"].map(toCsvValue).join(","));
        lines.push(DETAIL_HEADERS.map(toCsvValue).join(","));
        detailRows.forEach((row) => {
            lines.push(
                [
                    row.workDate,
                    row.startTime,
                    row.elapsedTime,
                    row.roleLabel,
                    row.user,
                    row.content,
                ]
                    .map(toCsvValue)
                    .join(",")
            );
        });

        lines.push("");
        lines.push(["[合計]"].map(toCsvValue).join(","));

        lines.push(
            ["代表 合計時間", totals.representative.totalElapsedTime]
                .map(toCsvValue)
                .join(",")
        );
        lines.push(
            ["代表 単価", formatYen(totals.representative.rate)]
                .map(toCsvValue)
                .join(",")
        );
        lines.push(
            ["代表 合計金額", formatYen(totals.representative.totalAmount)]
                .map(toCsvValue)
                .join(",")
        );

        lines.push(
            ["その他従業員 合計時間", totals.employee.totalElapsedTime]
                .map(toCsvValue)
                .join(",")
        );
        lines.push(
            ["その他従業員 単価", formatYen(totals.employee.rate)]
                .map(toCsvValue)
                .join(",")
        );
        lines.push(
            ["その他従業員 合計金額", formatYen(totals.employee.totalAmount)]
                .map(toCsvValue)
                .join(",")
        );

        lines.push(
            ["総合計金額", formatYen(totals.grandTotalAmount)]
                .map(toCsvValue)
                .join(",")
        );

        const csv = `﻿${lines.join("\r\n")}`;
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleDownload}
            disabled={detailRows.length === 0}
        >
            請求書付きダウンロード
        </Button>
    );
}
