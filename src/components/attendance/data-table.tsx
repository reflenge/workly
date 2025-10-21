"use client";
import React, { useEffect, useState } from "react";
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
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    isAdmin: boolean;
}

type Checked = DropdownMenuCheckboxItemProps["checked"];

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
        compensation_hourlyRate: true,
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
    const [userList, setUserList] = useState<
        { id: string; fullName: string; checked: Checked }[]
    >([]);
    const [statusList, setStatusList] = useState<
        { id: number; label: string; checked: Checked }[]
    >([]);
    /** 最初のマウント時に一度だけ実行
     * その月に含まれるユーザと状態を取得
     */
    useEffect(() => {
        const uniqueUsersMap = new Map<
            string,
            { id: string; fullName: string; checked: Checked }
        >();
        data.forEach((item: any) => {
            const id = item.user?.id ?? "";
            const fullName = item.user?.fullName ?? "";
            if (id && !uniqueUsersMap.has(id)) {
                uniqueUsersMap.set(id, { id, fullName, checked: false });
            }
        });
        setUserList(Array.from(uniqueUsersMap.values()));

        const uniqueStatusMap = new Map<
            number,
            { id: number; label: string; checked: Checked }
        >();
        data.forEach((item: any) => {
            const id = item.status.id ?? 0;
            const label = item.status.label ?? "";
            if (id && !uniqueStatusMap.has(id)) {
                uniqueStatusMap.set(id, { id, label, checked: false });
            }
        });
        setStatusList(Array.from(uniqueStatusMap.values()));
    }, []);

    useEffect(() => {
        // 両リストが全部falseなら、data全体を表示 (フィルタしない)
        if (
            userList.every((user) => user.checked === false) &&
            statusList.every((status) => status.checked === false)
        ) {
            setFilteredData(data);
            return;
        }

        let filtered = data;

        // ユーザのどれかがチェックされていれば、そのユーザに限定
        if (userList.some((user) => user.checked)) {
            const checkedUsers = userList
                .filter((user) => user.checked)
                .map((user) => user.id);
            filtered = filtered.filter((item: any) =>
                checkedUsers.includes(item.user?.id ?? "")
            );
        }

        // 状態のどれかがチェックされていれば、その状態に限定
        if (statusList.some((status) => status.checked)) {
            const checkedStatuses = statusList
                .filter((status) => status.checked)
                .map((status) => status.id);
            filtered = filtered.filter((item: any) =>
                checkedStatuses.includes(item.status?.id ?? 0)
            );
        }

        setFilteredData(filtered);
    }, [userList, statusList, data]);

    return (
        <div>
            <div className="flex items-center py-4 gap-2">
                {isAdmin && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                ユーザ
                                {userList.filter((user) => user.checked)
                                    .length > 0 && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                        {
                                            userList.filter(
                                                (user) => user.checked
                                            ).length
                                        }
                                        件選択中
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {userList.map((user) => (
                                <DropdownMenuCheckboxItem
                                    key={user.id}
                                    checked={user.checked}
                                    onCheckedChange={(value) =>
                                        setUserList(
                                            userList.map((userChecked) =>
                                                userChecked.id === user.id
                                                    ? {
                                                          ...userChecked,
                                                          checked: value,
                                                      }
                                                    : userChecked
                                            )
                                        )
                                    }
                                >
                                    {user.fullName}
                                </DropdownMenuCheckboxItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() =>
                                    setUserList(
                                        userList.map((userChecked) => ({
                                            ...userChecked,
                                            checked: false,
                                        }))
                                    )
                                }
                            >
                                全てのユーザを表示
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            状態
                            {statusList.filter((status) => status.checked)
                                .length > 0 && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                    {
                                        statusList.filter(
                                            (status) => status.checked
                                        ).length
                                    }
                                    件選択中
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {statusList.map((status) => (
                            <DropdownMenuCheckboxItem
                                key={status.id}
                                checked={status.checked}
                                onCheckedChange={(value) =>
                                    setStatusList(
                                        statusList.map((statusChecked) =>
                                            statusChecked.id === status.id
                                                ? {
                                                      ...statusChecked,
                                                      checked: value,
                                                  }
                                                : statusChecked
                                        )
                                    )
                                }
                            >
                                {status.label}
                            </DropdownMenuCheckboxItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() =>
                                setStatusList(
                                    statusList.map((statusChecked) => ({
                                        ...statusChecked,
                                        checked: false,
                                    }))
                                )
                            }
                        >
                            全ての状態を表示
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button
                    variant="ghost"
                    className=""
                    onClick={() => {
                        setUserList(
                            userList.map((user) => ({
                                ...user,
                                checked: false,
                            }))
                        );
                        setStatusList(
                            statusList.map((status) => ({
                                ...status,
                                checked: false,
                            }))
                        );
                    }}
                >
                    クリア
                </Button>
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
