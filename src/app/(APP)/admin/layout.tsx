import { headers } from "next/headers";

function isPcChrome(userAgent: string | undefined) {
    if (!userAgent) return false;
    // Chrome かつ Windows/Mac/Linux で、モバイル/タブレットでない
    const isChrome =
        /Chrome/.test(userAgent) && !/Edg|OPR|Brave|Vivaldi/.test(userAgent);
    const isDesktop = /(Windows NT|Macintosh|X11; Linux)/.test(userAgent);
    const isMobile = /Mobile|Android|iPhone|iPad|iPod/.test(userAgent);
    return isChrome && isDesktop && !isMobile;
}

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const ua = (await headers()).get("user-agent") || "";
    const isSupported = isPcChrome(ua);

    return (
        <div className="">
            {!isSupported && (
                <div className="bg-yellow-200 text-red-700 px-4 py-2 text-center font-bold">
                    ※ADMINページはPC版Chromeのみ動作保証しています
                </div>
            )}
            {children}
        </div>
    );
}
