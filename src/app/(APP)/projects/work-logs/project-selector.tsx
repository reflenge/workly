"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useQueryState } from "nuqs";
import { useEffect, useState, useTransition } from "react";
import { Spinner } from "@/components/ui/spinner";

interface ProjectSelectorProps {
    projects: { id: string; name: string }[];
}

export function ProjectSelector({ projects }: ProjectSelectorProps) {
    const [isPending, startTransition] = useTransition();
    const [projectId, setProjectId] = useQueryState("projectId", {
        shallow: false,
        startTransition,
    });

    // Hydration mismatch prevention
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <Select
            value={projectId || "all"}
            onValueChange={(value) => {
                setProjectId(value === "all" ? null : value);
            }}
            disabled={isPending}
        >
            <SelectTrigger className="w-[200px]">
                {isPending ? (
                    <div className="flex items-center gap-2">
                        <Spinner />
                        <span className="text-muted-foreground">
                            読み込み中...
                        </span>
                    </div>
                ) : (
                    <SelectValue placeholder="プロジェクトを選択" />
                )}
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">すべてのプロジェクト</SelectItem>
                {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                        {project.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
