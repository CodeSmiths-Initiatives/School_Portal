import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import { createHostelRoom } from "@/lib/services/hostel.service";
import {
	getDefaultPermissionsForDomain,
	hasPermissions,
	type UserPermissionKey,
} from "@/lib/rbac";
import { createHostelRoomSchema } from "@/lib/validation";

function getCollegeSlug(request: Request, fallback?: string) {
	const url = new URL(request.url);
	return url.searchParams.get("collegeSlug") ?? fallback ?? "";
}

export async function POST(request: Request) {
	try {
		const session = await getCurrentAuthSession();

		if (!session || !["admin", "staff"].includes(session.user.domain)) {
			return NextResponse.json(
				{ error: "Staff authentication is required." },
				{ status: 401 },
			);
		}

		const collegeSlug = getCollegeSlug(request, session.user.collegeSlug);

		if (!collegeSlug || session.user.collegeSlug !== collegeSlug) {
			return NextResponse.json(
				{ error: "This room request is outside your college scope." },
				{ status: 403 },
			);
		}

		const permissions = (session.user.permissions?.length
			? session.user.permissions
			: getDefaultPermissionsForDomain(session.user.domain)) as UserPermissionKey[];

		if (!hasPermissions(permissions, ["hostels.create", "hostels.update"], { mode: "any" })) {
			return NextResponse.json(
				{ error: "You do not have permission to manage hostel rooms." },
				{ status: 403 },
			);
		}

		const parsed = createHostelRoomSchema.safeParse(await request.json());

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message ?? "Invalid room details." },
				{ status: 400 },
			);
		}

		const result = await createHostelRoom(collegeSlug, parsed.data);
		return NextResponse.json(result, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Unable to create room." },
			{ status: 400 },
		);
	}
}
