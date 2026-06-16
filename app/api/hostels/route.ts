import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	createHostel,
	getHostelData,
} from "@/lib/services/hostel.service";
import {
	getDefaultPermissionsForDomain,
	hasPermissions,
	type UserPermissionKey,
} from "@/lib/rbac";
import { createHostelSchema } from "@/lib/validation";

function getCollegeSlug(request: Request, fallback?: string) {
	const url = new URL(request.url);
	return url.searchParams.get("collegeSlug") ?? fallback ?? "";
}

async function authorize(request: Request, mutate = false) {
	const session = await getCurrentAuthSession();

	if (!session) {
		return {
			error: NextResponse.json(
				{ error: "Authentication is required." },
				{ status: 401 },
			),
		};
	}

	const collegeSlug = getCollegeSlug(request, session.user.collegeSlug);

	if (!collegeSlug || session.user.collegeSlug !== collegeSlug) {
		return {
			error: NextResponse.json(
				{ error: "This hostel request is outside your college scope." },
				{ status: 403 },
			),
		};
	}

	const permissions = (session.user.permissions?.length
		? session.user.permissions
		: getDefaultPermissionsForDomain(session.user.domain)) as UserPermissionKey[];
	const allowed = mutate
		? ["admin", "staff"].includes(session.user.domain) &&
			hasPermissions(permissions, ["hostels.create"], { mode: "any" })
		: hasPermissions(permissions, ["hostels.view"], { mode: "any" });

	if (!allowed) {
		return {
			error: NextResponse.json(
				{ error: "You do not have permission to access hostels." },
				{ status: 403 },
			),
		};
	}

	return { collegeSlug, session };
}

export async function GET(request: Request) {
	try {
		const auth = await authorize(request);

		if ("error" in auth) return auth.error;

		const studentIdentifier =
			auth.session.user.domain === "student"
				? auth.session.user.email ?? auth.session.user.id
				: undefined;

		return NextResponse.json(
			await getHostelData(auth.collegeSlug, studentIdentifier),
		);
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Unable to load hostels." },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const auth = await authorize(request, true);

		if ("error" in auth) return auth.error;

		const parsed = createHostelSchema.safeParse(await request.json());

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message ?? "Invalid hostel details." },
				{ status: 400 },
			);
		}

		const result = await createHostel(auth.collegeSlug, parsed.data);
		return NextResponse.json(result, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Unable to create hostel." },
			{ status: 400 },
		);
	}
}
