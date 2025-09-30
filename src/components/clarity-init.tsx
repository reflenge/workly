"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

export default function ClarityInit() {
    useEffect(() => {
        // 本番だけで動かしたい場合は条件分岐
        if (process.env.NODE_ENV === "production") {
            const id = "tir6yy6reo";
            if (id) {
                Clarity.init(id);
                // もし同意管理をしているなら（例：クッキー同意後に true へ）
                // Clarity.consent(true);
            }
        }
    }, []);

    return null;
}
