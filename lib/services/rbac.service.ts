import {
	STRAPI_ENDPOINTS,
	asRelationArray,
	asString,
	getRelationId,
	strapiGet,
	unwrapStrapiCollection,
	type StrapiCollectionResponse,
	type StrapiRequestOptions,
} from "@/lib/api";
import type {
	PermissionDefinition,
	PermissionKey,
	RoleDefinition,
	RoleScopeType,
	TenantScopeType,
	UserPermissionKey,
} from "@/lib/rbac";

type StrapiPermission = {
	key?: unknown;
	module?: unknown;
	action?: unknown;
	label?: unknown;
	description?: unknown;
};

type StrapiPortalRole = {
	name?: unknown;
	code?: unknown;
	description?: unknown;
	roleType?: unknown;
	tenantScope?: unknown;
	scopeType?: unknown;
	college?: unknown;
	permissions?: unknown;
};

type UnwrappedPermission = ReturnType<typeof unwrapStrapiCollection<StrapiPermission>>[number];
type UnwrappedPortalRole = ReturnType<typeof unwrapStrapiCollection<StrapiPortalRole>>[number];

function toPermission(permission: UnwrappedPermission): PermissionDefinition {
	return {
		key: asString(permission.key) as PermissionKey,
		module: asString(permission.module),
		action: asString(permission.action),
		label: asString(permission.label),
		description: asString(permission.description) || undefined,
	};
}

function toPermissionKeys(value: unknown): UserPermissionKey[] {
	return asRelationArray(value)
		.map((item) => {
			if (item && typeof item === "object" && "key" in item) {
				return (item as { key?: unknown }).key;
			}
			return undefined;
		})
		.filter((key): key is PermissionKey => typeof key === "string" && key.includes("."));
}

function toRole(role: UnwrappedPortalRole): RoleDefinition {
	return {
		id: role.id,
		name: asString(role.name),
		description: asString(role.description) || undefined,
		scopeType: asString(role.scopeType, "college") as RoleScopeType,
		tenantScope: asString(role.tenantScope, "college") as TenantScopeType,
		isSystem: asString(role.roleType) === "system",
		collegeId: getRelationId(role.college),
		permissions: toPermissionKeys(role.permissions),
	};
}

export async function getPermissions(options?: StrapiRequestOptions) {
	const response = await strapiGet<StrapiCollectionResponse<StrapiPermission>>(
		STRAPI_ENDPOINTS.permissions,
		{
			...options,
			query: {
				sort: ["module:asc", "action:asc"],
				pagination: { page: 1, pageSize: 200 },
				...options?.query,
			},
		},
	);

	return unwrapStrapiCollection(response.data).map(toPermission);
}

export async function getPortalRoles(options?: StrapiRequestOptions) {
	const response = await strapiGet<StrapiCollectionResponse<StrapiPortalRole>>(
		STRAPI_ENDPOINTS.portalRoles,
		{
			...options,
			query: {
				populate: { college: true, permissions: true },
				sort: ["tenantScope:asc", "name:asc"],
				pagination: { page: 1, pageSize: 100 },
				...options?.query,
			},
		},
	);

	return unwrapStrapiCollection(response.data).map(toRole);
}

export async function getCollegeRoles(
	collegeDocumentId: string,
	options?: StrapiRequestOptions,
) {
	return getPortalRoles({
		...options,
		query: {
			filters: { college: { documentId: { $eq: collegeDocumentId } } },
			...options?.query,
		},
	});
}
