export default {
	routes: [
		{
			method: "POST",
			path: "/auth/register-student-portal",
			handler: "portal-registration.registerStudent",
			config: {
				auth: false,
			},
		},
	],
};
