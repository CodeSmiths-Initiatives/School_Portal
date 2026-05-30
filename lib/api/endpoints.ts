export const STRAPI_ENDPOINTS = {
	health: "/_health",
	colleges: "/api/colleges",
	permissions: "/api/permissions",
	menuItems: "/api/menu-items",
	portalRoles: "/api/portal-roles",
} as const;

export type StrapiEndpointKey = keyof typeof STRAPI_ENDPOINTS;
