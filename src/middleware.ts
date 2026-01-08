import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

const EXTERNAL_BROWSER_PARAM = 'openExternalBrowser'

function isReadOnlyMethod(method: string) {
  return method === 'GET' || method === 'HEAD'
}

function maybeRedirectForLineInAppBrowser(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') ?? ''
  const url = request.nextUrl
  const hasExternalBrowserParam = url.searchParams.has(EXTERNAL_BROWSER_PARAM)
  const isLineInAppBrowser = userAgent.includes('Line/')
  const shouldAddParam = isLineInAppBrowser && !hasExternalBrowserParam
  const shouldRemoveParam = !isLineInAppBrowser && hasExternalBrowserParam

  // LINE内ブラウザ対策:
  // - LINE内ブラウザで開かれたときは、同じURLに「openExternalBrowser=1」を付けてリダイレクトし、
  //   OS側の「外部ブラウザで開く」導線を作る（同一ページでループしないよう、1回だけ付与）。
  // - 外部ブラウザに遷移できた後は user-agent からLINE判定が外れるため、URLをきれいに保つ目的で
  //   「openExternalBrowser」パラメータを削除してリダイレクトする（共有URLに残らないようにする）。
  // - POST等の書き込みリクエストでリダイレクトすると副作用が起き得るため、GET/HEADに限定する。
  if (!isReadOnlyMethod(request.method)) return null

  if (shouldAddParam || shouldRemoveParam) {
    const redirectUrl = url.clone()

    if (shouldAddParam) redirectUrl.searchParams.set(EXTERNAL_BROWSER_PARAM, '1')
    if (shouldRemoveParam) redirectUrl.searchParams.delete(EXTERNAL_BROWSER_PARAM)

    // 307: メソッドを維持したままリダイレクト（ただし本処理はGET/HEADに限定）
    return NextResponse.redirect(redirectUrl, 307)
  }

  return null
}

export async function middleware(request: NextRequest) {
  const lineRedirect = maybeRedirectForLineInAppBrowser(request)
  if (lineRedirect) return lineRedirect

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
