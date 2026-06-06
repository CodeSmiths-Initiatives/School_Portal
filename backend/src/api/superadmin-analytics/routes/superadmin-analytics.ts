export default {
	routes: [
		{
			method: "POST",
			path: "/superadmin/audit-events",
			handler: "superadmin-analytics.recordAudit",
			config: {
				auth: false,
			},
		},
		{
			method: "GET",
			path: "/superadmin/reports",
			handler: "superadmin-analytics.reports",
			config: {
				auth: false,
			},
		},
		{
			method: "GET",
			path: "/superadmin/audit",
			handler: "superadmin-analytics.audit",
			config: {
				auth: false,
			},
		},
	],
};
