import { getCurrentAuthSession } from "@/lib/auth/server-session";
import { getEffectivePermissionsForDomain, hasPermissions } from "@/lib/rbac";
import {
	updateCollegeSchema,
	updateProvisionedCollege,
} from "@/lib/services/superadmin-college.service";
import { NextResponse } from "next/server";

type SuperadminCollegeRouteContext = {
	params: Promise<{ collegeId: string }>;
};

function canUpdateCollege(
	session: Awaited<ReturnType<typeof getCurrentAuthSession>>,
) {
	return Boolean(
		session?.user.domain === "superadmin" &&
			hasPermissions(
				getEffectivePermissionsForDomain(
					session.user.domain,
					session.user.permissions,
				),
				["colleges.update"],
				{ mode: "any" },
			),
	);
}

export async function PATCH(
	request: Request,
	{ params }: SuperadminCollegeRouteContext,
) {
	const session = await getCurrentAuthSession();

	if (!canUpdateCollege(session)) {
		return NextResponse.json(
			{ error: "Superadmin update access is required." },
			{ status: 403 },
		);
	}

	const { collegeId } = await params;
	const json = await request.json().catch(() => null);
	const validation = updateCollegeSchema.safeParse(json);

	if (!validation.success) {
		return NextResponse.json(
			{
				error:
					validation.error.issues[0]?.message ??
					"Invalid college update details.",
			},
			{ status: 400 },
		);
	}

	try {
		const result = await updateProvisionedCollege(collegeId, validation.data);
		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unable to update college.",
			},
			{ status: 400 },
		);
	}
}
