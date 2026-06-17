import { getCurrentAuthSession } from "@/lib/auth/server-session";
import { markAllAppNotificationsRead } from "@/lib/services/notification.service";
import {
	getDefaultPermissionsForDomain,
	hasPermissions,
	type UserPermissionKey,
} from "@/lib/rbac";
import { NextResponse } from "next/server";

export async function POST() {
	try {
		const session = await getCurrentAuthSession();

		if (!session) {
			return NextResponse.json(
				{ error: "Authentication is required." },
				{ status: 401 },
			);
		}

		const permissions = (session.user.permissions?.length
			? session.user.permissions
			: getDefaultPermissionsForDomain(session.user.domain)) as UserPermissionKey[];

		if (
			!hasPermissions(
				permissions,
				session.user.domain === "superadmin"
					? ["settings.view", "notices.view"]
					: ["notices.view"],
				{ mode: "any" },
			)
		) {
			return NextResponse.json(
				{ error: "You do not have permission to read notices." },
				{ status: 403 },
			);
		}

		if (!session.user.strapiUserId) {
			return NextResponse.json({
				ok: true,
				updated: 0,
				readAt: new Date().toISOString(),
			});
		}

		const result = await markAllAppNotificationsRead({
			viewer: {
				userId: session.user.strapiUserId,
				domain: session.user.domain,
				roleCode: session.user.portalRoleCode,
				collegeSlug: session.user.collegeSlug,
			},
		});

		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unable to mark notices read.",
			},
			{ status: 400 },
		);
	}
}
