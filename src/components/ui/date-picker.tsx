"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
    value?: Date;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
    className?: string;
    monthOnly?: boolean;
}

export function DatePicker({
    value,
    onChange,
    placeholder = "日付を選択",
    className,
    monthOnly = false,
}: DatePickerProps) {
    const handleDateChange = React.useCallback(
        (date: Date | undefined) => {
            if (monthOnly && date) {
                // 月のみ選択の場合は日付を1日に強制設定
                const normalizedDate = new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    1
                );
                onChange?.(normalizedDate);
            } else {
                onChange?.(date);
            }
        },
        [onChange, monthOnly]
    );

    const formatValue = React.useCallback(
        (date: Date) => {
            if (monthOnly) {
                return format(date, "yyyy/MM");
            }
            return format(date, "yyyy/MM/dd");
        },
        [monthOnly]
    );

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    data-empty={!value}
                    className={cn(
                        "data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? formatValue(value) : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={handleDateChange}
                    captionLayout={monthOnly ? "dropdown" : "label"}
                    fromYear={1900}
                    toYear={2100}
                />
            </PopoverContent>
        </Popover>
    );
}
