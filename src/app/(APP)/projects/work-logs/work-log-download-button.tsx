"use client";

import { Button } from "@/components/ui/button";

type DownloadRow = {
    createdAt: string;
    user: string;
    project: string;
    content: string;
    startedAt: string;
    endedAt: string;
};

interface WorkLogDownloadButtonProps {
    rows: DownloadRow[];
    fileName?: string;
}

const HEADERS = [
    "日時",
    "ユーザー",
    "プロジェクト",
    "内容",
    "開始時間",
    "終了時間",
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
                    row.createdAt,
                    row.user,
                    row.project,
                    row.content,
                    row.startedAt,
                    row.endedAt,
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
