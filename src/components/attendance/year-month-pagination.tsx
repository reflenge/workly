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
import { useIsMobile } from "@/hooks/use-mobile";

interface YearMonthPaginationProps {
    className?: string;
}

const YearMonthPagination = ({ className }: YearMonthPaginationProps) => {
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();

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

    // 年月を表示する関数（モバイルでは年を短縮）
    const formatYearMonth = (year: number, month: number) => {
        const yearStr = isMobile
            ? year.toString().slice(2, 4)
            : year.toString();
        const monthStr = month.toString().padStart(2, "0");
        return `${yearStr}/${monthStr}`;
    };

    // パディングクラス（モバイルでは小さく）
    const linkPadding = isMobile ? "px-1" : "px-1.5";

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
                {hasMorePrev && (
                    <PaginationItem>
                        <PaginationEllipsis />
                    </PaginationItem>
                )}

                {/* -2月 (もしあれば表示) */}
                {prevMonth2 && (
                    <PaginationItem>
                        <PaginationLink
                            href={createUrl(prevMonth2.year, prevMonth2.month)}
                            className={`w-fit ${linkPadding}`}
                        >
                            {formatYearMonth(prevMonth2.year, prevMonth2.month)}
                        </PaginationLink>
                    </PaginationItem>
                )}

                {/* -1月 (もしあれば表示) */}
                {prevMonth1 && (
                    <PaginationItem>
                        <PaginationLink
                            href={createUrl(prevMonth1.year, prevMonth1.month)}
                            className={`w-fit ${linkPadding}`}
                        >
                            {formatYearMonth(prevMonth1.year, prevMonth1.month)}
                        </PaginationLink>
                    </PaginationItem>
                )}

                {/* 現在の月 */}
                <PaginationItem>
                    <PaginationLink
                        href="#"
                        isActive
                        className={`w-fit ${linkPadding}`}
                    >
                        {formatYearMonth(year, month)}
                    </PaginationLink>
                </PaginationItem>

                {/* +1月 (もしあれば表示) */}
                {nextMonth1 && (
                    <PaginationItem>
                        <PaginationLink
                            href={createUrl(nextMonth1.year, nextMonth1.month)}
                            className={`w-fit ${linkPadding}`}
                        >
                            {formatYearMonth(nextMonth1.year, nextMonth1.month)}
                        </PaginationLink>
                    </PaginationItem>
                )}

                {/* +2月 (もしあれば表示) */}
                {nextMonth2 && (
                    <PaginationItem>
                        <PaginationLink
                            href={createUrl(nextMonth2.year, nextMonth2.month)}
                            className={`w-fit ${linkPadding}`}
                        >
                            {formatYearMonth(nextMonth2.year, nextMonth2.month)}
                        </PaginationLink>
                    </PaginationItem>
                )}

                {/* さらに後がある場合のEllipsis */}
                {hasMoreNext && (
                    <PaginationItem>
                        <PaginationEllipsis />
                    </PaginationItem>
                )}

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
