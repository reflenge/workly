import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    trailingSlash: false, // URL末尾のスラッシュ
    // output: "export",
    images: {
        remotePatterns: [
            { hostname: "placehold.jp" },
            { hostname: "lytsrkahbjbgaqzmtplk.supabase.co" },
            { hostname: "images.unsplash.com" },
        ],
        unoptimized: false, // 画像の最適化 trueで無効
    },
    devIndicators: false,
};

export default nextConfig;
