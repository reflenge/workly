"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { deleteWorkLog, updateWorkLog } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Project {
    id: string;
    name: string;
}

interface WorkLogEditDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    logId: string;
    initialProjectId: string;
    initialContent: string;
    projects: Project[];
}

export function WorkLogEditDialog({
    isOpen,
    onOpenChange,
    logId,
    initialProjectId,
    initialContent,
    projects,
}: WorkLogEditDialogProps) {
    // ダイアログ内のフォーム状態管理
    const [projectId, setProjectId] = useState(initialProjectId);
    const [content, setContent] = useState(initialContent);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // ダイアログが開かれたときに初期値をリセット
    useEffect(() => {
        if (isOpen) {
            setProjectId(initialProjectId);
            setContent(initialContent);
        }
    }, [isOpen, initialProjectId, initialContent]);

    // 更新処理
    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Server Actionを呼び出して更新
            await updateWorkLog(logId, projectId, content);
            toast.success("作業ログを更新しました");
            onOpenChange(false);
            // データを再取得して画面を更新
            router.refresh();
        } catch (error) {
            toast.error("更新に失敗しました");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 削除処理
    const handleDelete = async () => {
        if (!confirm("本当に削除しますか？")) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Server Actionを呼び出して削除
            await deleteWorkLog(logId);
            toast.success("作業ログを削除しました");
            onOpenChange(false);
            // データを再取得して画面を更新
            router.refresh();
        } catch (error) {
            toast.error("削除に失敗しました");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>作業ログの編集</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label htmlFor="project" className="text-sm font-medium">
                            プロジェクト
                        </label>
                        <Select
                            value={projectId}
                            onValueChange={setProjectId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="プロジェクトを選択" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((project) => (
                                    <SelectItem
                                        key={project.id}
                                        value={project.id}
                                    >
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="content" className="text-sm font-medium">
                            作業内容
                        </label>
                        <Textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="作業内容を入力"
                            rows={4}
                        />
                    </div>
                </div>
                <DialogFooter className="flex justify-between sm:justify-between">
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isSubmitting}
                    >
                        削除
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            キャンセル
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "保存中..." : "保存"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
