// Next.jsの型定義をインポート
import type { NextConfig } from "next";

// Next.jsの設定オブジェクト
const nextConfig: NextConfig = {
    // ReactのStrictModeを有効化（開発時に追加の警告を表示）
    reactStrictMode: true,

    // URLの末尾にスラッシュを付けない
    trailingSlash: false, // 例: /about/ → /about

    // experimental: Next.jsの実験的機能の設定
    experimental: {
        // サーバーコンポーネントで外部パッケージ（drizzle-orm）を利用可能にする
        serverComponentsExternalPackages: ["drizzle-orm"],
        // サーバーコンポーネントの並列コンパイルを有効化
        parallelServerCompiles: true,
    },

    // compiler: Next.jsのビルド時のコンパイラ設定
    compiler: {
        // 本番環境ではconsole.logなどのconsole系出力を削除
        removeConsole: process.env.NODE_ENV === "production",
    },

    // images: 画像最適化の設定
    images: {
        // 外部画像のホスト名を許可
        remotePatterns: [
            { hostname: "placehold.jp" }, // ダミー画像サービス
            { hostname: "lytsrkahbjbgaqzmtplk.supabase.co" }, // Supabaseストレージ
            { hostname: "images.unsplash.com" }, // Unsplash画像
        ],
        // 画像最適化を有効化（falseで有効、trueで無効）
        unoptimized: false,
        // サポートする画像フォーマット
        formats: ["image/webp", "image/avif"],
    },

    // バンドル分析ツールの設定（ANALYZE環境変数がtrueのときのみ有効）
    ...(process.env.ANALYZE === "true" && {
        // webpackの設定を拡張
        webpack: (config: any) => {
            // バンドルアナライザーのプラグインを追加
            config.plugins.push(
                new (require("@next/bundle-analyzer"))({
                    enabled: true,
                })
            );
            // 変更したconfigを返す
            return config;
        },
    }),

    // poweredByHeader: X-Powered-Byヘッダーを無効化（セキュリティ向上）
    poweredByHeader: false,

    // compress: HTTPレスポンスの圧縮を有効化
    compress: true,

    // output: ビルド出力をstandaloneモードに（Vercel以外の環境でのデプロイ向け）
    // output: "standalone",

    // onDemandEntries: 開発時のページキャッシュ設定
    onDemandEntries: {
        // ページがメモリに保持される最大時間（ミリ秒）
        maxInactiveAge: 25 * 1000, // 25秒
        // 同時にキャッシュされるページ数
        pagesBufferLength: 2,
    },

    // devIndicators: 開発用インジケーター（ブラウザ右下のNext.jsバッジ）を非表示
    devIndicators: false,
};

// 設定オブジェクトをエクスポート
export default nextConfig;
