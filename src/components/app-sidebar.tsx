import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
} from "@/components/ui/sidebar";
import { LogoutButton } from "./logout-button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { UserIcon } from "lucide-react";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";

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
        <Sidebar>
            <SidebarHeader />
            <SidebarContent>
                <SidebarGroup />
                <SidebarGroup />
            </SidebarContent>
            <SidebarFooter />
            <SidebarFooter>
                <div className="flex items-center gap-2 w-full">
                    <Avatar>
                        <AvatarImage src={user?.iconUrl ?? undefined} />
                        <AvatarFallback>
                            <UserIcon />
                        </AvatarFallback>
                    </Avatar>
                    <div className="text-center w-full">
                        {user?.lastName ?? ""} {user?.firstName ?? ""}
                    </div>
                </div>
                <LogoutButton />
            </SidebarFooter>
        </Sidebar>
    );
}
