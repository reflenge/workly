"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AttendancePageWrapperProps {
    year: number;
    month: number; // 1-12
    children: React.ReactNode;
}

export function AttendancePageWrapper({
    year,
    month,
    children,
}: AttendancePageWrapperProps) {
    const navigateTo = (y: number, m: number) => {
        const url = new URL(window.location.href);
        url.searchParams.set("year", String(y));
        url.searchParams.set("month", String(m));
        // 旧pageパラメータは不要
        url.searchParams.delete("page");
        window.location.href = url.toString();
    };

    const handleMove = (deltaMonths: number) => {
        const base = new Date(Date.UTC(year, month - 1, 1));
        base.setUTCMonth(base.getUTCMonth() + deltaMonths);
        navigateTo(base.getUTCFullYear(), base.getUTCMonth() + 1);
    };

    const label = `${year}年${String(month).padStart(2, "0")}月`;

    const getNeighbor = (delta: number) => {
        const d = new Date(Date.UTC(year, month - 1, 1));
        d.setUTCMonth(d.getUTCMonth() + delta);
        const ny = d.getUTCFullYear();
        const nm = d.getUTCMonth() + 1;
        return {
            y: ny,
            m: nm,
            label: `${ny}年${String(nm).padStart(2, "0")}月`,
        };
    };

    const prev = getNeighbor(-1);
    const next = getNeighbor(1);

    return (
        <>
            <div className="flex items-center justify-between mt-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMove(-1)}
                >
                    <ChevronLeft className="h-4 w-4" />
                    {prev.label}
                </Button>
                <div className="text-base sm:text-lg md:text-xl font-semibold">
                    {label}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMove(1)}
                >
                    {next.label}
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            {children}
            <div className="flex items-center justify-between mt-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMove(-1)}
                >
                    <ChevronLeft className="h-4 w-4" />
                    {prev.label}
                </Button>
                <div className="text-base sm:text-lg md:text-xl font-semibold">
                    {label}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMove(1)}
                >
                    {next.label}
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </>
    );
}
