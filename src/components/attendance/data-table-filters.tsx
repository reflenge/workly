"use client";

import React, { useEffect, useState, useRef } from "react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";
import { AttendanceRecordsResultType } from "./actions";

type Checked = DropdownMenuCheckboxItemProps["checked"];

interface UserFilterItem {
    id: string;
    label: string;
    checked: Checked;
}

interface StatusFilterItem {
    id: number;
    label: string;
    checked: Checked;
}

interface DataTableFiltersProps {
    data: AttendanceRecordsResultType[];
    isAdmin: boolean;
    onFilteredDataChange: (filteredData: AttendanceRecordsResultType[]) => void;
}

export function DataTableFilters({
    data,
    isAdmin,
    onFilteredDataChange,
}: DataTableFiltersProps) {
    const [userList, setUserList] = useState<UserFilterItem[]>([]);
    const [statusList, setStatusList] = useState<StatusFilterItem[]>([]);
    const onFilteredDataChangeRef = useRef(onFilteredDataChange);

    // refを最新の値で更新
    useEffect(() => {
        onFilteredDataChangeRef.current = onFilteredDataChange;
    }, [onFilteredDataChange]);

    /** データからユーザーリストと状態リストを構築（初期状態：全ユーザー、勤務中のみ） */
    useEffect(() => {
        if (data.length === 0) return;

        // ユニークなユーザーを収集（全て選択状態）
        const uniqueUsersMap = new Map<string, UserFilterItem>();
        data.forEach((item: AttendanceRecordsResultType) => {
            const id = item.user?.id ?? "";
            const label = item.user?.fullName ?? "";
            if (id && !uniqueUsersMap.has(id)) {
                uniqueUsersMap.set(id, { id, label, checked: true });
            }
        });
        setUserList(Array.from(uniqueUsersMap.values()));

        // ユニークな状態を収集（勤務中のみ選択状態）
        const uniqueStatusMap = new Map<number, StatusFilterItem>();
        data.forEach((item: AttendanceRecordsResultType) => {
            const id = item.status?.id ?? 0;
            const label = item.status?.label ?? "";
            if (id && !uniqueStatusMap.has(id)) {
                uniqueStatusMap.set(id, {
                    id,
                    label,
                    checked: id === 2 // 勤務中のみ選択
                });
            }
        });
        setStatusList(Array.from(uniqueStatusMap.values()));
    }, [data]);

    // フィルタリング処理
    useEffect(() => {
        if (userList.length === 0 || statusList.length === 0) {
            return;
        }

        // 両リストが全部falseなら、data全体を表示
        if (
            userList.every((user) => user.checked === false) &&
            statusList.every((status) => status.checked === false)
        ) {
            onFilteredDataChangeRef.current(data);
            return;
        }

        let filtered = data;

        // ユーザーフィルタ
        const checkedUserIds = userList
            .filter((user) => user.checked)
            .map((user) => user.id);
        if (checkedUserIds.length > 0 && checkedUserIds.length < userList.length) {
            filtered = filtered.filter((item: AttendanceRecordsResultType) =>
                checkedUserIds.includes(item.user?.id ?? "")
            );
        }

        // 状態フィルタ
        const checkedStatusIds = statusList
            .filter((status) => status.checked)
            .map((status) => status.id);
        if (checkedStatusIds.length > 0 && checkedStatusIds.length < statusList.length) {
            filtered = filtered.filter((item: AttendanceRecordsResultType) =>
                checkedStatusIds.includes(item.status?.id ?? 0)
            );
        }

        onFilteredDataChangeRef.current(filtered);
    }, [userList, statusList, data]);

    // 初期状態に戻す関数（ユーザー全選択、状態は勤務中のみ）
    const resetToInitialState = () => {
        setUserList(
            userList.map((user) => ({
                ...user,
                checked: true,
            }))
        );
        setStatusList(
            statusList.map((status) => ({
                ...status,
                checked: status.id === 2,
            }))
        );
    };

    // すべて表示する関数
    const showAll = () => {
        setUserList(
            userList.map((user) => ({
                ...user,
                checked: true,
            }))
        );
        setStatusList(
            statusList.map((status) => ({
                ...status,
                checked: true,
            }))
        );
    };

    return (
        <div className="flex flex-wrap items-center py-4 gap-2">
            {isAdmin && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            ユーザ
                            {userList.filter((user) => user.checked).length >
                                0 && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                        {
                                            userList.filter((user) => user.checked)
                                                .length
                                        }
                                        件選択中
                                    </span>
                                )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {userList
                            .slice()
                            .sort((a, b) => a.id.localeCompare(b.id))
                            .map((user) => (
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
                                    {user.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() =>
                                setUserList(
                                    userList.map((userChecked) => ({
                                        ...userChecked,
                                        checked: true,
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
                        {statusList.filter((status) => status.checked).length >
                            0 && (
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
                    {statusList
                        .slice()
                        .sort((a, b) => a.id - b.id)
                        .map((status) => (
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
                                    checked: true,
                                }))
                            )
                        }
                    >
                        全ての状態を表示
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={showAll}>
                すべて表示
            </Button>
            <Button variant="ghost" onClick={resetToInitialState}>
                初期表示に戻す
            </Button>
        </div>
    );
}
