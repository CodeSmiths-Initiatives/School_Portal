import {
	AUTH_SESSION_COOKIE_NAME,
	parseSignedAuthSessionValue,
} from "@/lib/auth/session";
import { NextResponse, type NextRequest } from "next/server";

const STUDENT_SIGNIN_PATH = "/signin";
const STAFF_SIGNIN_PATH = "/staff/signin";

function redirectTo(path: string, request: NextRequest) {
	return NextResponse.redirect(new URL(path, request.url));
}

async function getSession(request: NextRequest) {
	return parseSignedAuthSessionValue(
		request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value,
	);
}

function getCollegeRoute(pathname: string) {
	const parts = pathname.split("/").filter(Boolean);

	if (parts[0] !== "college" || !parts[1] || !parts[2]) {
		return null;
	}

	return {
		collegeSlug: parts[1],
		domain: parts[2],
	};
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const session = await getSession(request);

	if (pathname === "/student/dashboard") {
		if (session?.user.domain === "student") {
			return redirectTo(session.destination.path, request);
		}

		return redirectTo(STUDENT_SIGNIN_PATH, request);
	}

	if (pathname === "/staff/dashboard") {
		if (session && session.user.domain !== "student") {
			return redirectTo(session.destination.path, request);
		}

		return redirectTo(STAFF_SIGNIN_PATH, request);
	}

	if (pathname === "/admin/dashboard") {
		if (session?.user.domain === "superadmin") {
			return redirectTo(session.destination.path, request);
		}

		return redirectTo(STAFF_SIGNIN_PATH, request);
	}

	if (pathname.startsWith("/superadmin/dashboard")) {
		if (session?.user.domain === "superadmin") {
			return NextResponse.next();
		}

		return redirectTo(STAFF_SIGNIN_PATH, request);
	}

	const collegeRoute = getCollegeRoute(pathname);

	if (!collegeRoute) {
		return NextResponse.next();
	}

	if (!session) {
		return redirectTo(
			collegeRoute.domain === "student" ? STUDENT_SIGNIN_PATH : STAFF_SIGNIN_PATH,
			request,
		);
	}

	const isSameCollege = session.user.collegeSlug === collegeRoute.collegeSlug;
	const isSharedCollegeModule = collegeRoute.domain === "modules";

	if (isSharedCollegeModule) {
		if (session.user.domain === "superadmin" || isSameCollege) {
			return NextResponse.next();
		}

		return redirectTo(session.destination.path, request);
	}

	const isSameDomain = session.user.domain === collegeRoute.domain;

	if (isSameCollege && isSameDomain) {
		return NextResponse.next();
	}

	return redirectTo(session.destination.path, request);
}

export const config = {
	matcher: [
		"/student/dashboard",
		"/staff/dashboard",
		"/admin/dashboard",
		"/superadmin/dashboard/:path*",
		"/college/:collegeSlug/modules/:path*",
		"/college/:collegeSlug/student/:path*",
		"/college/:collegeSlug/staff/:path*",
		"/college/:collegeSlug/admin/:path*",
	],
};
