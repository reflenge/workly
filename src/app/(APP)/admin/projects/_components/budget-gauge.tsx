"use client";

import { clamp } from "@/lib/utils";

interface BudgetGaugeProps {
    /** 実際の値（%）。100超もそのまま渡してよい（ゲージは100で振り切り、数字は実値表示） */
    value: number;
    /** ゲージ下のラベル */
    label: string;
    /** ゲージの塗り色（hex） */
    color: string;
}

// 一覧カードで「3個 × プロジェクト数」描画されるため、recharts ではなく静的 SVG で実装する。
// recharts 化すると ResizeObserver が大量発生し SSR でも空描画になる（詳細ページの実データ
// チャートは recharts を使用）。README の「グラフ=recharts」は実データチャート向けの指針。

// 上半円の弧。中心(60,60)・半径50。左端(10,60)→右端(110,60)を上回りで結ぶ
const ARC_PATH = "M 10 60 A 50 50 0 0 1 110 60";
const ARC_LENGTH = Math.PI * 50;

export function BudgetGauge({ value, label, color }: BudgetGaugeProps) {
    // ゲージの塗りは 0〜100 にクランプ。表示する数字は実値（100超もそのまま）
    const clamped = clamp(value, 0, 100);
    const dashOffset = ARC_LENGTH * (1 - clamped / 100);

    return (
        <div className="flex flex-col items-center gap-0.5">
            <div className="relative w-full">
                <svg viewBox="0 0 120 70" className="w-full">
                    <path
                        d={ARC_PATH}
                        fill="none"
                        stroke="currentColor"
                        className="text-muted"
                        strokeWidth={12}
                        strokeLinecap="round"
                    />
                    <path
                        d={ARC_PATH}
                        fill="none"
                        stroke={color}
                        strokeWidth={12}
                        strokeLinecap="round"
                        strokeDasharray={ARC_LENGTH}
                        strokeDashoffset={dashOffset}
                    />
                </svg>
                <span className="absolute inset-x-0 bottom-0 text-center text-base font-bold">
                    {Math.round(value)}%
                </span>
            </div>
            <span className="text-xs text-muted-foreground">{label}</span>
        </div>
    );
}
