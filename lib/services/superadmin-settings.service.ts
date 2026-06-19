import { z } from "zod";
import { portalPasswordSchema } from "@/lib/validation";

export const platformNoticeAudienceSchema = z.enum([
	"all",
	"students",
	"staff",
	"college-admins",
]);

export const platformNoticeSeveritySchema = z.enum([
	"info",
	"success",
	"warning",
	"critical",
]);

export const platformNoticeStatusSchema = z.enum([
	"draft",
	"active",
	"expired",
]);

export const platformNoticeSchema = z.object({
	id: z.string().min(1),
	title: z.string().trim().min(3, "Notice title is required").max(90),
	message: z.string().trim().min(10, "Notice message is required").max(280),
	audience: platformNoticeAudienceSchema,
	severity: platformNoticeSeveritySchema,
	status: platformNoticeStatusSchema,
	startAt: z.string().min(1, "Start date is required"),
	endAt: z.string().min(1, "End date is required"),
	createdBy: z.string().min(1),
	updatedAt: z.string().min(1),
});

export const maintenanceWindowSchema = z
	.object({
		enabled: z.boolean(),
		title: z.string().trim().min(3, "Maintenance title is required").max(90),
		message: z
			.string()
			.trim()
			.min(10, "Maintenance message is required")
			.max(280),
		startAt: z.string().min(1, "Start date is required"),
		endAt: z.string().min(1, "End date is required"),
		impact: z.enum(["low", "medium", "high"]),
	})
	.refine((data) => new Date(data.endAt) > new Date(data.startAt), {
		message: "Maintenance end date must be after the start date",
		path: ["endAt"],
	});

export const passwordChangeSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: portalPasswordSchema,
		confirmPassword: z.string().min(1, "Confirm your new password"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export const platformSettingsSchema = z.object({
	notices: z.array(platformNoticeSchema),
	maintenance: maintenanceWindowSchema,
});

export type PlatformNoticeAudience = z.infer<typeof platformNoticeAudienceSchema>;
export type PlatformNoticeSeverity = z.infer<typeof platformNoticeSeveritySchema>;
export type PlatformNoticeStatus = z.infer<typeof platformNoticeStatusSchema>;
export type PlatformNotice = z.infer<typeof platformNoticeSchema>;
export type MaintenanceWindow = z.infer<typeof maintenanceWindowSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type PlatformSettings = z.infer<typeof platformSettingsSchema>;

function nowIso() {
	return new Date().toISOString();
}

function daysFromNow(days: number) {
	const date = new Date();
	date.setDate(date.getDate() + days);
	return date.toISOString().slice(0, 16);
}

export function createDefaultPlatformSettings(): PlatformSettings {
	const updatedAt = nowIso();

	return {
		notices: [
			{
				id: "notice-maintenance-august",
				title: "Scheduled maintenance",
				message:
					"The school portal will undergo planned maintenance from 1 Aug to 15 Aug. Critical admission and payment data will remain protected.",
				audience: "all",
				severity: "warning",
				status: "draft",
				startAt: daysFromNow(7),
				endAt: daysFromNow(21),
				createdBy: "Superadmin",
				updatedAt,
			},
			{
				id: "notice-admission-open",
				title: "Admissions are open",
				message:
					"Applicants can continue registration, complete payment, and track admission progress from their college-specific portal.",
				audience: "students",
				severity: "info",
				status: "active",
				startAt: daysFromNow(-2),
				endAt: daysFromNow(30),
				createdBy: "Superadmin",
				updatedAt,
			},
		],
		maintenance: {
			enabled: false,
			title: "Platform maintenance window",
			message:
				"The platform is scheduled for maintenance. Users will see this notice before any downtime begins.",
			startAt: daysFromNow(7),
			endAt: daysFromNow(8),
			impact: "medium",
		},
	};
}

function getStrapiBaseUrl() {
	return (
		process.env.STRAPI_API_URL ??
		process.env.NEXT_PUBLIC_STRAPI_API_URL ??
		"http://localhost:1337"
	).replace(/\/$/, "");
}

async function parseStrapiError(response: Response) {
	const payload = (await response.json().catch(() => null)) as
		| { error?: { message?: string }; message?: string }
		| null;

	return payload?.error?.message ?? payload?.message ?? "Unable to update password.";
}

export async function changeCurrentUserPassword(
	token: string,
	input: PasswordChangeInput,
) {
	const validation = passwordChangeSchema.safeParse(input);

	if (!validation.success) {
		throw new Error(validation.error.issues[0]?.message ?? "Invalid password data.");
	}

	const response = await fetch(`${getStrapiBaseUrl()}/api/auth/change-password`, {
		method: "POST",
		headers: {
			Accept: "application/json",
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			currentPassword: validation.data.currentPassword,
			password: validation.data.newPassword,
			passwordConfirmation: validation.data.confirmPassword,
		}),
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(await parseStrapiError(response));
	}

	return response.json() as Promise<unknown>;
}
