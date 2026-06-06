import { getCurrentAuthSession } from "@/lib/auth/server-session";
import { hasPermissions, type UserPermissionKey } from "@/lib/rbac";
import { getCollegeAdminReports } from "@/lib/services/college-admin.service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const session = await getCurrentAuthSession();

		if (!session || !["admin", "staff"].includes(session.user.domain)) {
			return NextResponse.json(
				{ error: "College report authentication is required." },
				{ status: 401 },
			);
		}

		const url = new URL(request.url);
		const collegeSlug = url.searchParams.get("collegeSlug") ?? session.user.collegeSlug;

		if (!collegeSlug || session.user.collegeSlug !== collegeSlug) {
			return NextResponse.json(
				{ error: "This report request is outside your college scope." },
				{ status: 403 },
			);
		}

		const permissions = (session.user.permissions ?? []) as UserPermissionKey[];

		if (!hasPermissions(permissions, ["reports.view"], { mode: "any" })) {
			return NextResponse.json(
				{ error: "You do not have permission to view reports." },
				{ status: 403 },
			);
		}

		const report = await getCollegeAdminReports({
			collegeSlug,
			from: url.searchParams.get("from") ?? undefined,
			to: url.searchParams.get("to") ?? undefined,
		});

		return NextResponse.json({ report });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unable to load college reports.",
			},
			{ status: 500 },
		);
	}
}
