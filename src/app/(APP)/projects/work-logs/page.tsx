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
import { desc, eq, and, gte, lte, min, max, isNull } from "drizzle-orm";
import { WorkLogRow } from "./work-log-row";
import { MonthSelector } from "./month-selector";
import { startOfMonth, endOfMonth, parse, format } from "date-fns";
import { WorkLogChart, ChartData } from "./work-log-chart";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

import { ProjectSelector } from "./project-selector";
import { WorkLogDownloadButton } from "./work-log-download-button";

type AttendanceOnlyLog = {
    id: string;
    createdAt: Date;
    startedAt: Date;
    endedAt: Date | null;
    userId: string;
    userName: string | null;
    userFirstName: string | null;
};

export default async function WorkLogsPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string; projectId?: string }>;
}) {
    // ユーザー認証: ログインしていない場合はリダイレクトされます
    const user = await requireUser();
    const params = await searchParams;

    // URLパラメータから月を取得 (形式: yyyyMM)。指定がない場合は現在の月を使用
    const monthStr = params.month || format(new Date(), "yyyyMM");
    const currentMonth = parse(monthStr, "yyyyMM", new Date());
    const projectId = params.projectId;

    // 選択された月の開始日と終了日を計算
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    // 並列でデータを取得:
    // 1. 選択された月の作業ログ (プロジェクト、ユーザー、勤怠ログ情報を結合)
    // 2. 編集ダイアログ用の有効なプロジェクト一覧
    // 3. ページネーション制御用の全作業ログの期間 (最小/最大日時)
    // 4. フィルター用の全プロジェクト一覧
    const attendanceOnlyLogsQuery = projectId
        ? Promise.resolve([] as AttendanceOnlyLog[])
        : db
              .select({
                  id: attendanceLogs.id,
                  createdAt: attendanceLogs.createdAt,
                  startedAt: attendanceLogs.startedAt,
                  endedAt: attendanceLogs.endedAt,
                  userId: attendanceLogs.userId,
                  userName: users.lastName,
                  userFirstName: users.firstName,
              })
              .from(attendanceLogs)
              .leftJoin(
                  workLogs,
                  eq(workLogs.attendanceLogId, attendanceLogs.id)
              )
              .leftJoin(users, eq(attendanceLogs.userId, users.id))
              .where(
                  and(
                      gte(attendanceLogs.startedAt, start),
                      lte(attendanceLogs.startedAt, end),
                      isNull(workLogs.id),
                      eq(attendanceLogs.statusId, 2)
                  )
              )
              .orderBy(desc(attendanceLogs.startedAt));

    const [logs, activeProjects, dateRangeResult, allProjects, attendanceOnlyLogs] =
        await Promise.all([
        // Logs for the selected month
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
                attendanceLogId: workLogs.attendanceLogId,
            })
            .from(workLogs)
            .leftJoin(projects, eq(workLogs.projectId, projects.id))
            .leftJoin(users, eq(workLogs.userId, users.id))
            .leftJoin(
                attendanceLogs,
                eq(workLogs.attendanceLogId, attendanceLogs.id)
            )
            .where(
                and(
                    gte(attendanceLogs.startedAt, start),
                    lte(attendanceLogs.startedAt, end),
                    projectId ? eq(workLogs.projectId, projectId) : undefined
                )
            )
            .orderBy(desc(attendanceLogs.startedAt)),
        // Active projects for edit dialog
        db
            .select({ id: projects.id, name: projects.name })
            .from(projects)
            .where(eq(projects.isActive, true)),
        // Date range for pagination
        db
            .select({
                minDate: min(workLogs.createdAt),
                maxDate: max(workLogs.createdAt),
            })
            .from(workLogs),
        // Projects with logs in the selected month
        db
            .selectDistinct({ id: projects.id, name: projects.name })
            .from(workLogs)
            .innerJoin(projects, eq(workLogs.projectId, projects.id))
            .where(
                and(
                    gte(workLogs.createdAt, start),
                    lte(workLogs.createdAt, end)
                )
            ),
            attendanceOnlyLogsQuery,
        ]);

    const { minDate, maxDate } = dateRangeResult[0];

    // グラフ表示用のデータ集計処理:
    // 1. 同じ勤怠ログ(attendanceLogId)に紐づく作業ログの数をカウント
    //    (1つの勤怠枠で複数の作業をした場合、時間を等分するため)
    const attendanceLogCounts = new Map<string, number>();
    logs.forEach((log) => {
        if (log.attendanceLogId) {
            const currentCount =
                attendanceLogCounts.get(log.attendanceLogId) || 0;
            attendanceLogCounts.set(log.attendanceLogId, currentCount + 1);
        }
    });

    // 2. プロジェクトごと、ユーザーごとの作業時間を集計
    const projectMap = new Map<
        string,
        { name: string; users: Map<string, number> }
    >();
    const allUserNames = new Set<string>();

    logs.forEach((log) => {
        const projectName = log.projectName || "Unknown Project";
        const userName = `${log.userName} ${log.userFirstName}`;
        allUserNames.add(userName);

        if (!projectMap.has(projectName)) {
            projectMap.set(projectName, {
                name: projectName,
                users: new Map(),
            });
        }

        const projectData = projectMap.get(projectName)!;

        // 作業時間の計算 (時間単位)
        let duration = 0;
        if (log.startedAt && log.endedAt) {
            const diff = log.endedAt.getTime() - log.startedAt.getTime();
            duration = diff / (1000 * 60 * 60); // hours

            // 同じ勤怠ログに複数の作業ログがある場合、時間を等分する
            if (log.attendanceLogId) {
                const count = attendanceLogCounts.get(log.attendanceLogId) || 1;
                duration = duration / count;
            }
        }

        const currentDuration = projectData.users.get(userName) || 0;
        projectData.users.set(userName, currentDuration + duration);
    });

    attendanceOnlyLogs.forEach((attendanceLog) => {
        const projectName = "作業ログなし";
        const userName = `${attendanceLog.userName} ${attendanceLog.userFirstName}`;
        allUserNames.add(userName);

        if (!projectMap.has(projectName)) {
            projectMap.set(projectName, {
                name: projectName,
                users: new Map(),
            });
        }

        let duration = 0;
        if (attendanceLog.startedAt && attendanceLog.endedAt) {
            const diff =
                attendanceLog.endedAt.getTime() -
                attendanceLog.startedAt.getTime();
            duration = diff / (1000 * 60 * 60);
        }

        const projectData = projectMap.get(projectName)!;
        const currentDuration = projectData.users.get(userName) || 0;
        projectData.users.set(userName, currentDuration + duration);
    });

    // 3. チャートコンポーネント用のデータ形式に変換
    const chartData = Array.from(projectMap.values()).map((p) => {
        const entry: ChartData = { name: p.name };
        p.users.forEach((duration, user) => {
            entry[user] = Math.round(duration * 100) / 100; // 小数点第2位まで丸める
        });
        return entry;
    });

    const userList = Array.from(allUserNames);
    const formatElapsedTime = (start: Date | null, end: Date | null) => {
        if (!start || !end) return "-";
        const diffMs = end.getTime() - start.getTime();
        if (diffMs <= 0) return "0分";
        const totalMinutes = Math.round(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours === 0) return `${minutes}分`;
        if (minutes === 0) return `${hours}時間`;
        return `${hours}時間${minutes}分`;
    };
    const tableRows = [
        ...logs.map((log) => ({
            log,
            isOwner: log.userId === user.id,
            sortAt: log.startedAt ?? log.createdAt,
        })),
        ...attendanceOnlyLogs.map((attendanceLog) => ({
            log: {
                id: attendanceLog.id,
                content: "作業ログなし",
                createdAt: attendanceLog.createdAt,
                projectId: "",
                projectName: null,
                userId: attendanceLog.userId,
                userName: attendanceLog.userName,
                userFirstName: attendanceLog.userFirstName,
                startedAt: attendanceLog.startedAt,
                endedAt: attendanceLog.endedAt,
            },
            isOwner: false,
            sortAt: attendanceLog.createdAt,
        })),
    ].sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime());

    const downloadRows = tableRows.map(({ log }) => ({
        createdAt: format(log.createdAt, "yyyy/MM/dd HH:mm"),
        user: `${log.userName ?? ""} ${log.userFirstName ?? ""}`.trim(),
        project: log.projectName || "-",
        content: log.content,
        startDate: log.startedAt ? format(log.startedAt, "yyyy/MM/dd") : "-",
        elapsedTime: formatElapsedTime(log.startedAt, log.endedAt),
    }));

    return (
        <div className="space-y-4">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/projects">プロジェクト</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>作業ログ</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center justify-between">
                <MonthSelector
                    minDate={minDate ? new Date(minDate) : undefined}
                    maxDate={maxDate ? new Date(maxDate) : undefined}
                />
                <ProjectSelector projects={allProjects} />
            </div>

            <div className="rounded-md border p-4">
                <div className="mb-6 space-y-2 text-sm text-muted-foreground">
                    <p>
                        <span className="font-semibold text-foreground">
                            グラフについて:
                        </span>{" "}
                        プロジェクトごとの総工数（時間）を表示しています。同じ勤怠ログに複数の作業ログがある場合、時間は等分されます。
                    </p>
                    <p>
                        <span className="font-semibold text-foreground">
                            編集・削除:
                        </span>{" "}
                        自分の作業ログをクリックすると、プロジェクトや内容の編集、およびログの削除が可能です。
                    </p>
                </div>
                <h3 className="text-lg font-semibold mb-4">
                    プロジェクト別工数 (時間)
                </h3>
                <WorkLogChart data={chartData} users={userList} />
            </div>

            <div className="rounded-md border">
                <div className="flex items-center justify-end border-b p-2">
                    <WorkLogDownloadButton rows={downloadRows} />
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">記録日時</TableHead>
                            <TableHead className="w-[150px]">
                                ユーザー
                            </TableHead>
                            <TableHead className="w-[200px]">
                                プロジェクト
                            </TableHead>
                            <TableHead>内容</TableHead>
                            <TableHead className="w-[150px]">
                                開始時間
                            </TableHead>
                            <TableHead className="w-[150px]">
                                終了時間
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tableRows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="h-24 text-center"
                                >
                                    データがありません
                                </TableCell>
                            </TableRow>
                        ) : (
                            tableRows
                                .slice()
                                .sort((a, b) => {
                                    const aTime = a.log.startedAt?.getTime() ?? 0;
                                    const bTime = b.log.startedAt?.getTime() ?? 0;
                                    return bTime - aTime;
                                })
                                .map(({ log, isOwner }) => (
                                    <WorkLogRow
                                        key={log.id}
                                        log={log}
                                        projects={activeProjects}
                                    isOwner={isOwner}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
