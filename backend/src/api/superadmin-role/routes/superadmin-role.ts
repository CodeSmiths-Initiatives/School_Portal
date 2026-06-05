export default {
	routes: [
		{
			method: "GET",
			path: "/superadmin/global-roles",
			handler: "superadmin-role.listGlobalRoles",
			config: {
				auth: false,
			},
		},
		{
			method: "PATCH",
			path: "/superadmin/global-roles/:code",
			handler: "superadmin-role.updateGlobalRole",
			config: {
				auth: false,
			},
		},
		{
			method: "POST",
			path: "/superadmin/permissions",
			handler: "superadmin-role.createPermission",
			config: {
				auth: false,
			},
		},
	],
};
