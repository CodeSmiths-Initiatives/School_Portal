import type { AuthSession } from "./accounts";

export const AUTH_SESSION_COOKIE_NAME = "iums-auth-session";
export const AUTH_TOKEN_COOKIE_NAME = "iums-auth-token";
export const AUTH_SESSION_STORAGE_KEY = "iums-auth-session";
const SESSION_TTL_HOURS = 8;
const DEV_SESSION_SECRET =
	"iums-local-session-secret-change-before-production";

export function createSessionExpiry(now = new Date()) {
	return new Date(now.getTime() + SESSION_TTL_HOURS * 60 * 60 * 1000).toISOString();
}

export function isAuthSessionExpired(session: AuthSession, now = new Date()) {
	return new Date(session.expiresAt).getTime() <= now.getTime();
}

export function createAuthSessionSnapshot(session: AuthSession): AuthSession {
	const { token: _token, ...snapshot } = session;
	return snapshot;
}

function getSessionSecret() {
	const secret =
		process.env.AUTH_SESSION_SECRET ??
		process.env.NEXTAUTH_SECRET ??
		process.env.STRAPI_ADMIN_JWT_SECRET;

	if (secret) {
		return secret;
	}

	if (process.env.NODE_ENV === "production") {
		throw new Error("AUTH_SESSION_SECRET is required in production.");
	}

	return DEV_SESSION_SECRET;
}

function bytesToBase64Url(bytes: Uint8Array) {
	let binary = "";

	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	const base64 =
		typeof btoa === "function"
			? btoa(binary)
			: Buffer.from(bytes).toString("base64");

	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signPayload(payload: string) {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(getSessionSecret()),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

	return bytesToBase64Url(new Uint8Array(signature));
}

function encodeAuthSessionPayload(session: AuthSession) {
	return encodeURIComponent(JSON.stringify(createAuthSessionSnapshot(session)));
}

export async function encodeSignedAuthSession(session: AuthSession) {
	const payload = encodeAuthSessionPayload(session);
	const signature = await signPayload(payload);

	return `${payload}.${signature}`;
}

export async function parseSignedAuthSessionValue(value?: string | null) {
	if (!value) {
		return null;
	}

	const separatorIndex = value.lastIndexOf(".");

	if (separatorIndex <= 0) {
		return;
	}

	const payload = value.slice(0, separatorIndex);
	const signature = value.slice(separatorIndex + 1);
	const expectedSignature = await signPayload(payload);

	if (signature !== expectedSignature) {
		return null;
	}

	try {
		const session = JSON.parse(decodeURIComponent(payload)) as AuthSession;

		if (!session?.user?.id || !session.destination?.path) {
			return null;
		}

		if (isAuthSessionExpired(session)) {
			return null;
		}

		return session;
	} catch {
		return null;
	}
}

export function getAuthSessionRoleLabel(session: AuthSession | null) {
	return session?.user.roleLabel ?? null;
}
