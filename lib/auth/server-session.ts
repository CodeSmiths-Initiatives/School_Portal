import {
	AUTH_SESSION_COOKIE_NAME,
	AUTH_TOKEN_COOKIE_NAME,
	parseSignedAuthSessionValue,
} from "@/lib/auth/session";
import { cookies } from "next/headers";

export async function getCurrentAuthSession() {
	const cookieStore = await cookies();
	return parseSignedAuthSessionValue(
		cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value,
	);
}

export async function getCurrentAuthToken() {
	const cookieStore = await cookies();
	return cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value ?? null;
}

export async function getCurrentRoleLabel(fallback: string) {
	const session = await getCurrentAuthSession();
	return session?.user.roleLabel ?? fallback;
}
