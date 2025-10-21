"use client";

import { useSearchParams } from "next/navigation";
import { parseYearMonthParams, getYearMonthPagination } from "./util";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface YearMonthPaginationProps {
    className?: string;
}

const YearMonthPagination = ({ className }: YearMonthPaginationProps) => {
    const searchParams = useSearchParams();

    // 年月の検索パラメータをバリデーション
    const { year, month } = parseYearMonthParams(
        searchParams.get("y"),
        searchParams.get("m")
    );

    // 年月のページネーション情報を取得
    const {
        prevYear,
        prevMonth,
        nextYear,
        nextMonth,
        hasPrev,
        hasNext,
        prevMonth1,
        nextMonth1,
        prevMonth2,
        nextMonth2,
        hasMorePrev,
        hasMoreNext,
    } = getYearMonthPagination(year, month);

    // URLを生成する関数
    const createUrl = (targetYear: number, targetMonth: number) => {
        const current = new URLSearchParams(searchParams.toString());
        current.set("y", targetYear.toString());
        current.set("m", targetMonth.toString());
        return `?${current.toString()}`;
    };

    return (
        <Pagination className={className}>
            <PaginationContent>
                {/* Previous button */}
                <PaginationItem>
                    {hasPrev ? (
                        <PaginationPrevious
                            href={createUrl(prevYear, prevMonth)}
                        />
                    ) : (
                        <PaginationPrevious
                            href="#"
                            className="pointer-events-none opacity-50"
                        />
                    )}
                </PaginationItem>

                {/* さらに前がある場合のEllipsis */}
                {/* {hasMorePrev && (
                    <PaginationItem>
                        <PaginationEllipsis />
                    </PaginationItem>
                )} */}

                {/* -2月 (もしあれば表示) */}
                {prevMonth2 && (
                    <PaginationItem>
                        <PaginationLink
                            href={createUrl(prevMonth2.year, prevMonth2.month)}
                            className="w-fit px-1"
                        >
                            {prevMonth2.year}/
                            {prevMonth2.month.toString().padStart(2, "0")}
                        </PaginationLink>
                    </PaginationItem>
                )}

                {/* -1月 (もしあれば表示) */}
                {prevMonth1 && (
                    <PaginationItem>
                        <PaginationLink
                            href={createUrl(prevMonth1.year, prevMonth1.month)}
                            className="w-fit px-1"
                        >
                            {prevMonth1.year}/
                            {prevMonth1.month.toString().padStart(2, "0")}
                        </PaginationLink>
                    </PaginationItem>
                )}

                {/* 現在の月 */}
                <PaginationItem>
                    <PaginationLink href="#" isActive className="w-fit px-1">
                        {year}/{month.toString().padStart(2, "0")}
                    </PaginationLink>
                </PaginationItem>

                {/* +1月 (もしあれば表示) */}
                {nextMonth1 && (
                    <PaginationItem>
                        <PaginationLink
                            href={createUrl(nextMonth1.year, nextMonth1.month)}
                            className="w-fit px-1"
                        >
                            {nextMonth1.year}/
                            {nextMonth1.month.toString().padStart(2, "0")}
                        </PaginationLink>
                    </PaginationItem>
                )}

                {/* +2月 (もしあれば表示) */}
                {nextMonth2 && (
                    <PaginationItem>
                        <PaginationLink
                            href={createUrl(nextMonth2.year, nextMonth2.month)}
                            className="w-fit px-1"
                        >
                            {nextMonth2.year}/
                            {nextMonth2.month.toString().padStart(2, "0")}
                        </PaginationLink>
                    </PaginationItem>
                )}

                {/* さらに後がある場合のEllipsis */}
                {/* {hasMoreNext && (
                    <PaginationItem>
                        <PaginationEllipsis />
                    </PaginationItem>
                )} */}

                {/* Next button */}
                <PaginationItem>
                    {hasNext ? (
                        <PaginationNext href={createUrl(nextYear, nextMonth)} />
                    ) : (
                        <PaginationNext
                            href="#"
                            className="pointer-events-none opacity-50"
                        />
                    )}
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
};

export default YearMonthPagination;
