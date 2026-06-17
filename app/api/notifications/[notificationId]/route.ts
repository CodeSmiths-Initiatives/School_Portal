import { getCurrentAuthSession } from "@/lib/auth/server-session";
import { updateAppNotification } from "@/lib/services/notification.service";
import {
	getDefaultPermissionsForDomain,
	hasPermissions,
	type UserPermissionKey,
} from "@/lib/rbac";
import { NextResponse } from "next/server";
import { z } from "zod";

type RouteContext = {
	params: Promise<{ notificationId: string }>;
};

const updateNotificationSchema = z.object({
	title: z.string().trim().min(3).max(120).optional(),
	message: z.string().trim().min(10).max(1000).optional(),
	audience: z
		.enum([
			"all",
			"students",
			"staff",
			"college-admins",
			"specific-admin",
			"specific-user",
		])
		.optional(),
	severity: z.enum(["info", "success", "warning", "critical"]).optional(),
	status: z.enum(["draft", "scheduled", "active", "expired", "archived"]).optional(),
	startAt: z.string().optional(),
	endAt: z.string().optional(),
});

export async function PATCH(request: Request, { params }: RouteContext) {
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
		const canUpdate =
			session.user.domain === "superadmin"
				? hasPermissions(permissions, ["settings.update"], { mode: "any" })
				: hasPermissions(
						permissions,
						["notices.update", "notices.publish", "settings.update"],
						{ mode: "any" },
					);

		if (!canUpdate) {
			return NextResponse.json(
				{ error: "You do not have permission to update notices." },
				{ status: 403 },
			);
		}

		const json = await request.json().catch(() => null);
		const validation = updateNotificationSchema.safeParse(json);

		if (!validation.success) {
			return NextResponse.json(
				{
					error:
						validation.error.issues[0]?.message ??
						"Invalid notification update payload.",
				},
				{ status: 400 },
			);
		}

		const { notificationId } = await params;
		const result = await updateAppNotification({
			notificationId,
			patch: validation.data,
			actor: {
				id: session.user.strapiUserId,
				name: session.user.name ?? session.user.username,
				email: session.user.email,
				role: session.user.roleLabel,
			},
			manager: {
				domain: session.user.domain,
				collegeSlug: session.user.collegeSlug,
			},
		});

		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unable to update notification.",
			},
			{ status: 400 },
		);
	}
}
