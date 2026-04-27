"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePageHeader } from "./page-header-context";
import { useUser } from "@/components/providers/user-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOutIcon, UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { bypassLogout } from "@/lib/auth/bypass-actions";

export function PageHeader() {
    const { title, description } = usePageHeader();
    const user = useUser();
    const router = useRouter();
    const isBypassUser = user?.id === "bypass-user";

    const handleLogout = async () => {
        if (isBypassUser) {
            await bypassLogout();
        } else {
            const supabase = createClient();
            await supabase.auth.signOut();
            router.push("/");
        }
    };

    return (
        <header className="flex items-center gap-1 px-2 py-3">
            <SidebarTrigger className="m-1" />
            <Separator orientation="vertical" />
            <h1 className="text-2xl font-bold whitespace-nowrap px-2">
                {title}
            </h1>
            <div className="flex-1 min-w-0 overflow-hidden whitespace-nowrap">
                <div className="inline-block animate-marquee">
                    <span className="inline-block pr-20">{description}</span>
                    <span className="inline-block pr-20">{description}</span>
                </div>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full p-1 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <Avatar className="size-8">
                            <AvatarImage src={user?.iconUrl ?? undefined} />
                            <AvatarFallback>
                                <UserIcon className="size-4" />
                            </AvatarFallback>
                        </Avatar>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="font-normal">
                        <span className="text-sm font-medium">
                            {user?.lastName ?? ""} {user?.firstName ?? ""}
                        </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-destructive focus:text-destructive cursor-pointer"
                    >
                        <LogOutIcon className="mr-2 size-4" />
                        ログアウト
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
