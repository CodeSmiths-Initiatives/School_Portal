type StrapiContext = {
	params?: Record<string, string | undefined>;
	request: {
		body?: unknown;
		header: Record<string, string | undefined>;
	};
	unauthorized: (message?: string) => unknown;
	badRequest: (message?: string) => unknown;
	notFound: (message?: string) => unknown;
	conflict: (message?: string) => unknown;
	body: unknown;
};

type PermissionPayload = {
	key?: unknown;
	module?: unknown;
	action?: unknown;
	label?: unknown;
	description?: unknown;
};

type RolePermissionPayload = {
	permissionKeys?: unknown;
};

const DEV_INTERNAL_SECRET = "iums-local-registration-secret-change-before-production";
const GLOBAL_ROLE_CODES = ["platform-college-admin", "platform-student"] as const;

function getInternalSecret() {
	const configured =
		process.env.PORTAL_INTERNAL_API_SECRET ?? process.env.PORTAL_REGISTRATION_SECRET;

	if (configured) {
		return configured;
	}

	if (process.env.NODE_ENV === "production") {
		return null;
	}

	return DEV_INTERNAL_SECRET;
}

function getHeader(ctx: StrapiContext, name: string) {
	const lowerName = name.toLowerCase();
	return ctx.request.header[lowerName] ?? ctx.request.header[name];
}

function authorize(ctx: StrapiContext) {
	const expectedSecret = getInternalSecret();
	const providedSecret = getHeader(ctx, "x-portal-internal-secret");

	return Boolean(expectedSecret && providedSecret === expectedSecret);
}

function toText(value: unknown) {
	return typeof value === "string" ? value.trim() : "";
}

function normalizePermissionKey(value: string) {
	return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function parsePermissionPayload(body: unknown) {
	const payload = (body ?? {}) as PermissionPayload;
	const module = normalizePermissionKey(toText(payload.module));
	const action = normalizePermissionKey(toText(payload.action));
	const explicitKey = normalizePermissionKey(toText(payload.key));
	const key = explicitKey || (module && action ? `${module}.${action}` : "");
	const [keyModule = "", keyAction = ""] = key.split(".");

	return {
		key,
		module: module || keyModule,
		action: action || keyAction,
		label: toText(payload.label),
		description: toText(payload.description),
	};
}

function parsePermissionKeys(body: unknown) {
	const payload = (body ?? {}) as RolePermissionPayload;

	return Array.isArray(payload.permissionKeys)
		? payload.permissionKeys
				.map((key) => (typeof key === "string" ? key.trim() : ""))
				.filter(Boolean)
		: [];
}

function isGlobalRoleCode(code: string) {
	return GLOBAL_ROLE_CODES.includes(code as (typeof GLOBAL_ROLE_CODES)[number]);
}

function serializePermission(permission: Record<string, unknown>) {
	return {
		id: permission.id,
		key: permission.key,
		module: permission.module,
		action: permission.action,
		label: permission.label,
		description: permission.description,
	};
}

function serializeRole(role: Record<string, unknown>) {
	const permissions = Array.isArray(role.permissions) ? role.permissions : [];

	return {
		id: role.id,
		name: role.name,
		code: role.code,
		description: role.description,
		roleType: role.roleType,
		tenantScope: role.tenantScope,
		scopeType: role.scopeType,
		permissions: permissions.map((permission) =>
			serializePermission(permission as Record<string, unknown>),
		),
	};
}

async function findPermissionsByKeys(keys: string[]) {
	if (!keys.length) {
		return [];
	}

	return strapi.db.query("api::permission.permission").findMany({
		where: { key: { $in: keys } },
		orderBy: [{ module: "asc" }, { action: "asc" }],
	});
}

export default {
	async listGlobalRoles(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Global role management is not authorized.");
		}

		const [roles, permissions] = await Promise.all([
			strapi.db.query("api::portal-role.portal-role").findMany({
				where: { code: { $in: [...GLOBAL_ROLE_CODES] } },
				populate: { permissions: true },
				orderBy: { name: "asc" },
			}),
			strapi.db.query("api::permission.permission").findMany({
				orderBy: [{ module: "asc" }, { action: "asc" }],
			}),
		]);

		ctx.body = {
			roles: roles.map((role: Record<string, unknown>) => serializeRole(role)),
			permissions: permissions.map((permission: Record<string, unknown>) =>
				serializePermission(permission),
			),
		};
	},

	async updateGlobalRole(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Global role management is not authorized.");
		}

		const roleCode = String(ctx.params?.code ?? "").trim();

		if (!isGlobalRoleCode(roleCode)) {
			return ctx.notFound("Only global student and college admin roles can be updated here.");
		}

		const permissionKeys = parsePermissionKeys(ctx.request.body);
		const permissions = await findPermissionsByKeys(permissionKeys);

		if (permissions.length !== permissionKeys.length) {
			return ctx.badRequest("One or more selected permissions could not be found.");
		}

		const role = await strapi.db.query("api::portal-role.portal-role").findOne({
			where: { code: roleCode },
		});

		if (!role?.id) {
			return ctx.notFound("Global role template was not found.");
		}

		const updatedRole = await strapi.db.query("api::portal-role.portal-role").update({
			where: { id: role.id },
			data: {
				permissions: permissions
					.map((permission: { id?: number }) => permission.id)
					.filter((id: unknown): id is number => typeof id === "number"),
			},
			populate: { permissions: true },
		});

		ctx.body = {
			role: serializeRole(updatedRole),
		};
	},

	async createPermission(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Global role management is not authorized.");
		}

		const payload = parsePermissionPayload(ctx.request.body);

		if (!payload.key.includes(".") || !payload.module || !payload.action || !payload.label) {
			return ctx.badRequest(
				"Permission key must use module.action and include a label.",
			);
		}

		const existing = await strapi.db.query("api::permission.permission").findOne({
			where: { key: payload.key },
		});

		if (existing?.id) {
			return ctx.conflict("A permission with this key already exists.");
		}

		const permission = await strapi.db.query("api::permission.permission").create({
			data: {
				key: payload.key,
				module: payload.module,
				action: payload.action,
				label: payload.label,
				description: payload.description || undefined,
			},
		});

		ctx.body = {
			permission: serializePermission(permission),
		};
	},
};
