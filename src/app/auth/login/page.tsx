import { LoginForm } from "@/components/login-form";
import Link from "next/link";

export default function Page() {
    return (
        <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
            {/* 背景装飾 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                <LoginForm />
                <div className="mt-6 flex items-center justify-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <Link
                        href="/terms"
                        className="hover:text-slate-900 hover:underline dark:hover:text-slate-200"
                    >
                        利用規約
                    </Link>
                    <span className="text-slate-300 dark:text-slate-700">
                        |
                    </span>
                    <Link
                        href="/privacy-policy"
                        className="hover:text-slate-900 hover:underline dark:hover:text-slate-200"
                    >
                        プライバシーポリシー
                    </Link>
                </div>
            </div>
        </div>
    );
}
