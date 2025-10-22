"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { SidebarMenuButton } from "./ui/sidebar";
import { useUser } from "@/components/providers/user-provider";
import { bypassLogout } from "@/lib/auth/bypass-actions";

export function LogoutButton() {
    const router = useRouter();
    const user = useUser();
    const isBypassUser = user?.id === "bypass-user";

    const logout = async () => {
        if (isBypassUser) {
            // 税理士ユーザー（バイパスユーザー）の場合は、Cookieをクリア
            await bypassLogout();
        } else {
            // 通常のユーザーの場合は、Supabaseからサインアウト
            const supabase = createClient();
            await supabase.auth.signOut();
            router.push("/");
        }
    };

    return (
        <SidebarMenuButton
            asChild
            className="
        w-full
        justify-center               /* ← 親側の left-start を上書き */
        hover:bg-transparent         /* （任意）網掛け消す */
        focus-visible:ring-0
        data-[state=open]:bg-transparent
      "
        >
            <Button
                onClick={logout}
                variant="destructive" /* ここを 'ghost' にするとサイドバーの見た目に馴染む */
                className="
          w-full
          justify-center             /* ← 子側でも明示して中央寄せ */
          gap-2
          group-data-[collapsible=icon]:px-0   /* 折りたたみ時の左右余白を0に */
          group-data-[collapsible=icon]:gap-0  /* 折りたたみ時はギャップも0に */
        "
            >
                <LogOutIcon className="size-4 shrink-0" />
                <span>Logout</span>
            </Button>
        </SidebarMenuButton>
    );
}
