"use client";
import React, { useState, useCallback } from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTableFilters } from "./data-table-filters";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    isAdmin: boolean;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    isAdmin,
}: DataTableProps<TData, TValue>) {
    const [filteredData, setFilteredData] = useState<TData[]>(data);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
        user_fullName: isAdmin,
        startedSource_label: false,
        endedSource_label: false,
        calculatedPay_workingTimeMs: false,
        compensation_hourlyRate: false,
    });
    const table = useReactTable({
        data: filteredData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
        },
    });
    // console.log(data);

    const handleFilteredDataChange = useCallback((filtered: TData[]) => {
        setFilteredData(filtered);
    }, []);

    return (
        <div>
            <div className="flex flex-wrap items-center py-4 gap-2">
                <DataTableFilters
                    data={data}
                    isAdmin={isAdmin}
                    onFilteredDataChange={handleFilteredDataChange}
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            表示列
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {(
                                            column.columnDef.meta as {
                                                label: string;
                                            }
                                        )?.label ?? column.id}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext()
                                                  )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => {
                                return (
                                    <TableRow
                                        key={row.id}
                                        data-state={
                                            row.getIsSelected() && "selected"
                                        }
                                    >
                                        {row.getVisibleCells().map((cell) => {
                                            if (
                                                cell.column.id ===
                                                "status_label"
                                            ) {
                                                // ステータスだけバッヂで表示

                                                return (
                                                    <TableCell key={cell.id}>
                                                        <Badge
                                                            variant={
                                                                cell.renderValue() ===
                                                                "勤務中"
                                                                    ? "default"
                                                                    : cell.renderValue() ===
                                                                      "休憩中"
                                                                    ? "secondary"
                                                                    : "destructive"
                                                            }
                                                        >
                                                            {flexRender(
                                                                cell.column
                                                                    .columnDef
                                                                    .cell,
                                                                cell.getContext()
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                );
                                            }

                                            /** 時給の非表示条件 */
                                            if (
                                                (row.original as any)?.status
                                                    ?.id !== 2 &&
                                                cell.column.id ===
                                                    "compensation_hourlyRate"
                                            ) {
                                                return (
                                                    <TableCell key={cell.id}>
                                                        <div className="text-right">
                                                            -
                                                        </div>
                                                    </TableCell>
                                                );
                                            }

                                            /** 暫定支給額の非表示条件 */
                                            if (
                                                // 'status' が存在しない場合や 'label' が "勤務中" でない場合
                                                (row.original as any)?.status
                                                    ?.id !== 2 &&
                                                cell.column.id ===
                                                    "calculatedPay_hourlyPay"
                                            ) {
                                                return (
                                                    <TableCell key={cell.id}>
                                                        <div className="text-right">
                                                            -
                                                        </div>
                                                    </TableCell>
                                                );
                                            }

                                            return (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef
                                                            .cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
