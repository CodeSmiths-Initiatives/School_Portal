import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	createCollegeAdminRole,
	getCollegeAdminRoles,
	type CollegeRoleMutationInput,
} from "@/lib/services/college-admin.service";
import { hasPermissions, type UserPermissionKey } from "@/lib/rbac";
import { NextResponse } from "next/server";

function canManageRoles(permissions: UserPermissionKey[]) {
	return hasPermissions(permissions, ["roles.view"], { mode: "any" });
}

function canMutateRoles(permissions: UserPermissionKey[]) {
	return hasPermissions(permissions, ["roles.create", "roles.assign_permissions"], {
		mode: "any",
	});
}

function getCollegeSlug(request: Request, fallback?: string) {
	const url = new URL(request.url);
	return url.searchParams.get("collegeSlug") ?? fallback ?? "";
}

async function authorize(request: Request, mutate = false) {
	const session = await getCurrentAuthSession();

	if (!session || session.user.domain !== "admin") {
		return {
			error: NextResponse.json(
				{ error: "College admin authentication is required." },
				{ status: 401 },
			),
		};
	}

	const collegeSlug = getCollegeSlug(request, session.user.collegeSlug);

	if (!collegeSlug || session.user.collegeSlug !== collegeSlug) {
		return {
			error: NextResponse.json(
				{ error: "This role request is outside your college scope." },
				{ status: 403 },
			),
		};
	}

	const permissions = (session.user.permissions ?? []) as UserPermissionKey[];
	const allowed = mutate ? canMutateRoles(permissions) : canManageRoles(permissions);

	if (!allowed) {
		return {
			error: NextResponse.json(
				{ error: "You do not have permission to manage roles." },
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

		const payload = await getCollegeAdminRoles(auth.collegeSlug);
		return NextResponse.json(payload);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unable to load college roles.",
			},
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const auth = await authorize(request, true);

		if ("error" in auth) return auth.error;

		const payload = (await request.json()) as CollegeRoleMutationInput;
		const result = await createCollegeAdminRole(auth.collegeSlug, payload);
		return NextResponse.json(result, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unable to create college role.",
			},
			{ status: 400 },
		);
	}
}
