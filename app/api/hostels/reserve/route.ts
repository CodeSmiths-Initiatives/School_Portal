import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	reserveHostelBed,
	type ReserveHostelBedInput,
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

export async function POST(request: Request) {
	try {
		const session = await getCurrentAuthSession();

		if (!session || session.user.domain !== "student") {
			return NextResponse.json(
				{ error: "Student authentication is required." },
				{ status: 401 },
			);
		}

		const collegeSlug = getCollegeSlug(request, session.user.collegeSlug);

		if (!collegeSlug || session.user.collegeSlug !== collegeSlug) {
			return NextResponse.json(
				{ error: "This reservation is outside your college scope." },
				{ status: 403 },
			);
		}

		const permissions = (session.user.permissions?.length
			? session.user.permissions
			: getDefaultPermissionsForDomain(session.user.domain)) as UserPermissionKey[];

		if (!hasPermissions(permissions, ["hostels.view"], { mode: "any" })) {
			return NextResponse.json(
				{ error: "You do not have permission to reserve hostel beds." },
				{ status: 403 },
			);
		}

		const payload = (await request.json()) as ReserveHostelBedInput;
		const result = await reserveHostelBed(collegeSlug, {
			...payload,
			studentId: session.user.id,
			studentName: payload.studentName || session.user.name || "Current Student",
			studentEmail: payload.studentEmail || session.user.email,
			studentIdentifier:
				payload.studentIdentifier || session.user.email || session.user.id,
		});

		return NextResponse.json(result, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unable to reserve hostel bed.",
			},
			{ status: 409 },
		);
	}
}
