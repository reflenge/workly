"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AttendanceRecordsResultType } from "./actions";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, toZonedTime } from "date-fns-tz";
import { MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";

// Actionsコンポーネントを分離
const ActionsCell = ({ payment }: { payment: AttendanceRecordsResultType }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleViewNote = () => {
        setIsDropdownOpen(false);
        // 少し遅延させてDropdownMenuの閉じる処理を待つ
        setTimeout(() => {
            setIsDialogOpen(true);
        }, 100);
    };

    return (
        <>
            <DropdownMenu
                open={isDropdownOpen}
                onOpenChange={setIsDropdownOpen}
            >
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={handleViewNote}>
                        View Note
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Note</DialogTitle>
                        <DialogDescription>
                            {payment.log.note ?? "-"}
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </>
    );
};

export const columns: ColumnDef<AttendanceRecordsResultType>[] = [
    {
        accessorKey: "user.fullName",
        header: "ユーザ",
        meta: {
            label: "ユーザ",
        },
    },
    {
        accessorKey: "status.label",
        header: "状態",
        meta: {
            label: "状態",
        },
    },
    {
        accessorKey: "log.startedAt",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    開始時刻
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            return format(
                toZonedTime(row.original.log.startedAt, "Asia/Tokyo"),
                "yyyy/MM/dd HH:mm:ss.SSS"
            );
        },
        meta: {
            label: "開始時刻",
        },
    },
    {
        accessorKey: "log.endedAt",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    終了時刻
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            if (!row.original.log.endedAt) return "-";
            return format(
                toZonedTime(row.original.log.endedAt, "Asia/Tokyo"),
                "yyyy/MM/dd HH:mm:ss.SSS"
            );
        },
        meta: {
            label: "終了時刻",
        },
    },
    {
        accessorKey: "startedSource.label",
        header: "開始元",
        meta: {
            label: "開始元",
        },
    },
    {
        accessorKey: "endedSource.label",
        header: "終了元",
        meta: {
            label: "終了元",
        },
    },
    {
        accessorKey: "calculatedPay.workingTimeMs",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    className="w-full justify-end pr-0"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    勤務時間(ms)
                    <ArrowUpDown className="h-4 w-4" />
                </Button>
            );
        },
        meta: {
            label: "勤務時間(ms)",
        },
    },
    {
        accessorKey: "compensation.hourlyRate",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    className="w-full justify-end pr-0"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    時給
                    <ArrowUpDown className="h-4 w-4" />
                </Button>
            );
        },
        meta: {
            label: "時給",
        },
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("compensation_hourlyRate"));
            const formatted = new Intl.NumberFormat("ja-JP", {
                style: "currency",
                currency: "JPY",
                maximumFractionDigits: 0,
            }).format(amount);

            return <div className="text-right font-medium">{formatted}</div>;
        },
    },
    {
        accessorKey: "calculatedPay.hourlyPay",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    className="w-full justify-end pr-0"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    暫定支給額
                    <ArrowUpDown className="h-4 w-4" />
                </Button>
            );
        },
        meta: {
            label: "暫定支給額",
        },
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("calculatedPay_hourlyPay"));
            const formatted = new Intl.NumberFormat("ja-JP", {
                style: "currency",
                currency: "JPY",
                maximumFractionDigits: 0,
            }).format(amount);

            return <div className="text-right font-medium">{formatted}</div>;
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const payment = row.original;
            return <ActionsCell payment={payment} />;
        },
    },
];
