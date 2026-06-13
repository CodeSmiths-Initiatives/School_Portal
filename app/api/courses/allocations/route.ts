import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	createCourseAllocation,
	deleteCourseAllocation,
	updateCourseAllocation,
	type CourseAllocationInput,
	type CourseAllocationUpdateInput,
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

async function authorize(request: Request) {
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
				{ error: "This allocation request is outside your college scope." },
				{ status: 403 },
			),
		};
	}

	const permissions = (session.user.permissions?.length
		? session.user.permissions
		: getDefaultPermissionsForDomain(session.user.domain)) as UserPermissionKey[];

	if (!hasPermissions(permissions, ["courses.assign_staff"], { mode: "any" })) {
		return {
			error: NextResponse.json(
				{ error: "You do not have permission to manage course allocations." },
				{ status: 403 },
			),
		};
	}

	return { collegeSlug };
}

export async function POST(request: Request) {
	try {
		const auth = await authorize(request);

		if ("error" in auth) return auth.error;

		const payload = (await request.json()) as CourseAllocationInput;
		const result = await createCourseAllocation(auth.collegeSlug, payload);
		return NextResponse.json(result, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Unable to create course allocation.",
			},
			{ status: 400 },
		);
	}
}

export async function PATCH(request: Request) {
	try {
		const auth = await authorize(request);

		if ("error" in auth) return auth.error;

		const payload = (await request.json()) as CourseAllocationUpdateInput;
		const result = await updateCourseAllocation(auth.collegeSlug, payload);
		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Unable to update course allocation.",
			},
			{ status: 400 },
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const auth = await authorize(request);

		if ("error" in auth) return auth.error;

		const url = new URL(request.url);
		const courseId = url.searchParams.get("courseId") ?? "";
		const level = url.searchParams.get("level") ?? "";
		const result = await deleteCourseAllocation(auth.collegeSlug, {
			courseId,
			level: level as CourseAllocationInput["level"],
		});

		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Unable to delete course allocation.",
			},
			{ status: 400 },
		);
	}
}
