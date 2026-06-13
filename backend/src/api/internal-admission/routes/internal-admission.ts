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
		{
			method: "POST",
			path: "/internal/admission-applications",
			handler: "internal-admission.create",
			config: {
				auth: false,
			},
		},
		{
			method: "PUT",
			path: "/internal/admission-applications/:id",
			handler: "internal-admission.update",
			config: {
				auth: false,
			},
		},
	],
};
