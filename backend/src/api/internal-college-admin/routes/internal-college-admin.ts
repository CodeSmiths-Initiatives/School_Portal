export default {
	routes: [
		{
			method: "GET",
			path: "/internal/college-admin/students",
			handler: "internal-college-admin.students",
			config: { auth: false },
		},
		{
			method: "GET",
			path: "/internal/college-admin/roles",
			handler: "internal-college-admin.roles",
			config: { auth: false },
		},
		{
			method: "POST",
			path: "/internal/college-admin/roles",
			handler: "internal-college-admin.createRole",
			config: { auth: false },
		},
		{
			method: "PATCH",
			path: "/internal/college-admin/roles/:id",
			handler: "internal-college-admin.updateRole",
			config: { auth: false },
		},
		{
			method: "GET",
			path: "/internal/college-admin/reports",
			handler: "internal-college-admin.reports",
			config: { auth: false },
		},
	],
};
