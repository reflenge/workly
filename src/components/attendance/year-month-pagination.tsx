"use client";

import { useQueryStates, parseAsString } from "nuqs";
import { parseYearMonthParams, getYearMonthPagination } from "./util";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface YearMonthPaginationProps {
    className?: string;
}

export const YearMonthPagination = ({ className }: YearMonthPaginationProps) => {
    // URLパラメータの状態管理
    const [params, setParams] = useQueryStates({
        month: parseAsString,
        users: parseAsString,
        statuses: parseAsString,
    });

    // 年月の検索パラメータをバリデーション
    const { year, month } = parseYearMonthParams(params.month);

    // 年月のページネーション情報を取得
    const {
        prevYear,
        prevMonth,
        nextYear,
        nextMonth,
        hasPrev,
        hasNext,
    } = getYearMonthPagination(year, month);

    // URLを生成する関数（nuqsを使った状態更新）
    const createNavigationHandler = (targetYear: number, targetMonth: number) => {
        return (e: React.MouseEvent) => {
            e.preventDefault();
            const monthStr = `${targetYear}${targetMonth.toString().padStart(2, "0")}`;
            setParams({
                month: monthStr,
                users: null,
                statuses: null,
            });
        };
    };

    return (
        <Pagination className={className}>
            <PaginationContent>
                {/* Previous button */}
                <PaginationItem>
                    {hasPrev ? (
                        <PaginationPrevious
                            href="#"
                            onClick={createNavigationHandler(prevYear, prevMonth)}
                        />
                    ) : (
                        <PaginationPrevious
                            href="#"
                            className="pointer-events-none opacity-50"
                            onClick={(e) => e.preventDefault()}
                        />
                    )}
                </PaginationItem>

                {/* 現在の月 */}
                <PaginationItem>
                    <div className="px-4 font-semibold text-base">
                        {year}年{month.toString().padStart(2, "0")}月
                    </div>
                </PaginationItem>

                {/* Next button */}
                <PaginationItem>
                    {hasNext ? (
                        <PaginationNext
                            href="#"
                            onClick={createNavigationHandler(nextYear, nextMonth)}
                        />
                    ) : (
                        <PaginationNext
                            href="#"
                            className="pointer-events-none opacity-50"
                            onClick={(e) => e.preventDefault()}
                        />
                    )}
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
};

export default YearMonthPagination;
