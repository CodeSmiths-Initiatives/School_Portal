export default {
	routes: [
		{
			method: "GET",
			path: "/auth/portal-session",
			handler: "portal-session.me",
			config: {
				auth: false,
			},
		},
	],
};
