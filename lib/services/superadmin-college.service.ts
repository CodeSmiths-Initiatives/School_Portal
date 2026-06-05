import { z } from "zod";

const DEV_INTERNAL_SECRET = "iums-local-registration-secret-change-before-production";

export const provisionCollegeSchema = z.object({
	name: z.string().trim().min(3, "College name is required"),
	code: z
		.string()
		.trim()
		.min(2, "College code is required")
		.max(12, "Use a short college code")
		.regex(/^[a-zA-Z0-9 -]+$/, "Use letters and numbers only"),
	contactEmail: z.string().trim().email().optional().or(z.literal("")),
	adminName: z.string().trim().min(2, "Admin name is required"),
	adminUsername: z.string().trim().min(3, "Admin username is required"),
	adminEmail: z.string().trim().email("Admin email is required"),
	adminPhone: z.string().trim().optional().or(z.literal("")),
	temporaryPassword: z
		.string()
		.min(8, "Temporary password must be at least 8 characters")
		.max(32, "Temporary password is too long"),
});

export type ProvisionCollegeInput = z.infer<typeof provisionCollegeSchema>;

export type ProvisionedCollege = {
	id: number | string;
	documentId?: string;
	name: string;
	slug: string;
	code: string;
	status: "active" | "inactive" | "archived";
	contactEmail?: string;
	admin?: {
		name?: string;
		username?: string;
		email?: string;
		phone?: string;
		userId?: number | string;
	};
	createdAt?: string;
	updatedAt?: string;
};

export type ProvisionCollegeResult = {
	ok: true;
	college: ProvisionedCollege;
	admin: {
		id: number;
		username: string;
		email: string;
		roleCode: string;
	};
	studentRole: {
		id: number;
		code: string;
	};
	roleTemplates?: {
		adminRoleCode: string;
		studentRoleCode: string;
		scopeSource: "role_assignment";
	};
	emailSent: boolean;
};

function getStrapiBaseUrl() {
	return (
		process.env.STRAPI_API_URL ??
		process.env.NEXT_PUBLIC_STRAPI_API_URL ??
		"http://localhost:1337"
	).replace(/\/$/, "");
}

function getInternalSecret() {
	const configured =
		process.env.PORTAL_INTERNAL_API_SECRET ?? process.env.PORTAL_REGISTRATION_SECRET;

	if (configured) {
		return configured;
	}

	if (process.env.NODE_ENV === "production") {
		throw new Error("PORTAL_INTERNAL_API_SECRET is required in production.");
	}

	return DEV_INTERNAL_SECRET;
}

async function parseError(response: Response, fallback: string) {
	const payload = (await response.json().catch(() => null)) as
		| { error?: { message?: string }; message?: string }
		| null;

	return payload?.error?.message ?? payload?.message ?? fallback;
}

export async function getProvisionedColleges() {
	const response = await fetch(`${getStrapiBaseUrl()}/api/superadmin/colleges`, {
		method: "GET",
		headers: {
			Accept: "application/json",
			"x-portal-internal-secret": getInternalSecret(),
		},
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(
			await parseError(response, "Unable to load provisioned colleges."),
		);
	}

	const payload = (await response.json()) as { colleges?: ProvisionedCollege[] };
	return payload.colleges ?? [];
}

export async function provisionCollegeWithAdmin(input: ProvisionCollegeInput) {
	const validation = provisionCollegeSchema.safeParse(input);

	if (!validation.success) {
		throw new Error(validation.error.issues[0]?.message ?? "Invalid college data.");
	}

	const response = await fetch(`${getStrapiBaseUrl()}/api/superadmin/colleges`, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			"x-portal-internal-secret": getInternalSecret(),
		},
		body: JSON.stringify(validation.data),
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(await parseError(response, "Unable to create college."));
	}

	return response.json() as Promise<ProvisionCollegeResult>;
}
