"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePageHeader } from "./page-header-context";

export function PageHeader() {
    const { title, description } = usePageHeader();
    return (
        <header className="flex items-center gap-1 px-2 py-3">
            <SidebarTrigger className="m-1" />
            <Separator orientation="vertical" />
            <h1 className="text-2xl font-bold whitespace-nowrap px-2">
                {title}
            </h1>
            <div className="flex-1 min-w-0 overflow-hidden whitespace-nowrap">
                <div className="inline-block animate-marquee">
                    <span className="inline-block pr-20">{description}</span>
                    <span className="inline-block pr-20">{description}</span>
                </div>
            </div>
        </header>
    );
}
