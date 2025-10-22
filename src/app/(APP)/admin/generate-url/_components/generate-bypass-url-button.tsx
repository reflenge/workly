"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { generateBypassUrl } from "@/lib/auth/generate-bypass-url";
import { CopyIcon, KeyIcon } from "lucide-react";

export function GenerateBypassUrlButton() {
    const [isPending, startTransition] = useTransition();
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);

    const handleGenerate = () => {
        startTransition(async () => {
            try {
                const baseUrl =
                    typeof window !== "undefined" ? window.location.origin : "";
                const result = await generateBypassUrl(baseUrl);
                setGeneratedUrl(result.url);
                setExpiresAt(result.expiresAt);
                toast.success("税理士用URLを生成しました");
            } catch (error) {
                toast.error("URL生成に失敗しました", {
                    description:
                        error instanceof Error ? error.message : "不明なエラー",
                });
            }
        });
    };

    const handleCopy = async () => {
        if (generatedUrl) {
            try {
                await navigator.clipboard.writeText(generatedUrl);
                toast.success("URLをクリップボードにコピーしました");
            } catch (error) {
                toast.error("コピーに失敗しました");
            }
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <KeyIcon className="size-5" />
                    税理士用アクセスURL生成
                </CardTitle>
                <CardDescription>
                    税理士など外部の方が一時的に管理画面にアクセスするためのURLを生成します
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button
                    onClick={handleGenerate}
                    disabled={isPending}
                    className="w-full"
                >
                    {isPending ? "生成中..." : "URLを生成"}
                </Button>

                {generatedUrl && expiresAt && (
                    <div className="space-y-3">
                        <div className="rounded-lg border bg-muted p-4">
                            <p className="mb-2 text-sm font-medium">
                                生成されたURL:
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={generatedUrl}
                                    readOnly
                                    className="flex-1 rounded border bg-background px-3 py-2 text-sm"
                                />
                                <Button
                                    onClick={handleCopy}
                                    variant="outline"
                                    size="icon"
                                >
                                    <CopyIcon className="size-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                            <p className="text-sm text-yellow-800">
                                <strong>有効期限:</strong>{" "}
                                {expiresAt.toLocaleString("ja-JP", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                                まで（発行から7日間）
                            </p>
                        </div>

                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                            <p className="text-sm text-blue-800">
                                <strong>注意事項:</strong>
                            </p>
                            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-700">
                                <li>このURLは税理士の方に共有してください</li>
                                <li>
                                    アクセスできるのは管理者トップページ（勤怠一覧）のみです
                                </li>
                                <li>有効期限は発行から7日間です</li>
                                <li>
                                    URLは第三者に漏れないよう厳重に管理してください
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
