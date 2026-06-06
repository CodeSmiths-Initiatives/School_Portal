export default {
	routes: [
		{
			method: "GET",
			path: "/superadmin/colleges",
			handler: "superadmin-college.listColleges",
			config: {
				auth: false,
			},
		},
		{
			method: "POST",
			path: "/superadmin/colleges",
			handler: "superadmin-college.provisionCollege",
			config: {
				auth: false,
			},
		},
		{
			method: "PATCH",
			path: "/superadmin/colleges/:id",
			handler: "superadmin-college.updateCollege",
			config: {
				auth: false,
			},
		},
	],
};
