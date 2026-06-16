import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	deleteHostelRoom,
	updateHostelRoom,
	type UpdateHostelRoomInput,
} from "@/lib/services/hostel.service";
import {
	getDefaultPermissionsForDomain,
	hasPermissions,
	type UserPermissionKey,
} from "@/lib/rbac";

function getCollegeSlug(request: Request, fallback?: string) {
	const url = new URL(request.url);
	return url.searchParams.get("collegeSlug") ?? fallback ?? "";
}

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ roomId: string }> },
) {
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
				{ error: "This room update is outside your college scope." },
				{ status: 403 },
			);
		}

		const permissions = (session.user.permissions?.length
			? session.user.permissions
			: getDefaultPermissionsForDomain(session.user.domain)) as UserPermissionKey[];

		if (!hasPermissions(permissions, ["hostels.update"], { mode: "any" })) {
			return NextResponse.json(
				{ error: "You do not have permission to update hostel rooms." },
				{ status: 403 },
			);
		}

		const { roomId } = await params;
		const payload = (await request.json()) as UpdateHostelRoomInput;
		const result = await updateHostelRoom(collegeSlug, roomId, payload);

		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unable to update room.",
			},
			{ status: 400 },
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ roomId: string }> },
) {
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
				{ error: "This room delete is outside your college scope." },
				{ status: 403 },
			);
		}

		const permissions = (session.user.permissions?.length
			? session.user.permissions
			: getDefaultPermissionsForDomain(session.user.domain)) as UserPermissionKey[];

		if (!hasPermissions(permissions, ["hostels.update"], { mode: "any" })) {
			return NextResponse.json(
				{ error: "You do not have permission to delete hostel rooms." },
				{ status: 403 },
			);
		}

		const { roomId } = await params;
		await deleteHostelRoom(collegeSlug, roomId);

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unable to delete room.",
			},
			{ status: 400 },
		);
	}
}
