import {
	getProvisionedColleges,
	provisionCollegeSchema,
	provisionCollegeWithAdmin,
} from "@/lib/services/superadmin-college.service";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import { getEffectivePermissionsForDomain, hasPermissions } from "@/lib/rbac";
import { createTemporaryPassword } from "@/lib/security/temporary-password";
import { NextResponse } from "next/server";

function assertSuperadmin(
	session: Awaited<ReturnType<typeof getCurrentAuthSession>>,
	action: "view" | "create",
) {
	if (!session || session.user.domain !== "superadmin") {
		return false;
	}

	const permission =
		action === "create" ? "colleges.create" : "colleges.view";

	return hasPermissions(
		getEffectivePermissionsForDomain(
			session.user.domain,
			session.user.permissions,
		),
		[permission],
		{ mode: "any" },
	);
}

export async function GET() {
	const session = await getCurrentAuthSession();

	if (!assertSuperadmin(session, "view")) {
		return NextResponse.json(
			{ error: "Superadmin access is required." },
			{ status: 403 },
		);
	}

	const colleges = await getProvisionedColleges();
	return NextResponse.json({ colleges });
}

export async function POST(request: Request) {
	const session = await getCurrentAuthSession();

	if (!assertSuperadmin(session, "create")) {
		return NextResponse.json(
			{ error: "Superadmin access is required." },
			{ status: 403 },
		);
	}

	const json = await request.json().catch(() => null);
	const input =
		json && typeof json === "object"
			? {
					...json,
					temporaryPassword:
						typeof (json as { temporaryPassword?: unknown }).temporaryPassword === "string" &&
						(json as { temporaryPassword: string }).temporaryPassword.trim()
							? (json as { temporaryPassword: string }).temporaryPassword
							: createTemporaryPassword(),
				}
			: json;
	const validation = provisionCollegeSchema.safeParse(input);

	if (!validation.success) {
		return NextResponse.json(
			{
				error:
					validation.error.issues[0]?.message ?? "Invalid college provisioning data.",
			},
			{ status: 400 },
		);
	}

	try {
		const result = await provisionCollegeWithAdmin(validation.data);
		return NextResponse.json(result, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unable to provision college.",
			},
			{ status: 400 },
		);
	}
}
