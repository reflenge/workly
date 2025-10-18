import { PageHeaderMeta } from "@/components/page-header/page-header-meta";
import AttendanceView from "@/components/attendance";

export default function AttendancePage() {
    return (
        <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
            <PageHeaderMeta
                title="出勤記録"
                description="あなたの出勤・退勤記録を確認できます。"
            />
            <AttendanceView isAdmin={false}/>
        </div>
    );
}
