import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    trailingSlash: false, // URL末尾のスラッシュ
    // output: "export",

    // 実験的機能を有効化
    experimental: {
        // サーバーコンポーネントの最適化
        serverComponentsExternalPackages: ["drizzle-orm"],
        // 並列ルーティングの最適化
        parallelServerCompiles: true,
    },

    // コンパイラの最適化
    compiler: {
        // 本番環境でconsole.logを削除
        removeConsole: process.env.NODE_ENV === "production",
    },

    // 画像最適化
    images: {
        remotePatterns: [
            { hostname: "placehold.jp" },
            { hostname: "lytsrkahbjbgaqzmtplk.supabase.co" },
            { hostname: "images.unsplash.com" },
        ],
        unoptimized: false, // 画像の最適化 trueで無効
        formats: ["image/webp", "image/avif"],
    },

    // バンドル分析（開発時のみ）
    ...(process.env.ANALYZE === "true" && {
        webpack: (config: any) => {
            config.plugins.push(
                new (require("@next/bundle-analyzer"))({
                    enabled: true,
                })
            );
            return config;
        },
    }),

    // パフォーマンス最適化
    poweredByHeader: false,
    compress: true,

    // 静的エクスポートの最適化
    output: "standalone",

    // キャッシュ設定
    onDemandEntries: {
        // ページがメモリに保持される時間（秒）
        maxInactiveAge: 25 * 1000,
        // 同時に保持されるページ数
        pagesBufferLength: 2,
    },

    devIndicators: false,
};

export default nextConfig;
