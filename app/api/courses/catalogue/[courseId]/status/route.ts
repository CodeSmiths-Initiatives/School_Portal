import { NextResponse } from "next/server";
import type { CourseStatus } from "@/features/courses/types/course.types";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import { updateCourseCatalogueStatus } from "@/lib/services/course-catalogue.service";
import {
	getDefaultPermissionsForDomain,
	hasPermissions,
	type PermissionKey,
	type UserPermissionKey,
} from "@/lib/rbac";
import { z } from "zod";

const courseStatusSchema = z.object({
	status: z.enum(["Approved", "Rejected"]),
	approvalNote: z.string().trim().max(500).optional(),
});

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
				{ error: "You do not have permission to review this course." },
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
		const json = await request.json();
		const validation = courseStatusSchema.safeParse(json);

		if (!validation.success) {
			return NextResponse.json(
				{
					error:
						validation.error.issues[0]?.message ??
						"Invalid course review decision.",
				},
				{ status: 400 },
			);
		}

		const auth = await authorize(request, [
			validation.data.status === "Approved"
				? "courses.approve"
				: "courses.reject",
		]);

		if ("error" in auth) return auth.error;

		const { courseId } = await ctx.params;
		const result = await updateCourseCatalogueStatus(
			auth.collegeSlug,
			courseId,
			validation.data.status as CourseStatus,
			validation.data.approvalNote,
		);

		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Unable to update course status.",
			},
			{ status: 400 },
		);
	}
}
