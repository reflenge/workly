"use client";

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationNext,
} from "@/components/ui/pagination";
import { format, addMonths, subMonths, parse } from "date-fns";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";

interface MonthSelectorProps {
    minDate?: Date;
    maxDate?: Date;
}

export function MonthSelector({ minDate, maxDate }: MonthSelectorProps) {
    // nuqsを使用してURLのクエリパラメータ 'month' と状態を同期します
    // shallow: false にすることで、変更時にサーバーコンポーネント(page.tsx)の再レンダリングをトリガーします
    const [month, setMonth] = useQueryState("month", {
        defaultValue: format(new Date(), "yyyyMM"),
        shallow: false,
    });

    // ハイドレーションミスマッチ（サーバーとクライアントの表示不一致）を防ぐためのマウント判定
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const currentDate = parse(month, "yyyyMM", new Date());

    // 前月へ移動
    const handlePrevious = (e: React.MouseEvent) => {
        e.preventDefault();
        const newDate = subMonths(currentDate, 1);
        setMonth(format(newDate, "yyyyMM"));
    };

    // 次月へ移動
    const handleNext = (e: React.MouseEvent) => {
        e.preventDefault();
        const newDate = addMonths(currentDate, 1);
        setMonth(format(newDate, "yyyyMM"));
    };

    // データが存在する範囲外への移動を無効化
    const isPreviousDisabled = minDate
        ? format(currentDate, "yyyyMM") <= format(minDate, "yyyyMM")
        : false;
    const isNextDisabled = maxDate
        ? format(currentDate, "yyyyMM") >= format(maxDate, "yyyyMM")
        : false;

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={handlePrevious}
                        className={isPreviousDisabled ? "pointer-events-none opacity-50" : ""}
                        aria-disabled={isPreviousDisabled}
                    />
                </PaginationItem>
                <PaginationItem>
                    <span className="text-lg font-medium px-4">
                        {format(currentDate, "yyyy年MM月")}
                    </span>
                </PaginationItem>
                <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={handleNext}
                        className={isNextDisabled ? "pointer-events-none opacity-50" : ""}
                        aria-disabled={isNextDisabled}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}
