"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    generateTestData,
    registerTestData,
    clearTestData,
    TestDataRecord,
} from "@/app/actions/development";
import { toast } from "sonner";

import { DateRange } from "react-day-picker";

export function DevelopmentClient({ userId }: { userId: string }) {
    // 期間選択の初期値: 2025/08/01 ～ 現在
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(2025, 7, 1), // Aug 1, 2025
        to: new Date(),
    });
    const [generatedData, setGeneratedData] = useState<TestDataRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    // テストデータ生成（プレビュー）処理
    // サーバーアクション generateTestData を呼び出し、結果をテーブルに表示する
    const handleGenerate = async () => {
        if (!date?.from || !date?.to) {
            toast.error("期間を選択してください");
            return;
        }

        setIsLoading(true);
        try {
            const result = await generateTestData(userId, date.from, date.to);
            if (result.success && result.data) {
                setGeneratedData(result.data);
                toast.success(`${result.data.length}件のデータを生成しました`);
            } else {
                toast.error(result.message || "生成に失敗しました");
            }
        } catch (error) {
            toast.error("エラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    };

    // DB登録処理
    // プレビュー中のデータを実際にデータベースに保存する
    const handleRegister = async () => {
        if (generatedData.length === 0) return;

        setIsRegistering(true);
        try {
            const result = await registerTestData(generatedData);
            if (result.success) {
                toast.success(result.message);
                setGeneratedData([]); // 登録後はプレビューをクリア
            } else {
                toast.error(result.message || "登録に失敗しました");
            }
        } catch (error) {
            toast.error("エラーが発生しました");
        } finally {
            setIsRegistering(false);
        }
    };

    // 全データ削除処理
    // ユーザーの勤怠ログを全て削除する（危険な操作のため確認ダイアログを表示）
    const handleClear = async () => {
        if (!confirm("本当にデータを全削除しますか？この操作は取り消せません。")) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await clearTestData(userId);
            if (result.success) {
                toast.success(result.message);
                setGeneratedData([]);
            } else {
                toast.error(result.message || "削除に失敗しました");
            }
        } catch (error) {
            toast.error("エラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>attendance_log テストデータ生成</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">期間</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-[300px] justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                            date.to ? (
                                                <>
                                                    {format(
                                                        date.from,
                                                        "yyyy/MM/dd",
                                                        { locale: ja }
                                                    )}{" "}
                                                    -{" "}
                                                    {format(
                                                        date.to,
                                                        "yyyy/MM/dd",
                                                        { locale: ja }
                                                    )}
                                                </>
                                            ) : (
                                                format(date.from, "yyyy/MM/dd", {
                                                    locale: ja,
                                                })
                                            )
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                >
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={setDate}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button
                            onClick={handleGenerate}
                            disabled={isLoading || !date?.from || !date?.to}
                        >
                            {isLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            生成（プレビュー）
                        </Button>
                        <Button
                            onClick={handleRegister}
                            disabled={
                                isRegistering ||
                                generatedData.length === 0 ||
                                isLoading
                            }
                            variant="default"
                        >
                            {isRegistering && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            DB登録
                        </Button>
                        <Button
                            onClick={handleClear}
                            disabled={isLoading}
                            variant="destructive"
                            className="ml-auto"
                        >
                            全データ削除
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {generatedData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            プレビュー ({generatedData.length}件)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border max-h-[600px] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Start</TableHead>
                                        <TableHead>End</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Note</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {generatedData.map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{row.statusId}</TableCell>
                                            <TableCell>
                                                {format(
                                                    new Date(row.startedAt),
                                                    "yyyy/MM/dd HH:mm:ss.SSS"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {row.endedAt
                                                    ? format(
                                                        new Date(row.endedAt),
                                                        "yyyy/MM/dd HH:mm:ss.SSS"
                                                    )
                                                    : "継続中"}
                                            </TableCell>
                                            <TableCell>
                                                {row.startedSource} →{" "}
                                                {row.endedSource}
                                            </TableCell>
                                            <TableCell>{row.note}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
