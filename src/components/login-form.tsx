"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { RefreshCcwIcon, Clock, Shield } from "lucide-react";
import Image from "next/image";

export function LoginForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSocialLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const supabase = createClient();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/oauth?next=/`,

                    // 毎回ログインする設定
                    queryParams: {
                        access_type: "offline",
                        prompt: "consent",
                    },
                },
            });

            if (error) throw error;
        } catch (error: unknown) {
            setError(
                error instanceof Error ? error.message : "An error occurred"
            );
            setIsLoading(false);
        }
    };

    return (
        <div className={cn("flex flex-col gap-8", className)} {...props}>
            {/* ロゴ・タイトルセクション */}
            <div className="text-center space-y-3 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                        <Clock className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h1 className="text-4xl pb-1 font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Reflenge
                </h1>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                    勤怠管理システム
                </p>
            </div>

            {/* ログインカード */}
            <Card className="border-0 shadow-2xl shadow-blue-500/10 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <CardHeader className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                        <Shield className="w-4 h-4" />
                        <CardDescription className="text-sm font-medium">
                            従業員用ログイン
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleSocialLogin}>
                        <div className="flex flex-col gap-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <p className="text-sm text-red-600 dark:text-red-400 text-center">
                                        {error}
                                    </p>
                                </div>
                            )}
                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-medium bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
                                disabled={isLoading}
                                variant="outline"
                            >
                                {isLoading ? (
                                    <>
                                        <RefreshCcwIcon className="w-5 h-5 mr-2 animate-spin" />
                                        ログイン中...
                                    </>
                                ) : (
                                    <>
                                        <Image
                                            src="/g.webp"
                                            alt="Google"
                                            width={20}
                                            height={20}
                                            className="mr-2"
                                        />
                                        Googleでログイン
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>

                    {/* 間違えて来た人用リンク */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                            間違えて来た方は
                            <a
                                href="https://reflenge.com"
                                className="text-blue-600 underline hover:text-blue-800 ml-1"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                reflenge.com
                            </a>
                            へお戻りください。
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
