import {
	createGlobalPermission,
	createPermissionSchema,
	getGlobalRoleManagement,
	globalRolePermissionSchema,
	updateGlobalRolePermissions,
} from "@/lib/services/superadmin-role.service";
import { recordSuperadminAuditEvent } from "@/lib/services/superadmin-audit.service";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import { getEffectivePermissionsForDomain, hasPermissions } from "@/lib/rbac";
import { NextResponse } from "next/server";

function assertSuperadmin(
	session: Awaited<ReturnType<typeof getCurrentAuthSession>>,
	action: "view" | "update",
) {
	if (!session || session.user.domain !== "superadmin") {
		return false;
	}

	const permission = action === "view" ? "roles.view" : "roles.assign_permissions";

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
			{ error: "Superadmin role access is required." },
			{ status: 403 },
		);
	}

	const payload = await getGlobalRoleManagement();
	return NextResponse.json(payload);
}

export async function PATCH(request: Request) {
	const session = await getCurrentAuthSession();

	if (!assertSuperadmin(session, "update")) {
		return NextResponse.json(
			{ error: "Superadmin role update access is required." },
			{ status: 403 },
		);
	}

	const json = await request.json().catch(() => null);
	const validation = globalRolePermissionSchema.safeParse(json);

	if (!validation.success) {
		return NextResponse.json(
			{ error: validation.error.issues[0]?.message ?? "Invalid role permissions." },
			{ status: 400 },
		);
	}

	try {
		const result = await updateGlobalRolePermissions(validation.data);
		await recordSuperadminAuditEvent({
			action: "roles.permissions.updated",
			eventType: "updated",
			actorName: session!.user.name,
			actorEmail: session!.user.email,
			actorRole: session!.user.roleLabel,
			entityType: "portal-role",
			entityId: validation.data.roleCode,
			targetLabel: validation.data.roleCode,
			summary: `Superadmin updated permissions for ${validation.data.roleCode}.`,
			metadata: {
				permissionCount: validation.data.permissionKeys.length,
			},
		}).catch(() => null);
		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unable to update role permissions.",
			},
			{ status: 400 },
		);
	}
}

export async function POST(request: Request) {
	const session = await getCurrentAuthSession();

	if (!assertSuperadmin(session, "update")) {
		return NextResponse.json(
			{ error: "Superadmin permission creation access is required." },
			{ status: 403 },
		);
	}

	const json = await request.json().catch(() => null);
	const validation = createPermissionSchema.safeParse(json);

	if (!validation.success) {
		return NextResponse.json(
			{ error: validation.error.issues[0]?.message ?? "Invalid permission." },
			{ status: 400 },
		);
	}

	try {
		const result = await createGlobalPermission(validation.data);
		return NextResponse.json(result, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unable to create permission.",
			},
			{ status: 400 },
		);
	}
}
