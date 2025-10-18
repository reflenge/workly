"use client";

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LogoutButton } from "./logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
    UserIcon,
    HomeIcon,
    UsersIcon,
    IdCardIcon,
    Link2Icon,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/components/providers/user-provider";

// Adminメニュー部分
export function AppSidebarClient() {
    const user = useUser();

    return user?.isAdmin ? (
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
                            <Link href="/admin/users" prefetch={true}>
                                <UsersIcon />
                                <span>従業員作成・編集・給与</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/admin/cards" prefetch={true}>
                                <IdCardIcon />
                                <span>カード作成・編集</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/admin/links" prefetch={true}>
                                <Link2Icon />
                                <span>カード紐づけ・管理</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    ) : null;
}

// フッター部分
export function AppSidebarFooter() {
    const user = useUser();

    return (
        <SidebarGroup className="p-0">
            <SidebarGroupContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="h-10 w-full hover:bg-transparent focus-visible:ring-0 data-[state=open]:bg-transparent"
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
    );
}
