"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AttendanceRecordsResultType } from "./actions";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format, toZonedTime } from "date-fns-tz";

export const columns: ColumnDef<AttendanceRecordsResultType>[] = [
    {
        accessorKey: "user.fullName",
        header: "User",
        meta: {
            label: "User",
        },
    },
    {
        accessorKey: "status.label",
        header: "Status",
        meta: {
            label: "Status",
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
                    Start
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
            label: "Start",
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
                    End
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
            label: "End",
        },
    },
    {
        accessorKey: "log.note",
        header: "Note",
        meta: {
            label: "Note",
        },
    },
    {
        accessorKey: "startedSource.label",
        header: "Start Source",
        meta: {
            label: "Start Source",
        },
    },
    {
        accessorKey: "endedSource.label",
        header: "End Source",
        meta: {
            label: "SEnd Source",
        },
    },
];
