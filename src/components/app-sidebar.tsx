import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
    HomeIcon,
    UsersIcon,
    BriefcaseBusinessIcon,
    SettingsIcon,
    ClockIcon,
    BookOpenIcon,
} from "lucide-react";
import Link from "next/link";
import { AppSidebarClient, AppSidebarFooter } from "./app-sidebar-client";
import { requireUser } from "@/lib/auth/requireUser";

export async function AppSidebar() {
    const user = await requireUser();
    // バイパスユーザーかどうかを判定
    const isBypassUser = user.id === "bypass-user";

    return (
        <Sidebar variant="inset" collapsible="icon">
            <SidebarContent>
                {/* バイパスユーザーの場合は一般ユーザーメニューを非表示 */}
                {!isBypassUser && (
                    <SidebarGroup>
                        <SidebarGroupLabel>User</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href="/" prefetch={true}>
                                            <HomeIcon />
                                            <span>打刻</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href="/attendance"
                                            prefetch={true}
                                        >
                                            <ClockIcon />
                                            <span>勤怠記録</span>
                                        </Link>
                                    </SidebarMenuButton>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild>
                                                <Link href="/attendance/edit">
                                                    <span>ログ修正</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href="/projects" prefetch={true}>
                                            <BriefcaseBusinessIcon />
                                            <span>プロジェクト</span>
                                        </Link>
                                    </SidebarMenuButton>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild>
                                                <Link href="/projects/work-logs">
                                                    <span>作業ログ</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href="/list" prefetch={true}>
                                            <UsersIcon />
                                            <span>ステータス一覧</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href="/settings" prefetch={true}>
                                            <SettingsIcon />
                                            <span>設定</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
                <AppSidebarClient />
                {!isBypassUser && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Other</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href="/document" prefetch={true}>
                                            <BookOpenIcon />
                                            <span>ドキュメント</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
            <SidebarFooter>
                <AppSidebarFooter />
            </SidebarFooter>
        </Sidebar>
    );
}
