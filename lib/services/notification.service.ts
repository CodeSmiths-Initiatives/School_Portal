const DEV_INTERNAL_SECRET =
	"iums-local-registration-secret-change-before-production";

export type AppNotificationScope = "platform" | "college";
export type AppNotificationAudience =
	| "all"
	| "students"
	| "staff"
	| "college-admins"
	| "specific-admin"
	| "specific-user";
export type AppNotificationSeverity = "info" | "success" | "warning" | "critical";
export type AppNotificationStatus =
	| "draft"
	| "scheduled"
	| "active"
	| "expired"
	| "archived";

export type AppNotification = {
	id: string;
	documentId?: string;
	numericId?: number | string;
	title: string;
	message: string;
	scope: AppNotificationScope;
	audience: AppNotificationAudience;
	severity: AppNotificationSeverity;
	status: AppNotificationStatus;
	startAt: string | null;
	endAt: string | null;
	publishedAt: string | null;
	createdAt: string | null;
	updatedAt: string | null;
	college: {
		id: number | string;
		name: string;
		slug: string;
		code: string;
	} | null;
	targetUser: {
		id: number | string;
		username: string;
		email: string;
	} | null;
	createdBy: {
		id: number | string;
		username: string;
		email: string;
	} | null;
	receipt: {
		id: number | string;
		readAt: string | null;
		dismissedAt: string | null;
	} | null;
	isRead: boolean;
};

export type AppNotificationListPayload = {
	notifications: AppNotification[];
	meta: {
		page: number;
		pageSize: number;
		total: number;
		unread: number;
		generatedAt: string;
	};
};

export type AppNotificationCreateInput = {
	title: string;
	message: string;
	scope: AppNotificationScope;
	audience: AppNotificationAudience;
	severity?: AppNotificationSeverity;
	status?: AppNotificationStatus;
	startAt?: string;
	endAt?: string;
	collegeSlug?: string;
	targetUserId?: number | string;
	targetRoleId?: number | string;
	targetFacultyId?: number | string;
	targetDepartmentId?: number | string;
	idempotencyKey?: string;
	metadata?: Record<string, unknown>;
};

export type AppNotificationViewer = {
	userId: number | string;
	domain: "student" | "staff" | "admin" | "superadmin";
	roleCode?: string;
	collegeSlug?: string;
};

export type AppNotificationActor = {
	id?: number | string;
	name?: string;
	email?: string;
	role?: string;
};

function getStrapiBaseUrl() {
	return (
		process.env.STRAPI_API_URL ??
		process.env.NEXT_PUBLIC_STRAPI_API_URL ??
		"http://localhost:1337"
	).replace(/\/$/, "");
}

function getInternalSecret() {
	const configured =
		process.env.PORTAL_INTERNAL_API_SECRET ?? process.env.PORTAL_REGISTRATION_SECRET;

	if (configured) return configured;

	if (process.env.NODE_ENV === "production") {
		throw new Error("PORTAL_INTERNAL_API_SECRET is required in production.");
	}

	return DEV_INTERNAL_SECRET;
}

function toId(value: number | string | undefined) {
	if (typeof value === "number") return String(value);
	return value ?? "";
}

async function parseError(response: Response, fallback: string) {
	const payload = (await response.json().catch(() => null)) as
		| { error?: { message?: string }; message?: string }
		| null;

	return payload?.error?.message ?? payload?.message ?? fallback;
}

async function internalFetch<T>(
	path: string,
	options?: {
		method?: "GET" | "POST";
		body?: unknown;
	},
) {
	const response = await fetch(`${getStrapiBaseUrl()}${path}`, {
		method: options?.method ?? "GET",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			"x-portal-internal-secret": getInternalSecret(),
		},
		body: options?.body ? JSON.stringify(options.body) : undefined,
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(await parseError(response, "Notification request failed."));
	}

	return response.json() as Promise<T>;
}

function appendViewerParams(
	params: URLSearchParams,
	viewer: AppNotificationViewer,
) {
	params.set("viewerUserId", toId(viewer.userId));
	params.set("viewerDomain", viewer.domain);

	if (viewer.roleCode) params.set("viewerRoleCode", viewer.roleCode);
	if (viewer.collegeSlug) params.set("collegeSlug", viewer.collegeSlug);
}

export async function listAppNotifications(input: {
	viewer: AppNotificationViewer;
	status?: "visible" | "all" | AppNotificationStatus;
	page?: number;
	pageSize?: number;
	includeDismissed?: boolean;
}) {
	const params = new URLSearchParams();
	appendViewerParams(params, input.viewer);

	if (input.status) params.set("status", input.status);
	if (input.page) params.set("page", String(input.page));
	if (input.pageSize) params.set("pageSize", String(input.pageSize));
	if (input.includeDismissed) params.set("includeDismissed", "true");

	return internalFetch<AppNotificationListPayload>(
		`/api/internal/notifications?${params.toString()}`,
	);
}

export async function createAppNotification(input: {
	notification: AppNotificationCreateInput;
	actor: AppNotificationActor;
}) {
	return internalFetch<{
		notification: AppNotification;
		idempotent: boolean;
	}>("/api/internal/notifications", {
		method: "POST",
		body: {
			...input.notification,
			createdById: input.actor.id,
			actorName: input.actor.name,
			actorEmail: input.actor.email,
			actorRole: input.actor.role,
		},
	});
}

export async function markAppNotificationRead(input: {
	notificationId: string;
	viewer: AppNotificationViewer;
}) {
	return internalFetch<{
		ok: true;
		notification: AppNotification;
	}>(`/api/internal/notifications/${encodeURIComponent(input.notificationId)}/read`, {
		method: "POST",
		body: {
			viewerUserId: input.viewer.userId,
			viewerDomain: input.viewer.domain,
			viewerRoleCode: input.viewer.roleCode,
			collegeSlug: input.viewer.collegeSlug,
		},
	});
}

export async function markAllAppNotificationsRead(input: {
	viewer: AppNotificationViewer;
}) {
	return internalFetch<{
		ok: true;
		updated: number;
		readAt: string;
	}>("/api/internal/notifications/read-all", {
		method: "POST",
		body: {
			viewerUserId: input.viewer.userId,
			viewerDomain: input.viewer.domain,
			viewerRoleCode: input.viewer.roleCode,
			collegeSlug: input.viewer.collegeSlug,
		},
	});
}
