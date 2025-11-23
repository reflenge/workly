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
import { desc, eq, and, gte, lte, min, max } from "drizzle-orm";
import { WorkLogRow } from "./work-log-row";
import { MonthSelector } from "./month-selector";
import { startOfMonth, endOfMonth, parse, format } from "date-fns";
import { WorkLogChart, ChartData } from "./work-log-chart";

export default async function WorkLogsPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string }>;
}) {
    // ユーザー認証: ログインしていない場合はリダイレクトされます
    const user = await requireUser();
    const params = await searchParams;

    // URLパラメータから月を取得 (形式: yyyyMM)。指定がない場合は現在の月を使用
    const monthStr = params.month || format(new Date(), "yyyyMM");
    const currentMonth = parse(monthStr, "yyyyMM", new Date());

    // 選択された月の開始日と終了日を計算
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    // 並列でデータを取得:
    // 1. 選択された月の作業ログ (プロジェクト、ユーザー、勤怠ログ情報を結合)
    // 2. 編集ダイアログ用の有効なプロジェクト一覧
    // 3. ページネーション制御用の全作業ログの期間 (最小/最大日時)
    const [logs, activeProjects, dateRangeResult] = await Promise.all([
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
                    gte(workLogs.createdAt, start),
                    lte(workLogs.createdAt, end)
                )
            )
            .orderBy(desc(workLogs.createdAt)),
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

    // 3. チャートコンポーネント用のデータ形式に変換
    const chartData = Array.from(projectMap.values()).map((p) => {
        const entry: ChartData = { name: p.name };
        p.users.forEach((duration, user) => {
            entry[user] = Math.round(duration * 100) / 100; // 小数点第2位まで丸める
        });
        return entry;
    });

    const userList = Array.from(allUserNames);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <MonthSelector
                    minDate={minDate ? new Date(minDate) : undefined}
                    maxDate={maxDate ? new Date(maxDate) : undefined}
                />
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">日時</TableHead>
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
            </div>
        </div>
    );
}
