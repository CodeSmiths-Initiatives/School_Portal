const internalNotificationRoutes = {
	routes: [
		{
			method: "GET",
			path: "/internal/notifications",
			handler: "internal-notification.list",
			config: { auth: false },
		},
		{
			method: "POST",
			path: "/internal/notifications",
			handler: "internal-notification.create",
			config: { auth: false },
		},
		{
			method: "POST",
			path: "/internal/notifications/read-all",
			handler: "internal-notification.markAllRead",
			config: { auth: false },
		},
		{
			method: "PATCH",
			path: "/internal/notifications/:id",
			handler: "internal-notification.update",
			config: { auth: false },
		},
		{
			method: "POST",
			path: "/internal/notifications/:id/read",
			handler: "internal-notification.markRead",
			config: { auth: false },
		},
	],
};

export default internalNotificationRoutes;
