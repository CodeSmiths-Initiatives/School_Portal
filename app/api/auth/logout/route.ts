import {
	AUTH_SESSION_COOKIE_NAME,
	AUTH_TOKEN_COOKIE_NAME,
} from "@/lib/auth/session";
import { NextResponse } from "next/server";

function getSafeNextPath(request: Request) {
	const url = new URL(request.url);
	const next = url.searchParams.get("next") ?? "/";

	if (!next.startsWith("/") || next.startsWith("//")) {
		return "/";
	}

	return next;
}

function clearAuthCookies(response: NextResponse) {
	const cookieOptions = {
		httpOnly: true,
		sameSite: "lax" as const,
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: 0,
	};

	response.cookies.set({
		name: AUTH_SESSION_COOKIE_NAME,
		value: "",
		...cookieOptions,
	});

	response.cookies.set({
		name: AUTH_TOKEN_COOKIE_NAME,
		value: "",
		...cookieOptions,
	});

	return response;
}

export async function POST(request: Request) {
	const response = NextResponse.redirect(
		new URL(getSafeNextPath(request), request.url),
		{ status: 303 },
	);

	return clearAuthCookies(response);
}

export async function GET(request: Request) {
	const response = NextResponse.redirect(
		new URL(getSafeNextPath(request), request.url),
	);

	return clearAuthCookies(response);
}
