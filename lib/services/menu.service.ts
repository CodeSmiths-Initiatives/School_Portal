import type { DashboardDomain } from "@/lib/auth";
import {
	STRAPI_ENDPOINTS,
	asRelationArray,
	asString,
	asStringArray,
	strapiGet,
	unwrapStrapiCollection,
	type StrapiCollectionResponse,
	type StrapiRequestOptions,
} from "@/lib/api";
import type { MenuItemDefinition, PermissionKey } from "@/lib/rbac";

type StrapiMenuItem = {
	key?: unknown;
	label?: unknown;
	href?: unknown;
	icon?: unknown;
	order?: unknown;
	domains?: unknown;
	isActive?: unknown;
	requiredPermissions?: unknown;
};

type UnwrappedMenuItem = ReturnType<typeof unwrapStrapiCollection<StrapiMenuItem>>[number];

type MenuItemWithOrder = MenuItemDefinition & {
	order: number;
	isActive: boolean;
};

function toPermissionKeys(value: unknown): PermissionKey[] {
	return asRelationArray(value)
		.map((item) => {
			if (item && typeof item === "object" && "key" in item) {
				return (item as { key?: unknown }).key;
			}
			return undefined;
		})
		.filter((key): key is PermissionKey => typeof key === "string" && key.includes("."));
}

function toMenuItem(item: UnwrappedMenuItem): MenuItemWithOrder {
	return {
		key: asString(item.key),
		label: asString(item.label),
		href: asString(item.href, "/dashboard"),
		icon: asString(item.icon, "LayoutDashboard"),
		order: typeof item.order === "number" ? item.order : 0,
		isActive: item.isActive !== false,
		domains: asStringArray(item.domains) as DashboardDomain[],
		requiredPermissions: toPermissionKeys(item.requiredPermissions),
	};
}

export async function getMenuItems(options?: StrapiRequestOptions) {
	const response = await strapiGet<StrapiCollectionResponse<StrapiMenuItem>>(
		STRAPI_ENDPOINTS.menuItems,
		{
			...options,
			query: {
				populate: { requiredPermissions: true },
				sort: ["order:asc", "label:asc"],
				pagination: { page: 1, pageSize: 100 },
				...options?.query,
			},
		},
	);

	return unwrapStrapiCollection(response.data)
		.map(toMenuItem)
		.filter((item) => item.isActive)
		.sort((a, b) => a.order - b.order);
}

export async function getMenuItemsForDomain(
	domain: DashboardDomain,
	options?: StrapiRequestOptions,
) {
	const menuItems = await getMenuItems(options);
	return menuItems.filter((item) => item.domains.includes(domain));
}
