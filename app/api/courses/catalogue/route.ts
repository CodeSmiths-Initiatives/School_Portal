import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	createCourseCatalogueItem,
	getCourseCatalogue,
	type CourseMutationInput,
} from "@/lib/services/course-catalogue.service";
import {
	getDefaultPermissionsForDomain,
	hasPermissions,
	type UserPermissionKey,
} from "@/lib/rbac";

function getCollegeSlug(request: Request, fallback?: string) {
	const url = new URL(request.url);
	return url.searchParams.get("collegeSlug") ?? fallback ?? "";
}

async function authorize(request: Request, mutate = false) {
	const session = await getCurrentAuthSession();

	if (!session || !["admin", "staff"].includes(session.user.domain)) {
		return {
			error: NextResponse.json(
				{ error: "Staff authentication is required." },
				{ status: 401 },
			),
		};
	}

	const collegeSlug = getCollegeSlug(request, session.user.collegeSlug);

	if (!collegeSlug || session.user.collegeSlug !== collegeSlug) {
		return {
			error: NextResponse.json(
				{ error: "This course request is outside your college scope." },
				{ status: 403 },
			),
		};
	}

	const permissions = (session.user.permissions?.length
		? session.user.permissions
		: getDefaultPermissionsForDomain(session.user.domain)) as UserPermissionKey[];
	const allowed = mutate
		? hasPermissions(permissions, ["courses.create"], { mode: "any" })
		: hasPermissions(permissions, ["courses.view"], { mode: "any" });

	if (!allowed) {
		return {
			error: NextResponse.json(
				{ error: "You do not have permission to manage courses." },
				{ status: 403 },
			),
		};
	}

	return { collegeSlug };
}

export async function GET(request: Request) {
	try {
		const auth = await authorize(request);

		if ("error" in auth) return auth.error;

		return NextResponse.json(await getCourseCatalogue(auth.collegeSlug));
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unable to load courses.",
			},
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const auth = await authorize(request, true);

		if ("error" in auth) return auth.error;

		const payload = (await request.json()) as CourseMutationInput;
		const result = await createCourseCatalogueItem(auth.collegeSlug, payload);
		return NextResponse.json(result, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unable to create course.",
			},
			{ status: 400 },
		);
	}
}
