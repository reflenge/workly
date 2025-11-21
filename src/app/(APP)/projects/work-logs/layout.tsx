import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import { db } from "@/db";
import { attendanceLogs, projects, users, workLogs } from "@/db/schema";
import { requireUser } from "@/lib/auth/requireUser";
import { eq } from "drizzle-orm";
import { WorkLogChart } from "./work-log-chart";

export default async function WorkLogsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireUser();

    // Fetch all logs for chart aggregation
    const allLogsForChart = await db
        .select({
            attendanceLogId: workLogs.attendanceLogId,
            projectName: projects.name,
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
        );

    // Count work logs per attendance log to split duration
    const attendanceLogCounts = new Map<string, number>();
    allLogsForChart.forEach((log) => {
        if (log.attendanceLogId) {
            const currentCount =
                attendanceLogCounts.get(log.attendanceLogId) || 0;
            attendanceLogCounts.set(log.attendanceLogId, currentCount + 1);
        }
    });

    // Aggregate data for chart
    const projectMap = new Map<
        string,
        { name: string; users: Map<string, number> }
    >();
    const allUserNames = new Set<string>();

    allLogsForChart.forEach((log) => {
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

        // Calculate duration in hours
        let duration = 0;
        if (log.startedAt && log.endedAt) {
            const diff = log.endedAt.getTime() - log.startedAt.getTime();
            duration = diff / (1000 * 60 * 60); // hours

            // Split duration if multiple work logs exist for the same attendance log
            if (log.attendanceLogId) {
                const count = attendanceLogCounts.get(log.attendanceLogId) || 1;
                duration = duration / count;
            }
        }

        const currentDuration = projectData.users.get(userName) || 0;
        projectData.users.set(userName, currentDuration + duration);
    });

    const chartData = Array.from(projectMap.values()).map((p) => {
        const entry: any = { name: p.name };
        p.users.forEach((duration, user) => {
            entry[user] = Math.round(duration * 100) / 100; // Round to 2 decimals
        });
        return entry;
    });

    const userList = Array.from(allUserNames);

    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="作業ログ"
                description="プロジェクトごとの作業ログ一覧を確認できます。"
            />

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

            {children}
        </div>
    );
}
