"use client";

import { Button } from "@/components/ui/button";

type DownloadRow = {
    workDate: string;
    startTime: string;
    elapsedTime: string;
    user: string;
    content: string;
};

interface WorkLogDownloadButtonProps {
    rows: DownloadRow[];
    fileName?: string;
}

const HEADERS = [
    "作業日",
    "開始時刻",
    "作業時間",
    "従業員名",
    "作業内容",
];

const toCsvValue = (value: string) => {
    const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const escaped = normalized.replace(/"/g, '""');
    return `"${escaped}"`;
};

export function WorkLogDownloadButton({
    rows,
    fileName = "work-logs.csv",
}: WorkLogDownloadButtonProps) {
    const handleDownload = () => {
        const lines = [
            HEADERS.map(toCsvValue).join(","),
            ...rows.map((row) =>
                [
                    row.workDate,
                    row.startTime,
                    row.elapsedTime,
                    row.user,
                    row.content,
                ]
                    .map(toCsvValue)
                    .join(",")
            ),
        ];

        const csv = `\ufeff${lines.join("\r\n")}`;
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
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={rows.length === 0}
        >
            表示中の作業ログをダウンロード
        </Button>
    );
}
