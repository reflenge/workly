import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { verifyBypassUrl } from "@/lib/auth/generate-bypass-url";

const ADMIN_BYPASS_COOKIE = "admin_bypass_token";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    // バイパス: /admin (トップページのみ) で ?p=パスワード&t=タイムスタンプ&h=ハッシュ の場合、Cookieを設定してリダイレクト
    if (request.nextUrl.pathname === "/admin") {
        const password = request.nextUrl.searchParams.get("p");
        const timestamp = request.nextUrl.searchParams.get("t");
        const hash = request.nextUrl.searchParams.get("h");

        if (password && timestamp && hash) {
            const verification = await verifyBypassUrl(
                password,
                timestamp,
                hash
            );

            if (verification.valid) {
                const url = request.nextUrl.clone();
                // クエリパラメータを削除
                url.searchParams.delete("p");
                url.searchParams.delete("t");
                url.searchParams.delete("h");

                const response = NextResponse.redirect(url);

                // Cookieを設定（7日間有効）
                // タイムスタンプから計算した残り時間をmaxAgeに設定
                const timestampNum = parseInt(timestamp, 10);
                const currentTimestamp = Math.floor(Date.now() / 1000);
                const validityPeriod = 7 * 24 * 60 * 60; // 7日間
                const remainingTime =
                    validityPeriod - (currentTimestamp - timestampNum);

                response.cookies.set(ADMIN_BYPASS_COOKIE, timestamp, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    maxAge: remainingTime > 0 ? remainingTime : 0,
                    path: "/", // 全パスで有効（サーバーコンポーネントから読み取るため）
                });

                return response;
            }
            // 検証失敗時は、エラーページにリダイレクト
            else {
                const url = request.nextUrl.clone();
                url.pathname = "/auth/error";
                url.searchParams.set(
                    "error",
                    verification.reason || "無効なURLです"
                );
                return NextResponse.redirect(url);
            }
        }
    }

    // バイパス: Cookieがある場合は /admin ページのみ認証をスキップ
    const bypassToken = request.cookies.get(ADMIN_BYPASS_COOKIE)?.value;
    let hasBypassAccess = false;

    if (bypassToken && request.nextUrl.pathname === "/admin") {
        // Cookieに保存されているタイムスタンプを検証（有効期限内か確認）
        const timestampNum = parseInt(bypassToken, 10);
        if (!isNaN(timestampNum)) {
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const validityPeriod = 7 * 24 * 60 * 60; // 7日間

            if (currentTimestamp - timestampNum <= validityPeriod) {
                hasBypassAccess = true;
                // 早期リターン: 通常の認証チェックをスキップ
                return supabaseResponse;
            }
        }
        // 有効期限切れの場合はCookieを削除
        if (!hasBypassAccess) {
            const response = NextResponse.next({ request });
            response.cookies.delete(ADMIN_BYPASS_COOKIE);
            supabaseResponse = response;
        }
    }

    // With Fluid compute, don't put this client in a global environment
    // variable. Always create a new one on each request.
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // createServerClientとsupabase.auth.getClaims()の間にはコードを挟まないでください。
    // ここでミスをすると、ユーザーがランダムにログアウトされる問題のデバッグが非常に困難になります。

    // 重要: getClaims()を削除し、かつSupabaseクライアントでサーバーサイドレンダリングを使用している場合、
    // ユーザーがランダムにログアウトされる可能性があります。
    const { data } = await supabase.auth.getClaims();
    const user = data?.claims;

    // 以下の条件分岐は、ユーザーが未認証かつ特定のパス以外にアクセスした場合にログインページへリダイレクトするためのものです。
    if (
        // 1. userがnullまたはundefinedの場合（＝認証されていない状態）
        !user &&
        // 2. 現在のリクエストパスが「/auth」で始まっていない場合
        !request.nextUrl.pathname.startsWith("/auth")
    ) {
        // 上記すべての条件を満たす場合（＝未認証ユーザーが認証関連ページ・トップページ以外にアクセスした場合）、
        // 強制的にログインページ（/auth/login）へリダイレクトする
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        return NextResponse.redirect(url);
    }

    // ログインしているとき/auth/loginにアクセスした場合は、トップページ（"/"）へリダイレクトする
    // if (user && request.nextUrl.pathname === "/auth/login") {
    //     const url = request.nextUrl.clone();
    //     url.pathname = "/workly";
    //     return NextResponse.redirect(url);
    // }

    // 重要: 必ずsupabaseResponseオブジェクトをそのまま返してください。
    // NextResponse.next()で新しいレスポンスオブジェクトを作成する場合は、必ず以下を守ってください:
    // 1. requestを渡す: const myNewResponse = NextResponse.next({ request })
    // 2. Cookieをコピーする: myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. 必要に応じてmyNewResponseオブジェクトを変更するが、Cookieは変更しないこと
    // 4. 最後に: return myNewResponse
    // これを守らないと、ブラウザとサーバーの間でセッションが同期されず、ユーザーのセッションが予期せず終了する可能性があります。

    return supabaseResponse;
}
