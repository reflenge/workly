"use client";

import { AttendancePagination } from "./attendance-pagination";

interface AttendancePageWrapperProps {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    children: React.ReactNode;
}

export function AttendancePageWrapper({
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    children,
}: AttendancePageWrapperProps) {
    const handlePageChange = (newPage: number) => {
        const url = new URL(window.location.href);
        url.searchParams.set("page", newPage.toString());
        window.location.href = url.toString();
    };

    return (
        <>
            {children}
            <AttendancePagination
                currentPage={currentPage}
                totalPages={totalPages}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                onPageChange={handlePageChange}
            />
        </>
    );
}
