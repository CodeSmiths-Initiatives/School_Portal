export default {
	routes: [
		{
			method: "GET",
			path: "/internal/student-admission-profile",
			handler: "internal-student-admission-profile.find",
			config: {
				auth: false,
			},
		},
		{
			method: "PATCH",
			path: "/internal/student-admission-profile/step",
			handler: "internal-student-admission-profile.saveStep",
			config: {
				auth: false,
			},
		},
		{
			method: "POST",
			path: "/internal/student-admission-profile/submit",
			handler: "internal-student-admission-profile.submit",
			config: {
				auth: false,
			},
		},
	],
};
