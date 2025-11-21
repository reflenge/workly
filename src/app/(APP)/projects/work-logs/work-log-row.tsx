"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useState } from "react";
import { WorkLogEditDialog } from "./edit-dialog";
import { cn } from "@/lib/utils";

interface Project {
    id: string;
    name: string;
}

interface WorkLog {
    id: string;
    content: string;
    createdAt: Date;
    projectId: string;
    projectName: string | null;
    userName: string | null;
    userFirstName: string | null;
    startedAt: Date | null;
    endedAt: Date | null;
}

interface WorkLogRowProps {
    log: WorkLog;
    projects: Project[];
    isOwner: boolean;
}

export function WorkLogRow({ log, projects, isOwner }: WorkLogRowProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleRowClick = () => {
        if (isOwner) {
            setIsDialogOpen(true);
        }
    };

    return (
        <>
            <TableRow
                className={cn(
                    isOwner ? "cursor-pointer hover:bg-muted/50" : ""
                )}
                onClick={handleRowClick}
            >
                <TableCell>
                    {format(log.createdAt, "yyyy/MM/dd HH:mm")}
                </TableCell>
                <TableCell>
                    {log.userName} {log.userFirstName}
                </TableCell>
                <TableCell>{log.projectName || "-"}</TableCell>
                <TableCell className="whitespace-pre-wrap">
                    {log.content}
                </TableCell>
                <TableCell>
                    {log.startedAt
                        ? format(log.startedAt, "yyyy/MM/dd HH:mm")
                        : "-"}
                </TableCell>
                <TableCell>
                    {log.endedAt
                        ? format(log.endedAt, "yyyy/MM/dd HH:mm")
                        : "-"}
                </TableCell>
            </TableRow>

            {isOwner && (
                <WorkLogEditDialog
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    logId={log.id}
                    initialProjectId={log.projectId}
                    initialContent={log.content}
                    projects={projects}
                />
            )}
        </>
    );
}
