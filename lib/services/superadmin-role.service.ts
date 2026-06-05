import { z } from "zod";

const DEV_INTERNAL_SECRET = "iums-local-registration-secret-change-before-production";

export const GLOBAL_ROLE_CODES = [
	"platform-college-admin",
	"platform-student",
] as const;

export const globalRolePermissionSchema = z.object({
	roleCode: z.enum(GLOBAL_ROLE_CODES),
	permissionKeys: z.array(z.string().trim().min(3)).max(250),
});

export const createPermissionSchema = z.object({
	key: z
		.string()
		.trim()
		.toLowerCase()
		.regex(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/, "Use module.action"),
	module: z.string().trim().min(2).optional().or(z.literal("")),
	action: z.string().trim().min(2).optional().or(z.literal("")),
	label: z.string().trim().min(3, "Permission label is required"),
	description: z.string().trim().optional().or(z.literal("")),
});

export type GlobalRoleCode = (typeof GLOBAL_ROLE_CODES)[number];
export type GlobalPermission = {
	id: number | string;
	key: string;
	module: string;
	action: string;
	label: string;
	description?: string;
};
export type GlobalRoleTemplate = {
	id: number | string;
	name: string;
	code: GlobalRoleCode;
	description?: string;
	roleType: "system" | "custom";
	tenantScope: "platform" | "college";
	scopeType: "platform" | "college" | "faculty" | "department" | "course" | "self";
	permissions: GlobalPermission[];
};
export type GlobalRoleManagementPayload = {
	roles: GlobalRoleTemplate[];
	permissions: GlobalPermission[];
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

export async function getGlobalRoleManagement() {
	const response = await fetch(`${getStrapiBaseUrl()}/api/superadmin/global-roles`, {
		method: "GET",
		headers: {
			Accept: "application/json",
			"x-portal-internal-secret": getInternalSecret(),
		},
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(await parseError(response, "Unable to load global roles."));
	}

	return response.json() as Promise<GlobalRoleManagementPayload>;
}

export async function updateGlobalRolePermissions(input: {
	roleCode: GlobalRoleCode;
	permissionKeys: string[];
}) {
	const validation = globalRolePermissionSchema.safeParse(input);

	if (!validation.success) {
		throw new Error(validation.error.issues[0]?.message ?? "Invalid role permissions.");
	}

	const response = await fetch(
		`${getStrapiBaseUrl()}/api/superadmin/global-roles/${validation.data.roleCode}`,
		{
			method: "PATCH",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				"x-portal-internal-secret": getInternalSecret(),
			},
			body: JSON.stringify({ permissionKeys: validation.data.permissionKeys }),
			cache: "no-store",
		},
	);

	if (!response.ok) {
		throw new Error(await parseError(response, "Unable to update role permissions."));
	}

	return response.json() as Promise<{ role: GlobalRoleTemplate }>;
}

export async function createGlobalPermission(
	input: z.infer<typeof createPermissionSchema>,
) {
	const validation = createPermissionSchema.safeParse(input);

	if (!validation.success) {
		throw new Error(validation.error.issues[0]?.message ?? "Invalid permission.");
	}

	const [module, action] = validation.data.key.split(".");
	const response = await fetch(`${getStrapiBaseUrl()}/api/superadmin/permissions`, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			"x-portal-internal-secret": getInternalSecret(),
		},
		body: JSON.stringify({
			...validation.data,
			module: validation.data.module || module,
			action: validation.data.action || action,
		}),
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(await parseError(response, "Unable to create permission."));
	}

	return response.json() as Promise<{ permission: GlobalPermission }>;
}
