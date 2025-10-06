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
import { LogoutButton } from "./logout-button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
    HomeIcon,
    UserIcon,
    UsersIcon,
    IdCardIcon,
    Link2Icon,
    BriefcaseBusinessIcon,
    SettingsIcon,
    ClockIcon,
} from "lucide-react";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import Link from "next/link";

export async function AppSidebar() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) {
        redirect("/auth/login");
    }
    const userResult = await db
        .select()
        .from(users)
        .where(eq(users.authId, data?.claims?.sub))
        .limit(1);

    const user = userResult[0];
    if (!user) {
        redirect("/auth/login");
    }

    return (
        <Sidebar variant="inset" collapsible="icon">
            <SidebarContent>
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
                                    <Link href="/attendance" prefetch={true}>
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
                {user.isAdmin && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Admin</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href="/admin" prefetch={true}>
                                            <HomeIcon />
                                            <span>管理者トップ</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href="/admin/users"
                                            prefetch={true}
                                        >
                                            <UsersIcon />
                                            <span>従業員作成・編集・給与</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href="/admin/cards"
                                            prefetch={true}
                                        >
                                            <IdCardIcon />
                                            <span>カード作成・編集</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href="/admin/links"
                                            prefetch={true}
                                        >
                                            <Link2Icon />
                                            <span>カード紐づけ・管理</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
            <SidebarFooter>
                <SidebarGroup className="p-0">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    className="
                h-10 w-full
                hover:bg-transparent
                focus-visible:ring-0
                data-[state=open]:bg-transparent
              "
                                >
                                    <div className="flex w-full items-center justify-center gap-2">
                                        <Avatar className="size-6 shrink-0">
                                            <AvatarImage
                                                src={user?.iconUrl ?? undefined}
                                            />
                                            <AvatarFallback>
                                                <UserIcon />
                                            </AvatarFallback>
                                        </Avatar>
                                        {/* 折りたたみ時は自動で非表示になる */}
                                        <span className="text-center group-data-[collapsible=icon]:hidden">
                                            {user?.lastName ?? ""}{" "}
                                            {user?.firstName ?? ""}
                                        </span>
                                    </div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <LogoutButton />
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarFooter>
        </Sidebar>
    );
}
