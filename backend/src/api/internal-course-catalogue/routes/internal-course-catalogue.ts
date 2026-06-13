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
			path: "/internal/course-catalogue/:id/status",
			handler: "internal-course-catalogue.updateStatus",
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
		{
			method: "GET",
			path: "/internal/course-timetable",
			handler: "internal-course-catalogue.listTimetable",
			config: { auth: false },
		},
		{
			method: "POST",
			path: "/internal/course-timetable",
			handler: "internal-course-catalogue.createTimetableSlot",
			config: { auth: false },
		},
		{
			method: "PATCH",
			path: "/internal/course-timetable/:id",
			handler: "internal-course-catalogue.updateTimetableSlot",
			config: { auth: false },
		},
		{
			method: "DELETE",
			path: "/internal/course-timetable/:id",
			handler: "internal-course-catalogue.deleteTimetableSlot",
			config: { auth: false },
		},
		{
			method: "POST",
			path: "/internal/course-allocations",
			handler: "internal-course-catalogue.createAllocation",
			config: { auth: false },
		},
		{
			method: "PATCH",
			path: "/internal/course-allocations",
			handler: "internal-course-catalogue.updateAllocation",
			config: { auth: false },
		},
		{
			method: "DELETE",
			path: "/internal/course-allocations",
			handler: "internal-course-catalogue.deleteAllocation",
			config: { auth: false },
		},
	],
};
