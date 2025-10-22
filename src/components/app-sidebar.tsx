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
} from "@/components/ui/sidebar";
import {
    HomeIcon,
    UsersIcon,
    BriefcaseBusinessIcon,
    SettingsIcon,
    ClockIcon,
} from "lucide-react";
import Link from "next/link";
import { AppSidebarClient, AppSidebarFooter } from "./app-sidebar-client";
import { requireUser } from "@/lib/auth/requireUser";

export async function AppSidebar() {
    const user = await requireUser();
    // 税理士ユーザー（バイパスユーザー）かどうかを判定
    const isBypassUser = user.id === "bypass-user";

    return (
        <Sidebar variant="inset" collapsible="icon">
            <SidebarContent>
                {/* 税理士ユーザーの場合は一般ユーザーメニューを非表示 */}
                {!isBypassUser && (
                    <SidebarGroup>
                        <SidebarGroupLabel>User</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href="/" prefetch={true}>
                                            <HomeIcon />
                                            <span>トップ</span>
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
                                            <span>勤怠</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href="/projects" prefetch={true}>
                                            <BriefcaseBusinessIcon />
                                            <span>プロジェクト</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href="/list" prefetch={true}>
                                            <UsersIcon />
                                            <span>一覧</span>
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
            </SidebarContent>
            <SidebarFooter>
                <AppSidebarFooter />
            </SidebarFooter>
        </Sidebar>
    );
}
