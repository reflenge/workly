import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

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
        // 2. 現在のリクエストパスが「/login」で始まっていない場合
        !request.nextUrl.pathname.startsWith("/login") &&
        // 3. 現在のリクエストパスが「/auth」で始まっていない場合
        !request.nextUrl.pathname.startsWith("/auth") &&
        // 4. トップページ（"/"）でない場合
        request.nextUrl.pathname !== "/"
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
