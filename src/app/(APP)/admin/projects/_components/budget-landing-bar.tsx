"use client";

import { clamp } from "@/lib/utils";
import type { BudgetThresholds } from "@/lib/budget/types";

interface BudgetLandingBarProps {
    /** 着地予測値（%）。100超もそのまま渡してよい */
    value: number;
    /** バッファ率から算出済みの閾値（注意 / 警告 / 超過） */
    thresholds: BudgetThresholds;
}

// バーの右端（%）。超過ゾーンを見せるため 100% より広く取る
const AXIS_MAX = 130;

export function BudgetLandingBar({ value, thresholds }: BudgetLandingBarProps) {
    const { caution, warning } = thresholds;

    // 値 → 軸上の位置(%)。0〜AXIS_MAX にクランプ
    const toAxis = (v: number) => (clamp(v, 0, AXIS_MAX) / AXIS_MAX) * 100;

    const cautionPos = toAxis(caution);
    const warningPos = toAxis(warning);
    const overPos = toAxis(100);
    // マーカーは端で見切れないよう表示位置だけ 4〜96% に収める
    const markerPos = clamp(toAxis(value), 4, 96);

    // 閾値ゾーン（緑＝注意未満 / 黄＝警告未満 / 橙＝超過未満 / 赤＝超過）
    const zones = [
        { width: cautionPos, color: "#22c55e" },
        { width: warningPos - cautionPos, color: "#eab308" },
        { width: overPos - warningPos, color: "#f97316" },
        { width: 100 - overPos, color: "#ef4444" },
    ];

    return (
        <div>
            {/* マーカー行（値ラベル + ▼） */}
            <div className="relative h-7">
                <div
                    className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center"
                    style={{ left: `${markerPos}%` }}
                >
                    <span className="text-sm font-bold leading-none">
                        {Math.round(value)}%
                    </span>
                    <span
                        className="mt-0.5 h-0 w-0"
                        style={{
                            borderLeft: "5px solid transparent",
                            borderRight: "5px solid transparent",
                            borderTop: "6px solid currentColor",
                        }}
                    />
                </div>
            </div>

            {/* 閾値ゾーンの色帯 + 予算100%ライン */}
            <div className="relative">
                <div className="flex h-3 w-full overflow-hidden rounded">
                    {zones.map((zone) => (
                        <div
                            key={zone.color}
                            style={{
                                width: `${zone.width}%`,
                                backgroundColor: zone.color,
                            }}
                        />
                    ))}
                </div>
                {/* 予算100%の位置を示す縦線 */}
                <div
                    className="absolute top-[-3px] h-[18px] w-0.5 -translate-x-1/2 bg-foreground"
                    style={{ left: `${overPos}%` }}
                />
            </div>

            {/* 軸ラベル */}
            <div className="relative mt-1 h-3 text-[10px] text-muted-foreground">
                <span className="absolute left-0">0%</span>
                <span
                    className="absolute -translate-x-1/2 font-medium text-foreground"
                    style={{ left: `${overPos}%` }}
                >
                    予算
                </span>
            </div>
        </div>
    );
}
