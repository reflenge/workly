"use client";

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { LogoutButton } from "./logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
    UserIcon,
    HomeIcon,
    UsersIcon,
    IdCardIcon,
    KeyIcon,
    BanknoteIcon,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/components/providers/user-provider";

// Adminメニュー部分
export function AppSidebarClient() {
    const user = useUser();
    // バイパスユーザーかどうかを判定
    const isBypassUser = user?.id === "bypass-user";

    return user?.isAdmin ? (
        <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/admin" prefetch={true}>
                                <HomeIcon />
                                <span>管理画面</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* バイパスユーザーの場合は以下のメニューを非表示 */}
                    {!isBypassUser && (
                        <>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href="/admin/users" prefetch={true}>
                                        <UsersIcon />
                                        <span>ユーザー管理</span>
                                    </Link>
                                </SidebarMenuButton>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild>
                                            <Link
                                                href="/admin/users/compensation"
                                                prefetch={true}
                                            >
                                                <span>給与設定</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href="/admin/payroll" prefetch={true}>
                                        <BanknoteIcon />
                                        <span>給与管理</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href="/admin/cards" prefetch={true}>
                                        <IdCardIcon />
                                        <span>カード管理</span>
                                    </Link>
                                </SidebarMenuButton>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild>
                                            <Link
                                                href="/admin/cards/link"
                                                prefetch={true}
                                            >
                                                <span>カード紐付け</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link
                                        href="/admin/generate-url"
                                        prefetch={true}
                                    >
                                        <KeyIcon />
                                        <span>URL生成</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </>
                    )}
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
