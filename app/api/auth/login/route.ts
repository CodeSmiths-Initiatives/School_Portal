import { loginWithConfiguredAuthProvider } from "@/lib/services/auth.service";
import { loginSchema } from "@/lib/validation";
import {
	AUTH_SESSION_COOKIE_NAME,
	AUTH_TOKEN_COOKIE_NAME,
	createAuthSessionSnapshot,
	encodeSignedAuthSession,
} from "@/lib/auth/session";
import { getActiveMaintenanceWindow } from "@/lib/services/platform-settings-store";
import { NextResponse } from "next/server";
import { z } from "zod";

const COOKIE_MAX_AGE_SECONDS = 8 * 60 * 60;
const routeLoginSchema = loginSchema.extend({
	audience: z.enum(["student", "staff"]).default("student"),
});

export async function POST(request: Request) {
	const payload = await request.json().catch(() => null);
	const parsed = routeLoginSchema.safeParse(payload);

	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, message: "Email/username and password are required." },
			{ status: 400 },
		);
	}

	const { audience, ...credentials } = parsed.data;
	const result = await loginWithConfiguredAuthProvider(credentials, audience);

	if (!result.ok) {
		return NextResponse.json(result, { status: 401 });
	}

	const activeMaintenance = await getActiveMaintenanceWindow();

	if (activeMaintenance && result.session.user.domain !== "superadmin") {
		return NextResponse.json(
			{
				ok: false,
				message: activeMaintenance.message,
				maintenance: activeMaintenance,
			},
			{ status: 503 },
		);
	}

	const sessionSnapshot = createAuthSessionSnapshot(result.session);
	const response = NextResponse.json({
		ok: true,
		session: sessionSnapshot,
	});

	response.cookies.set({
		name: AUTH_SESSION_COOKIE_NAME,
		value: await encodeSignedAuthSession(sessionSnapshot),
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: COOKIE_MAX_AGE_SECONDS,
	});

	if (result.session.token) {
		response.cookies.set({
			name: AUTH_TOKEN_COOKIE_NAME,
			value: result.session.token,
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			path: "/",
			maxAge: COOKIE_MAX_AGE_SECONDS,
		});
	}

	return response;
}
