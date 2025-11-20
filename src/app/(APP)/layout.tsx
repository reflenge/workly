import { ReactNode } from "react";
import { requireUser } from "@/lib/auth/requireUser";
import { UserProvider } from "@/components/providers/user-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PageHeaderProvider } from "@/components/page-header/page-header-context";
import { PageHeader } from "@/components/page-header";

export default async function Layout({ children }: { children: ReactNode }) {
    const user = await requireUser(); // ログイン必須／未ログインはredirect

    // Client側のグローバルステートへ"初期値"として渡す
    return (
        <UserProvider initialUser={user}>
            <SidebarProvider defaultOpen={true}>
                <AppSidebar />
                <SidebarInset className="h-[calc(100dvh-1rem)] overflow-y-hidden overflow-x-hidden">
                    <PageHeaderProvider>
                        <PageHeader />
                        <main className="h-[calc(100dvh-1rem-60px)] overflow-y-auto overflow-x-hidden pt-0 p-4">
                            {children}
                        </main>
                    </PageHeaderProvider>
                </SidebarInset>
            </SidebarProvider>
        </UserProvider>
    );
}
