"use client";

import { Button } from "@/components/ui/button";
import { format, addMonths, subMonths, parse } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
    const handlePrevious = () => {
        const newDate = subMonths(currentDate, 1);
        setMonth(format(newDate, "yyyyMM"));
    };

    // 次月へ移動
    const handleNext = () => {
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
        <div className="flex items-center gap-4">
            <Button
                variant="outline"
                size="icon"
                onClick={handlePrevious}
                disabled={isPreviousDisabled}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium">
                {format(currentDate, "yyyy年MM月")}
            </span>
            <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                disabled={isNextDisabled}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
