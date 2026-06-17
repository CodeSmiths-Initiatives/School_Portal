import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	createAppNotification,
	listAppNotifications,
	type AppNotificationAudience,
	type AppNotificationCreateInput,
	type AppNotificationSeverity,
	type AppNotificationStatus,
	type AppNotificationViewer,
} from "@/lib/services/notification.service";
import {
	getDefaultPermissionsForDomain,
	hasPermissions,
	type UserPermissionKey,
} from "@/lib/rbac";
import { NextResponse } from "next/server";
import { z } from "zod";

const createNotificationSchema = z.object({
	title: z.string().trim().min(3).max(120),
	message: z.string().trim().min(10).max(1000),
	scope: z.enum(["platform", "college"]),
	audience: z.enum([
		"all",
		"students",
		"staff",
		"college-admins",
		"specific-admin",
		"specific-user",
	]),
	severity: z.enum(["info", "success", "warning", "critical"]).optional(),
	status: z.enum(["draft", "scheduled", "active", "expired", "archived"]).optional(),
	startAt: z.string().optional(),
	endAt: z.string().optional(),
	collegeSlug: z.string().trim().optional(),
	targetUserId: z.union([z.string(), z.number()]).optional(),
	targetRoleId: z.union([z.string(), z.number()]).optional(),
	targetFacultyId: z.union([z.string(), z.number()]).optional(),
	targetDepartmentId: z.union([z.string(), z.number()]).optional(),
	idempotencyKey: z.string().trim().max(160).optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

function getPermissions(
	session: NonNullable<Awaited<ReturnType<typeof getCurrentAuthSession>>>,
) {
	return (session.user.permissions?.length
		? session.user.permissions
		: getDefaultPermissionsForDomain(session.user.domain)) as UserPermissionKey[];
}

function createViewer(
	session: NonNullable<Awaited<ReturnType<typeof getCurrentAuthSession>>>,
): AppNotificationViewer {
	return {
		userId: session.user.strapiUserId ?? session.user.id,
		domain: session.user.domain,
		roleCode: session.user.portalRoleCode,
		collegeSlug: session.user.collegeSlug,
	};
}

function canViewNotifications(
	session: NonNullable<Awaited<ReturnType<typeof getCurrentAuthSession>>>,
	permissions: UserPermissionKey[],
) {
	if (session.user.domain === "superadmin") {
		return hasPermissions(permissions, ["settings.view", "notices.view"], {
			mode: "any",
		});
	}

	return hasPermissions(permissions, ["notices.view"], { mode: "any" });
}

function canCreateNotification(
	session: NonNullable<Awaited<ReturnType<typeof getCurrentAuthSession>>>,
	permissions: UserPermissionKey[],
) {
	if (session.user.domain === "superadmin") {
		return hasPermissions(permissions, ["settings.update"], { mode: "any" });
	}

	return hasPermissions(permissions, ["notices.create"], { mode: "any" });
}

function canManageNotificationList(
	session: NonNullable<Awaited<ReturnType<typeof getCurrentAuthSession>>>,
	permissions: UserPermissionKey[],
) {
	if (session.user.domain === "superadmin") {
		return hasPermissions(permissions, ["settings.view", "settings.update"], {
			mode: "any",
		});
	}

	return hasPermissions(
		permissions,
		["notices.view", "notices.create", "notices.update", "notices.publish"],
		{ mode: "any" },
	);
}

function normalizeCreateInput(
	input: z.infer<typeof createNotificationSchema>,
): AppNotificationCreateInput {
	return {
		title: input.title,
		message: input.message,
		scope: input.scope,
		audience: input.audience as AppNotificationAudience,
		severity: input.severity as AppNotificationSeverity | undefined,
		status: input.status as AppNotificationStatus | undefined,
		startAt: input.startAt,
		endAt: input.endAt,
		collegeSlug: input.collegeSlug,
		targetUserId: input.targetUserId,
		targetRoleId: input.targetRoleId,
		targetFacultyId: input.targetFacultyId,
		targetDepartmentId: input.targetDepartmentId,
		idempotencyKey: input.idempotencyKey,
		metadata: input.metadata,
	};
}

export async function GET(request: Request) {
	try {
		const session = await getCurrentAuthSession();

		if (!session) {
			return NextResponse.json(
				{ error: "Authentication is required." },
				{ status: 401 },
			);
		}

		const permissions = getPermissions(session);

		if (!canViewNotifications(session, permissions)) {
			return NextResponse.json(
				{ error: "You do not have permission to view notices." },
				{ status: 403 },
			);
		}

		const url = new URL(request.url);
		const manage = url.searchParams.get("manage") === "true";

		if (manage && !canManageNotificationList(session, permissions)) {
			return NextResponse.json(
				{ error: "You do not have permission to manage notices." },
				{ status: 403 },
			);
		}

		if (!session.user.strapiUserId && !manage) {
			return NextResponse.json({
				notifications: [],
				meta: {
					page: Number(url.searchParams.get("page") ?? "1"),
					pageSize: Number(url.searchParams.get("pageSize") ?? "20"),
					total: 0,
					unread: 0,
					generatedAt: new Date().toISOString(),
				},
			});
		}

		const payload = await listAppNotifications({
			viewer: createViewer(session),
			status:
				(url.searchParams.get("status") as
					| "visible"
					| "all"
					| AppNotificationStatus
					| null) ?? "visible",
			page: Number(url.searchParams.get("page") ?? "1"),
			pageSize: Number(url.searchParams.get("pageSize") ?? "20"),
			includeDismissed: url.searchParams.get("includeDismissed") === "true",
			manage,
		});

		return NextResponse.json(payload);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unable to load notifications.",
			},
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const session = await getCurrentAuthSession();

		if (!session) {
			return NextResponse.json(
				{ error: "Authentication is required." },
				{ status: 401 },
			);
		}

		const permissions = getPermissions(session);

		if (!canCreateNotification(session, permissions)) {
			return NextResponse.json(
				{ error: "You do not have permission to create notices." },
				{ status: 403 },
			);
		}

		const json = await request.json().catch(() => null);
		const validation = createNotificationSchema.safeParse(json);

		if (!validation.success) {
			return NextResponse.json(
				{
					error:
						validation.error.issues[0]?.message ??
						"Invalid notification payload.",
				},
				{ status: 400 },
			);
		}

		const input = normalizeCreateInput(validation.data);

		if (session.user.domain !== "superadmin") {
			if (input.scope !== "college") {
				return NextResponse.json(
					{ error: "Only Superadmin can create platform notifications." },
					{ status: 403 },
				);
			}

			if (!session.user.collegeSlug || input.collegeSlug !== session.user.collegeSlug) {
				return NextResponse.json(
					{ error: "This notification is outside your college scope." },
					{ status: 403 },
				);
			}
		}

		const result = await createAppNotification({
			notification: input,
			actor: {
				id: session.user.strapiUserId,
				name: session.user.name ?? session.user.username,
				email: session.user.email,
				role: session.user.roleLabel,
			},
		});

		return NextResponse.json(result, { status: result.idempotent ? 200 : 201 });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unable to create notification.",
			},
			{ status: 400 },
		);
	}
}
