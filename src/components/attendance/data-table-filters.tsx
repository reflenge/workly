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
    data: any[];
    isAdmin: boolean;
    onFilteredDataChange: (filteredData: any[]) => void;
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

    /** 最初のマウント時に一度だけ実行
     * その月に含まれるユーザと状態を取得
     */
    useEffect(() => {
        const uniqueUsersMap = new Map<string, UserFilterItem>();
        data.forEach((item: any) => {
            const id = item.user?.id ?? "";
            const label = item.user?.fullName ?? "";
            if (id && !uniqueUsersMap.has(id)) {
                uniqueUsersMap.set(id, { id, label, checked: false });
            }
        });
        setUserList(Array.from(uniqueUsersMap.values()));

        const uniqueStatusMap = new Map<number, StatusFilterItem>();

        // まず全てのステータスを非選択状態で収集
        data.forEach((item: any) => {
            const id = item.status.id ?? 0;
            const label = item.status.label ?? "";
            if (id && !uniqueStatusMap.has(id)) {
                uniqueStatusMap.set(id, { id, label, checked: false });
            }
        });

        // 「勤務中」(id:2)が存在する場合は初期選択状態にする
        const statusListValues = Array.from(uniqueStatusMap.values());
        const hasWorkingStatus = statusListValues.some(
            (status) => status.id === 2
        );

        if (hasWorkingStatus) {
            // 「勤務中」のみ選択状態にして他は非選択
            const updatedStatusList = statusListValues.map((status) => ({
                ...status,
                checked: status.id === 2,
            }));
            setStatusList(updatedStatusList);
        } else {
            // 「勤務中」がない場合は全て非選択状態（全部表示）
            setStatusList(statusListValues);
        }
    }, [data]);

    useEffect(() => {
        // 両リストが全部falseなら、data全体を表示 (フィルタしない)
        if (
            userList.every((user) => user.checked === false) &&
            statusList.every((status) => status.checked === false)
        ) {
            onFilteredDataChangeRef.current(data);
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

        onFilteredDataChangeRef.current(filtered);
    }, [userList, statusList, data]);

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
        </div>
    );
}
