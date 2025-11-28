import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default function AccountStoppedPage() {
    async function logout() {
        "use server";
        const supabase = await createClient();
        await supabase.auth.signOut();
        redirect("/auth/login");
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
            <div className="space-y-4 max-w-md">
                <h1 className="text-2xl font-bold text-destructive">
                    アカウントが停止されています
                </h1>
                <p className="text-muted-foreground">
                    あなたのアカウントは現在停止されています。
                    <br />
                    詳細については管理者にお問い合わせください。
                </p>
                <form action={logout}>
                    <Button variant="outline">ログアウト</Button>
                </form>
            </div>
        </div>
    );
}
