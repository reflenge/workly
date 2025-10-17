import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PageHeaderProvider } from "./_components/page-header-context";
import { PageHeader } from "./_components/page-header";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="h-[calc(100dvh-1rem)] overflow-y-auto overflow-x-hidden">
                <PageHeaderProvider>
                    <PageHeader />
                    <main className="pt-0 p-4">{children}</main>
                </PageHeaderProvider>
            </SidebarInset>
        </SidebarProvider>
    );
}
