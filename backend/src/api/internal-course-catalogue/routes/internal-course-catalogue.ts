export default {
	routes: [
		{
			method: "GET",
			path: "/internal/course-catalogue",
			handler: "internal-course-catalogue.list",
			config: { auth: false },
		},
		{
			method: "POST",
			path: "/internal/course-catalogue",
			handler: "internal-course-catalogue.create",
			config: { auth: false },
		},
		{
			method: "PATCH",
			path: "/internal/course-catalogue/:id",
			handler: "internal-course-catalogue.update",
			config: { auth: false },
		},
		{
			method: "DELETE",
			path: "/internal/course-catalogue/:id",
			handler: "internal-course-catalogue.delete",
			config: { auth: false },
		},
	],
};
