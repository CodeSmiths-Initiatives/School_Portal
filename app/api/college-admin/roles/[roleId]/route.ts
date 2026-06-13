import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	getDefaultPermissionsForDomain,
	hasPermissions,
	type UserPermissionKey,
} from "@/lib/rbac";
import {
	type CollegeRoleMutationInput,
	updateCollegeAdminRole,
} from "@/lib/services/college-admin.service";
import { NextResponse } from "next/server";

type RouteContext = {
	params: Promise<{ roleId: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
	try {
		const session = await getCurrentAuthSession();

		if (!session || session.user.domain !== "admin") {
			return NextResponse.json(
				{ error: "College admin authentication is required." },
				{ status: 401 },
			);
		}

		const url = new URL(request.url);
		const collegeSlug = url.searchParams.get("collegeSlug") ?? session.user.collegeSlug;

		if (!collegeSlug || session.user.collegeSlug !== collegeSlug) {
			return NextResponse.json(
				{ error: "This role request is outside your college scope." },
				{ status: 403 },
			);
		}

		const permissions = (session.user.permissions?.length
			? session.user.permissions
			: getDefaultPermissionsForDomain(session.user.domain)) as UserPermissionKey[];

		if (
			!hasPermissions(permissions, ["roles.update", "roles.assign_permissions"], {
				mode: "any",
			})
		) {
			return NextResponse.json(
				{ error: "You do not have permission to update roles." },
				{ status: 403 },
			);
		}

		const { roleId } = await params;
		const payload = (await request.json()) as CollegeRoleMutationInput;
		const result = await updateCollegeAdminRole(collegeSlug, roleId, payload);

		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unable to update college role.",
			},
			{ status: 400 },
		);
	}
}
