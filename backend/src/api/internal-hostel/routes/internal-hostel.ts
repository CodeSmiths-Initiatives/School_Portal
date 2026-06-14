export default {
	routes: [
		{
			method: "GET",
			path: "/internal/hostels",
			handler: "internal-hostel.list",
			config: { auth: false },
		},
		{
			method: "POST",
			path: "/internal/hostels",
			handler: "internal-hostel.createHostel",
			config: { auth: false },
		},
		{
			method: "POST",
			path: "/internal/hostel-rooms",
			handler: "internal-hostel.createRoom",
			config: { auth: false },
		},
		{
			method: "PATCH",
			path: "/internal/hostel-beds/:id",
			handler: "internal-hostel.updateBed",
			config: { auth: false },
		},
		{
			method: "POST",
			path: "/internal/hostel-reservations",
			handler: "internal-hostel.reserve",
			config: { auth: false },
		},
		{
			method: "POST",
			path: "/internal/hostel-complaints",
			handler: "internal-hostel.createComplaint",
			config: { auth: false },
		},
		{
			method: "PATCH",
			path: "/internal/hostel-complaints/:id",
			handler: "internal-hostel.updateComplaint",
			config: { auth: false },
		},
	],
};
