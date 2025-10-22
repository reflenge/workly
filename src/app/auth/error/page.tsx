import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ExternalLink } from "lucide-react";
import Link from "next/link";

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ error: string }>;
}) {
    const params = await searchParams;

    return (
        <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-slate-50 via-red-50 to-orange-100 dark:from-slate-950 dark:via-red-950 dark:to-orange-950">
            {/* 背景装飾 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-400/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-400/20 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* エラーアイコン */}
                    <div className="text-center space-y-3">
                        <div className="flex items-center justify-center">
                            <div className="p-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl shadow-lg animate-pulse">
                                <AlertCircle className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                            エラーが発生しました
                        </h1>
                    </div>

                    {/* エラーカード */}
                    <Card className="border-0 shadow-2xl shadow-red-500/10 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
                        <CardHeader className="text-center ">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                申し訳ございません。問題が発生しました。
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* エラー詳細 */}
                            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                                    エラー詳細
                                </p>
                                {params?.error ? (
                                    <p className="text-sm text-red-700 dark:text-red-300 font-mono break-all">
                                        {params.error}
                                    </p>
                                ) : (
                                    <p className="text-sm text-red-700 dark:text-red-300">
                                        不明なエラーが発生しました
                                    </p>
                                )}
                            </div>

                            {/* アクションボタン */}
                            <div className="flex flex-col gap-3">
                                <Button
                                    asChild
                                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all duration-200"
                                >
                                    <Link href="/auth/login">
                                        <Home className="w-4 h-4 mr-2" />
                                        ログインページへ戻る
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="w-full h-11 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    <a
                                        href="https://reflenge.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Reflengeのホームページへ
                                    </a>
                                </Button>
                            </div>

                            {/* サポート情報 */}
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                                    問題が解決しない場合は、システム管理者にお問い合わせください
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
