import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	deleteCourseCatalogueItem,
	updateCourseCatalogueItem,
	type CourseMutationInput,
} from "@/lib/services/course-catalogue.service";
import {
	getDefaultPermissionsForDomain,
	hasPermissions,
	type PermissionKey,
	type UserPermissionKey,
} from "@/lib/rbac";

function getCollegeSlug(request: Request, fallback?: string) {
	const url = new URL(request.url);
	return url.searchParams.get("collegeSlug") ?? fallback ?? "";
}

async function authorize(request: Request, required: PermissionKey[]) {
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

	if (!hasPermissions(permissions, required, { mode: "any" })) {
		return {
			error: NextResponse.json(
				{ error: "You do not have permission to manage this course." },
				{ status: 403 },
			),
		};
	}

	return { collegeSlug };
}

export async function PATCH(
	request: Request,
	ctx: { params: Promise<{ courseId: string }> },
) {
	try {
		const auth = await authorize(request, [
			"courses.update",
			"courses.approve",
			"courses.reject",
		]);

		if ("error" in auth) return auth.error;

		const { courseId } = await ctx.params;
		const payload = (await request.json()) as CourseMutationInput;
		const result = await updateCourseCatalogueItem(
			auth.collegeSlug,
			courseId,
			payload,
		);

		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unable to update course.",
			},
			{ status: 400 },
		);
	}
}

export async function DELETE(
	request: Request,
	ctx: { params: Promise<{ courseId: string }> },
) {
	try {
		const auth = await authorize(request, ["courses.delete"]);

		if ("error" in auth) return auth.error;

		const { courseId } = await ctx.params;
		await deleteCourseCatalogueItem(auth.collegeSlug, courseId);

		return new Response(null, { status: 204 });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unable to delete course.",
			},
			{ status: 400 },
		);
	}
}
