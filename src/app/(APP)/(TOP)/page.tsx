import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Shield, LogIn } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card/50 backdrop-blur-sm">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
                                <Clock className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <h1 className="text-xl font-semibold text-foreground">
                                勤怠管理システム
                            </h1>
                        </div>
                        <Button variant="default" size="sm" asChild>
                            <Link href="/auth/login">
                                <LogIn className="h-4 w-4 mr-2" />
                                ログイン
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>

            <section className="py-16 px-6">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-4xl md:text-5xl font-light text-foreground mb-6 text-balance leading-tight">
                        勤怠管理システム
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty leading-relaxed">
                        社内の勤怠管理システムです。
                        <br />
                        Googleアカウントでログインしてください。
                    </p>
                </div>
            </section>

            {/* NFC Card Setup Flow Section */}
            <section className="py-16 px-6 bg-muted/30">
                <div className="container mx-auto max-w-4xl">
                    <div className="text-center mb-12">
                        <h3 className="text-2xl font-light text-foreground mb-4">
                            初回セットアップ手順
                        </h3>
                        <p className="text-muted-foreground">
                            カードとGoogleアカウントの紐付け
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start gap-6">
                            <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                                1
                            </div>
                            <div>
                                <h4 className="text-lg font-medium text-foreground mb-2">
                                    Googleでログイン
                                </h4>
                                <p className="text-muted-foreground leading-relaxed">
                                    社内Googleアカウントでシステムにログインしてください。
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-6">
                            <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                                2
                            </div>
                            <div>
                                <h4 className="text-lg font-medium text-foreground mb-2">
                                    カードIDを入力
                                </h4>
                                <p className="text-muted-foreground leading-relaxed">
                                    配布されたカードIDを入力してください（初回のみ）。
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-6">
                            <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                                3
                            </div>
                            <div>
                                <h4 className="text-lg font-medium text-foreground mb-2">
                                    アカウント紐付け完了
                                </h4>
                                <p className="text-muted-foreground leading-relaxed">
                                    システムが自動でGoogleアカウントとカードを照合し、紐付けが完了します。
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                                <svg
                                    className="w-3 h-3 text-blue-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    カード番号が見つからない場合は、システム管理者にお問い合わせください。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-border bg-muted/20 py-8 px-6">
                <div className="container mx-auto max-w-6xl text-center">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <div className="h-6 w-6 bg-primary rounded-sm flex items-center justify-center">
                            <Clock className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <span className="text-foreground font-medium">
                            勤怠管理システム
                        </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        システムに関するお問い合わせは管理者までご連絡ください
                    </div>
                </div>
            </footer>
        </div>
    );
}
