import { getCurrentAuthSession } from "@/lib/auth/server-session";
import { markAppNotificationRead } from "@/lib/services/notification.service";
import {
	getDefaultPermissionsForDomain,
	hasPermissions,
	type UserPermissionKey,
} from "@/lib/rbac";
import { NextResponse } from "next/server";

type RouteContext = {
	params: Promise<{ notificationId: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
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

		if (!hasPermissions(permissions, ["notices.view"], { mode: "any" })) {
			return NextResponse.json(
				{ error: "You do not have permission to read notices." },
				{ status: 403 },
			);
		}

		const { notificationId } = await params;
		const result = await markAppNotificationRead({
			notificationId,
			viewer: {
				userId: session.user.id,
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
					error instanceof Error ? error.message : "Unable to mark notice read.",
			},
			{ status: 400 },
		);
	}
}
