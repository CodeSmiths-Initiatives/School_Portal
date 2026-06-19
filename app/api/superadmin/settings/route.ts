import {
	changeCurrentUserPassword,
	maintenanceWindowSchema,
	passwordChangeSchema,
	platformNoticeSchema,
} from "@/lib/services/superadmin-settings.service";
import {
	getPlatformSettings,
	saveMaintenanceWindow,
} from "@/lib/services/platform-settings-store";
import { recordSuperadminAuditEvent } from "@/lib/services/superadmin-audit.service";
import {
	getCurrentAuthSession,
	getCurrentAuthToken,
} from "@/lib/auth/server-session";
import { getEffectivePermissionsForDomain, hasPermissions } from "@/lib/rbac";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSettingsSchema = z.discriminatedUnion("action", [
	z.object({
		action: z.literal("password"),
		payload: passwordChangeSchema,
	}),
	z.object({
		action: z.literal("notice"),
		payload: platformNoticeSchema.omit({
			id: true,
			createdBy: true,
			updatedAt: true,
		}),
	}),
	z.object({
		action: z.literal("maintenance"),
		payload: maintenanceWindowSchema,
	}),
]);

function assertSuperadmin(
	session: Awaited<ReturnType<typeof getCurrentAuthSession>>,
	action: "view" | "update",
) {
	if (!session || session.user.domain !== "superadmin") {
		return false;
	}

	const permission = action === "update" ? "settings.update" : "settings.view";

	return hasPermissions(
		getEffectivePermissionsForDomain(
			session.user.domain,
			session.user.permissions,
		),
		[permission],
		{ mode: "any" },
	);
}

async function writeSettingsAudit(
	session: NonNullable<Awaited<ReturnType<typeof getCurrentAuthSession>>>,
	input: {
		action: string;
		targetLabel: string;
		summary: string;
		metadata?: Record<string, unknown>;
	},
) {
	await recordSuperadminAuditEvent({
		action: input.action,
		eventType: "settings",
		actorName: session.user.name,
		actorEmail: session.user.email,
		actorRole: session.user.roleLabel,
		entityType: "settings",
		entityId: "platform-settings",
		targetLabel: input.targetLabel,
		summary: input.summary,
		metadata: input.metadata,
	}).catch(() => null);
}

export async function GET() {
	const session = await getCurrentAuthSession();

	if (!assertSuperadmin(session, "view")) {
		return NextResponse.json(
			{ error: "Superadmin settings access is required." },
			{ status: 403 },
		);
	}

	return NextResponse.json({
		settings: await getPlatformSettings(),
		mode: "local-preview",
	});
}

export async function PATCH(request: Request) {
	const session = await getCurrentAuthSession();

	if (!assertSuperadmin(session, "update")) {
		return NextResponse.json(
			{ error: "Superadmin settings update access is required." },
			{ status: 403 },
		);
	}

	const json = await request.json().catch(() => null);
	const validation = updateSettingsSchema.safeParse(json);

	if (!validation.success) {
		return NextResponse.json(
			{
				error:
					validation.error.issues[0]?.message ?? "Invalid settings update data.",
			},
			{ status: 400 },
		);
	}

	if (validation.data.action === "password") {
		const token = await getCurrentAuthToken();

		if (!token) {
			return NextResponse.json(
				{
					error:
						"A Strapi session token is required before changing the password.",
				},
				{ status: 409 },
			);
		}

		try {
			await changeCurrentUserPassword(token, validation.data.payload);
			await writeSettingsAudit(session!, {
				action: "settings.password.changed",
				targetLabel: "Superadmin password",
				summary: "Superadmin changed their platform password.",
			});
			return NextResponse.json({ ok: true, action: "password" });
		} catch (error) {
			return NextResponse.json(
				{
					error:
						error instanceof Error ? error.message : "Unable to update password.",
				},
				{ status: 400 },
			);
		}
	}

	const settings =
		validation.data.action === "maintenance"
			? await saveMaintenanceWindow(validation.data.payload)
			: await getPlatformSettings();

	await writeSettingsAudit(session!, {
		action:
			validation.data.action === "notice"
				? "settings.notice.updated"
				: "settings.maintenance.updated",
		targetLabel:
			validation.data.action === "notice"
				? validation.data.payload.title
				: validation.data.payload.title,
		summary:
			validation.data.action === "notice"
				? `Superadmin updated a ${validation.data.payload.audience} platform notice.`
				: "Superadmin updated the platform maintenance window.",
		metadata: {
			mode: "local-preview",
			settingsAction: validation.data.action,
		},
	});

	return NextResponse.json({
		ok: true,
		action: validation.data.action,
		mode: "local-preview",
		settings,
		updatedAt: new Date().toISOString(),
	});
}
