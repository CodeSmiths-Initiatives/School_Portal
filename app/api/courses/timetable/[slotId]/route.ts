import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	deleteCourseTimetableSlot,
	updateCourseTimetableSlot,
	type CourseTimetableInput,
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
				{ error: "This timetable request is outside your college scope." },
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
				{ error: "You do not have permission to manage course timetable." },
				{ status: 403 },
			),
		};
	}

	return { collegeSlug };
}

export async function PATCH(
	request: Request,
	ctx: { params: Promise<{ slotId: string }> },
) {
	try {
		const auth = await authorize(request, ["courses.update"]);

		if ("error" in auth) return auth.error;

		const { slotId } = await ctx.params;
		const payload = (await request.json()) as CourseTimetableInput;
		const result = await updateCourseTimetableSlot(
			auth.collegeSlug,
			slotId,
			payload,
		);

		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Unable to update timetable slot.",
			},
			{ status: 400 },
		);
	}
}

export async function DELETE(
	request: Request,
	ctx: { params: Promise<{ slotId: string }> },
) {
	try {
		const auth = await authorize(request, ["courses.delete"]);

		if ("error" in auth) return auth.error;

		const { slotId } = await ctx.params;
		await deleteCourseTimetableSlot(auth.collegeSlug, slotId);

		return new Response(null, { status: 204 });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Unable to delete timetable slot.",
			},
			{ status: 400 },
		);
	}
}
