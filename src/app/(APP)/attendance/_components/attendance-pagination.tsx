"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AttendancePaginationProps {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    onPageChange: (page: number) => void;
}

export function AttendancePagination({
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    onPageChange,
}: AttendancePaginationProps) {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (
            let i = Math.max(2, currentPage - delta);
            i <= Math.min(totalPages - 1, currentPage + delta);
            i++
        ) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, "...");
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push("...", totalPages);
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!hasPrevPage}
                >
                    <ChevronLeft className="h-4 w-4" />
                    前へ
                </Button>

                <div className="flex items-center space-x-1">
                    {getVisiblePages().map((page, index) => (
                        <div key={index}>
                            {page === "..." ? (
                                <span className="px-3 py-2 text-sm text-muted-foreground">
                                    ...
                                </span>
                            ) : (
                                <Button
                                    variant={
                                        page === currentPage
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={() => onPageChange(page as number)}
                                    className="w-8 h-8 p-0"
                                >
                                    {page}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!hasNextPage}
                >
                    次へ
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="text-sm text-muted-foreground">
                ページ {currentPage} / {totalPages}
            </div>
        </div>
    );
}
