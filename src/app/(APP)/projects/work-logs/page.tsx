import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { attendanceLogs, projects, users, workLogs } from "@/db/schema";
import { requireUser } from "@/lib/auth/requireUser";
import { desc, eq, count } from "drizzle-orm";
import { WorkLogRow } from "./work-log-row";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 50;

export default async function WorkLogsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>;
}) {
    const user = await requireUser();
    const params = await searchParams;
    const currentPage = Number(params.page) || 1;
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    const [logs, totalCountResult, activeProjects] = await Promise.all([
        // Paginated logs for table
        db
            .select({
                id: workLogs.id,
                content: workLogs.content,
                createdAt: workLogs.createdAt,
                projectId: workLogs.projectId,
                projectName: projects.name,
                userId: workLogs.userId,
                userName: users.lastName,
                userFirstName: users.firstName,
                startedAt: attendanceLogs.startedAt,
                endedAt: attendanceLogs.endedAt,
            })
            .from(workLogs)
            .leftJoin(projects, eq(workLogs.projectId, projects.id))
            .leftJoin(users, eq(workLogs.userId, users.id))
            .leftJoin(
                attendanceLogs,
                eq(workLogs.attendanceLogId, attendanceLogs.id)
            )
            .orderBy(desc(workLogs.createdAt))
            .limit(ITEMS_PER_PAGE)
            .offset(offset),
        // Total count for pagination
        db.select({ count: count() }).from(workLogs),
        // Active projects for edit dialog
        db
            .select({ id: projects.id, name: projects.name })
            .from(projects)
            .where(eq(projects.isActive, true)),
    ]);

    const totalItems = totalCountResult[0].count;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[150px]">日時</TableHead>
                        <TableHead className="w-[150px]">ユーザー</TableHead>
                        <TableHead className="w-[200px]">
                            プロジェクト
                        </TableHead>
                        <TableHead>内容</TableHead>
                        <TableHead className="w-[150px]">開始時間</TableHead>
                        <TableHead className="w-[150px]">終了時間</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={6}
                                className="h-24 text-center"
                            >
                                データがありません
                            </TableCell>
                        </TableRow>
                    ) : (
                        logs.map((log) => (
                            <WorkLogRow
                                key={log.id}
                                log={log}
                                projects={activeProjects}
                                isOwner={log.userId === user.id}
                            />
                        ))
                    )}
                </TableBody>
            </Table>

            {totalPages > 1 && (
                <div className="py-4">
                    <Pagination>
                        <PaginationContent>
                            {currentPage > 1 && (
                                <PaginationItem>
                                    <PaginationPrevious
                                        href={`?page=${currentPage - 1}`}
                                    />
                                </PaginationItem>
                            )}
                            {Array.from(
                                { length: totalPages },
                                (_, i) => i + 1
                            )
                                .filter(
                                    (page) =>
                                        page === 1 ||
                                        page === totalPages ||
                                        Math.abs(page - currentPage) <= 1
                                )
                                .map((page, index, array) => {
                                    const prevPage = array[index - 1];
                                    const showEllipsis =
                                        prevPage && page - prevPage > 1;

                                    return (
                                        <div
                                            key={page}
                                            className="flex items-center"
                                        >
                                            {showEllipsis && (
                                                <PaginationItem>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            )}
                                            <PaginationItem>
                                                <PaginationLink
                                                    href={`?page=${page}`}
                                                    isActive={
                                                        page === currentPage
                                                    }
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        </div>
                                    );
                                })}
                            {currentPage < totalPages && (
                                <PaginationItem>
                                    <PaginationNext
                                        href={`?page=${currentPage + 1}`}
                                    />
                                </PaginationItem>
                            )}
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}
