"use server";

const ADMIN_BYPASS_PASSWORD = process.env.ADMIN_BYPASS_PASSWORD || "";
const ADMIN_BYPASS_SECRET = process.env.ADMIN_BYPASS_SECRET || "";

/**
 * SHA-256ハッシュを生成（Web Crypto API使用）
 * @param input - ハッシュ化する文字列
 * @returns ハッシュ値（16進数文字列）
 */
async function generateHash(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return hashHex;
}

/**
 * 税理士向けの一時アクセスURLを生成
 * @param baseUrl - ベースURL（例: https://your-domain.com）
 * @returns 生成されたURL
 */
export async function generateBypassUrl(baseUrl: string): Promise<{
    url: string;
    expiresAt: Date;
}> {
    if (!ADMIN_BYPASS_PASSWORD || !ADMIN_BYPASS_SECRET) {
        console.error("環境変数エラー:", {
            hasPassword: !!ADMIN_BYPASS_PASSWORD,
            hasSecret: !!ADMIN_BYPASS_SECRET,
        });
        throw new Error("環境変数が設定されていません");
    }

    // 現在のタイムスタンプ（秒単位）
    const timestamp = Math.floor(Date.now() / 1000);

    // ハッシュ生成: SHA-256(PASSWORD + SECRET + TIMESTAMP)
    const hashInput = `${ADMIN_BYPASS_PASSWORD}${ADMIN_BYPASS_SECRET}${timestamp}`;
    const hash = await generateHash(hashInput);

    // デバッグ用ログ（本番環境では削除推奨）
    if (process.env.NODE_ENV === "development") {
        console.log("URL生成:", {
            timestamp,
            passwordLength: ADMIN_BYPASS_PASSWORD.length,
            secretLength: ADMIN_BYPASS_SECRET.length,
            hashLength: hash.length,
        });
    }

    // URLパラメータを構築
    const params = new URLSearchParams({
        p: ADMIN_BYPASS_PASSWORD,
        t: timestamp.toString(),
        h: hash,
    });

    // 有効期限（7日後）
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return {
        url: `${baseUrl}/admin?${params.toString()}`,
        expiresAt,
    };
}

/**
 * URLパラメータを検証
 * @param password - URLから受け取ったパスワード
 * @param timestamp - URLから受け取ったタイムスタンプ
 * @param hash - URLから受け取ったハッシュ
 * @returns 検証結果
 */
export async function verifyBypassUrl(
    password: string,
    timestamp: string,
    hash: string
): Promise<{ valid: boolean; reason?: string }> {

    if (!ADMIN_BYPASS_PASSWORD || !ADMIN_BYPASS_SECRET) {
        return { valid: false, reason: "サーバー設定エラー" };
    }

    // パスワードチェック
    if (password !== ADMIN_BYPASS_PASSWORD) {
        return { valid: false, reason: "パスワードが無効です" };
    }

    // タイムスタンプの検証
    const timestampNum = parseInt(timestamp, 10);
    if (isNaN(timestampNum)) {
        return { valid: false, reason: "タイムスタンプが無効です" };
    }

    // 有効期限チェック（7日間 = 604800秒）
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const validityPeriod = 7 * 24 * 60 * 60; // 7日間（秒）
    const elapsed = currentTimestamp - timestampNum;

    if (elapsed > validityPeriod) {
        return { valid: false, reason: "URLの有効期限が切れています" };
    }

    // 未来のタイムスタンプは拒否
    if (timestampNum > currentTimestamp + 60) {
        return { valid: false, reason: "タイムスタンプが無効です" };
    }

    // ハッシュ検証
    const expectedHashInput = `${ADMIN_BYPASS_PASSWORD}${ADMIN_BYPASS_SECRET}${timestamp}`;
    const expectedHash = await generateHash(expectedHashInput);

    if (hash !== expectedHash) {
        return { valid: false, reason: "署名が無効です" };
    }

    return { valid: true };
}
