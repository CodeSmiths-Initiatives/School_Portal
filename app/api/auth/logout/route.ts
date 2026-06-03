import {
	AUTH_SESSION_COOKIE_NAME,
	AUTH_TOKEN_COOKIE_NAME,
} from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function POST() {
	const response = NextResponse.json({ ok: true });

	response.cookies.set({
		name: AUTH_SESSION_COOKIE_NAME,
		value: "",
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: 0,
	});

	response.cookies.set({
		name: AUTH_TOKEN_COOKIE_NAME,
		value: "",
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: 0,
	});

	return response;
}
