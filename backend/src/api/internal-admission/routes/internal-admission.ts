export default {
	routes: [
		{
			method: "GET",
			path: "/internal/admission-applications",
			handler: "internal-admission.list",
			config: {
				auth: false,
			},
		},
	],
};
