type StrapiContext = {
	params?: Record<string, string | undefined>;
	request: {
		body?: unknown;
		header: Record<string, string | undefined>;
		query?: Record<string, string | undefined>;
	};
	unauthorized: (message?: string) => unknown;
	badRequest: (message?: string) => unknown;
	notFound: (message?: string) => unknown;
	body: unknown;
	status?: number;
};

type NotificationAudience =
	| "all"
	| "students"
	| "staff"
	| "college-admins"
	| "specific-admin"
	| "specific-user";
type NotificationSeverity = "info" | "success" | "warning" | "critical";
type NotificationStatus = "draft" | "scheduled" | "active" | "expired" | "archived";
type NotificationReadState = "all" | "read" | "unread";

const DEV_INTERNAL_SECRET =
	"iums-local-registration-secret-change-before-production";
const AUDIENCES: NotificationAudience[] = [
	"all",
	"students",
	"staff",
	"college-admins",
	"specific-admin",
	"specific-user",
];
const SEVERITIES: NotificationSeverity[] = ["info", "success", "warning", "critical"];
const READ_STATES: NotificationReadState[] = ["all", "read", "unread"];
const STATUSES: NotificationStatus[] = [
	"draft",
	"scheduled",
	"active",
	"expired",
	"archived",
];

function getInternalSecret() {
	const configured =
		process.env.PORTAL_INTERNAL_API_SECRET ?? process.env.PORTAL_REGISTRATION_SECRET;

	if (configured) return configured;
	if (process.env.NODE_ENV === "production") return null;

	return DEV_INTERNAL_SECRET;
}

function getHeader(ctx: StrapiContext, name: string) {
	const lowerName = name.toLowerCase();
	return ctx.request.header[lowerName] ?? ctx.request.header[name];
}

function authorize(ctx: StrapiContext) {
	const expectedSecret = getInternalSecret();
	const providedSecret = getHeader(ctx, "x-portal-internal-secret");

	return Boolean(expectedSecret && providedSecret === expectedSecret);
}

function asString(value: unknown, fallback = "") {
	return typeof value === "string" ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback = 0) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : fallback;
	}
	return fallback;
}

function asRecord(value: unknown) {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function normalizeEnum<T extends string>(
	value: unknown,
	options: readonly T[],
	fallback: T,
) {
	const text = asString(value);
	return options.includes(text as T) ? (text as T) : fallback;
}

function normalizeAudience(value: unknown) {
	const text = asString(value).toLowerCase();

	if (["admin", "admins", "college-admin", "college-admins"].includes(text)) {
		return "college-admins";
	}

	return normalizeEnum(text, AUDIENCES, "all");
}

function normalizeDomain(value: unknown) {
	const text = asString(value).toLowerCase();

	if (["student", "staff", "admin", "superadmin"].includes(text)) {
		return text;
	}

	return "";
}

function getAudienceForDomain(domain: string): NotificationAudience | null {
	if (domain === "student") return "students";
	if (domain === "staff") return "staff";
	if (domain === "admin") return "college-admins";

	return null;
}

function parseDate(value: unknown) {
	const text = asString(value);
	const date = new Date(text);
	return text && !Number.isNaN(date.getTime()) ? date : null;
}

function isCurrentlyVisible(notification: Record<string, unknown>, now: Date) {
	const status = asString(notification.status);
	const startAt = parseDate(notification.startAt);
	const endAt = parseDate(notification.endAt);

	return (
		status === "active" &&
		(!startAt || startAt <= now) &&
		(!endAt || endAt >= now)
	);
}

function getEntityId(entity: Record<string, unknown>) {
	return asString(entity.documentId) || String(entity.id ?? "");
}

function sameNumericId(left: unknown, right: unknown) {
	const leftId = asNumber(left);
	const rightId = asNumber(right);

	return Boolean(leftId && rightId && leftId === rightId);
}

function isVisibleToViewer(
	notification: Record<string, unknown>,
	viewer: {
		userId: number;
		domain: string;
		roleCode?: string;
		collegeId?: number;
	},
) {
	const scope = asString(notification.scope);
	const audience = normalizeAudience(notification.audience);
	const targetUser = asRecord(notification.targetUser);
	const targetRole = asRecord(notification.targetRole);
	const college = asRecord(notification.college);
	const domainAudience = getAudienceForDomain(viewer.domain);

	if (scope === "college" && !sameNumericId(college.id, viewer.collegeId)) {
		return false;
	}

	if (scope === "platform" && viewer.domain !== "superadmin" && !viewer.userId) {
		return false;
	}

	if (audience === "all") return true;
	if (domainAudience && audience === domainAudience) return true;
	if (audience === "specific-admin") {
		return viewer.domain === "admin" && sameNumericId(targetUser.id, viewer.userId);
	}
	if (audience === "specific-user") {
		return sameNumericId(targetUser.id, viewer.userId);
	}
	if (viewer.roleCode && asString(targetRole.code) === viewer.roleCode) {
		return true;
	}

	return false;
}

function mapCollege(college: Record<string, unknown>) {
	if (!college.id) return null;

	return {
		id: college.id,
		name: asString(college.name),
		slug: asString(college.slug),
		code: asString(college.code),
	};
}

function mapUser(user: Record<string, unknown>) {
	if (!user.id) return null;

	return {
		id: user.id,
		username: asString(user.username),
		email: asString(user.email),
	};
}

function mapReceipt(receipt: Record<string, unknown>) {
	if (!receipt.id) return null;

	return {
		id: receipt.id,
		readAt: asString(receipt.readAt) || null,
		dismissedAt: asString(receipt.dismissedAt) || null,
	};
}

function mapNotification(
	notification: Record<string, unknown>,
	receipt?: Record<string, unknown> | null,
) {
	return {
		id: getEntityId(notification),
		documentId: asString(notification.documentId) || undefined,
		numericId: notification.id,
		title: asString(notification.title),
		message: asString(notification.message),
		scope: asString(notification.scope),
		audience: normalizeAudience(notification.audience),
		severity: asString(notification.severity),
		status: asString(notification.status),
		startAt: asString(notification.startAt) || null,
		endAt: asString(notification.endAt) || null,
		publishedAt: asString(notification.publishedAt) || null,
		createdAt: asString(notification.createdAt) || null,
		updatedAt: asString(notification.updatedAt) || null,
		college: mapCollege(asRecord(notification.college)),
		targetUser: mapUser(asRecord(notification.targetUser)),
		createdBy: mapUser(asRecord(notification.createdBy)),
		receipt: receipt ? mapReceipt(receipt) : null,
		isRead: Boolean(receipt?.readAt),
	};
}

async function findCollegeBySlug(collegeSlug: string) {
	if (!collegeSlug) return null;

	return strapi.db.query("api::college.college").findOne({
		where: { slug: collegeSlug },
	});
}

async function findNotificationByIdentifier(id: string) {
	return strapi.db.query("api::app-notification.app-notification").findOne({
		where: {
			$or: [{ documentId: id }, { id: asNumber(id) }],
		},
		populate: {
			college: true,
			targetUser: true,
			targetRole: true,
			createdBy: true,
		},
	});
}

async function getReceiptsForUser(userId: number) {
	if (!userId) return [];

	return strapi.db
		.query("api::app-notification-receipt.app-notification-receipt")
		.findMany({
			where: { user: userId },
			populate: { notification: true },
			orderBy: { updatedAt: "desc" },
			limit: 250,
		});
}

function receiptKey(receipt: Record<string, unknown>) {
	const notification = asRecord(receipt.notification);
	return String(notification.id ?? "");
}

async function findReceipt(notificationId: number, userId: number) {
	return strapi.db
		.query("api::app-notification-receipt.app-notification-receipt")
		.findOne({
			where: {
				notification: notificationId,
				user: userId,
			},
		});
}

async function upsertReadReceipt(input: {
	notification: Record<string, unknown>;
	userId: number;
	collegeId?: number;
	readAt: string;
}) {
	const notificationId = asNumber(input.notification.id);

	if (!notificationId || !input.userId) return null;

	const existing = await findReceipt(notificationId, input.userId);

	if (existing?.id) {
		if (existing.readAt) return existing;

		return strapi.db
			.query("api::app-notification-receipt.app-notification-receipt")
			.update({
				where: { id: existing.id },
				data: { readAt: input.readAt },
			});
	}

	return strapi.db
		.query("api::app-notification-receipt.app-notification-receipt")
		.create({
			data: {
				notification: notificationId,
				user: input.userId,
				readAt: input.readAt,
				...(input.collegeId ? { college: input.collegeId } : {}),
			},
		});
}

async function createAuditLog(input: {
	action: string;
	eventType?: "created" | "updated" | "deleted" | "login" | "exported" | "settings" | "payment";
	actorId?: number;
	actorName?: string;
	actorEmail?: string;
	actorRole?: string;
	collegeId?: number;
	entityId?: string;
	targetLabel: string;
	summary: string;
	metadata?: Record<string, unknown>;
}) {
	try {
		await strapi.db.query("api::audit-log.audit-log").create({
			data: {
				action: input.action,
				eventType: input.eventType ?? "created",
				actorName: input.actorName,
				actorEmail: input.actorEmail,
				actorRole: input.actorRole,
				entityType: "app-notification",
				entityId: input.entityId,
				targetLabel: input.targetLabel,
				summary: input.summary,
				metadata: input.metadata ?? {},
				occurredAt: new Date().toISOString(),
				...(input.actorId ? { actor: input.actorId } : {}),
				...(input.collegeId ? { college: input.collegeId } : {}),
			},
		});
	} catch (error) {
		strapi.log.warn(
			`[internal-notification] Audit write failed: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		);
	}
}

function parseCreatePayload(body: unknown) {
	const payload = asRecord(body);
	const scope = normalizeEnum(payload.scope, ["platform", "college"] as const, "college");
	const status = normalizeEnum(payload.status, STATUSES, "draft");
	const startAt = asString(payload.startAt) || null;
	const endAt = asString(payload.endAt) || null;

	return {
		title: asString(payload.title),
		message: asString(payload.message),
		scope,
		audience: normalizeAudience(payload.audience),
		severity: normalizeEnum(payload.severity, SEVERITIES, "info"),
		status,
		startAt,
		endAt,
		publishedAt:
			status === "active"
				? asString(payload.publishedAt) || new Date().toISOString()
				: asString(payload.publishedAt) || null,
		collegeSlug: asString(payload.collegeSlug),
		targetUserId: asNumber(payload.targetUserId),
		targetRoleId: asNumber(payload.targetRoleId),
		targetFacultyId: asNumber(payload.targetFacultyId),
		targetDepartmentId: asNumber(payload.targetDepartmentId),
		createdById: asNumber(payload.createdById),
		idempotencyKey: asString(payload.idempotencyKey),
		actorName: asString(payload.actorName),
		actorEmail: asString(payload.actorEmail),
		actorRole: asString(payload.actorRole),
		metadata: asRecord(payload.metadata),
	};
}

function withActorMetadata(
	metadata: Record<string, unknown>,
	actor: {
		id?: number;
		name?: string;
		email?: string;
		role?: string;
	},
) {
	return {
		...metadata,
		actor: {
			...(asRecord(metadata.actor)),
			...(actor.id ? { id: actor.id } : {}),
			...(actor.name ? { name: actor.name } : {}),
			...(actor.email ? { email: actor.email } : {}),
			...(actor.role ? { role: actor.role } : {}),
		},
	};
}

function parseUpdatePayload(body: unknown) {
	const payload = asRecord(body);
	const status = asString(payload.status);

	return {
		title: asString(payload.title),
		message: asString(payload.message),
		audience: asString(payload.audience),
		severity: asString(payload.severity),
		status: STATUSES.includes(status as NotificationStatus)
			? (status as NotificationStatus)
			: "",
		startAt: asString(payload.startAt),
		endAt: asString(payload.endAt),
		publishedAt: asString(payload.publishedAt),
		actorId: asNumber(payload.actorId),
		actorName: asString(payload.actorName),
		actorEmail: asString(payload.actorEmail),
		actorRole: asString(payload.actorRole),
		managerDomain: normalizeDomain(payload.managerDomain),
		managerCollegeSlug: asString(payload.managerCollegeSlug),
	};
}

function parseViewer(query: Record<string, string | undefined>) {
	return {
		userId: asNumber(query.viewerUserId),
		domain: normalizeDomain(query.viewerDomain),
		roleCode: asString(query.viewerRoleCode),
		collegeSlug: asString(query.collegeSlug),
		status: asString(query.status),
		page: Math.max(asNumber(query.page, 1), 1),
		pageSize: Math.min(Math.max(asNumber(query.pageSize, 20), 1), 50),
		query: asString(query.q).toLowerCase(),
		severity: normalizeEnum(query.severity, ["all", ...SEVERITIES] as const, "all"),
		readState: normalizeEnum(query.readState, READ_STATES, "all"),
		includeDismissed: query.includeDismissed === "true",
		manage: query.manage === "true",
	};
}

const internalNotificationController = {
	async list(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Notification access is not authorized.");
		}

		const viewer = parseViewer(ctx.request.query ?? {});

		if ((!viewer.userId && !viewer.manage) || !viewer.domain) {
			return ctx.badRequest("Viewer context is required.");
		}

		const college = await findCollegeBySlug(viewer.collegeSlug);
		const collegeId = asNumber(asRecord(college).id);
		const now = new Date();
		const statusFilter = viewer.status || "visible";
		const statusWhere =
			statusFilter === "all"
				? { $ne: "archived" }
				: statusFilter === "visible"
					? { $in: ["active"] }
					: { $eq: statusFilter };

		const notifications = await strapi.db
			.query("api::app-notification.app-notification")
			.findMany({
				where: {
					status: statusWhere,
					...(viewer.severity !== "all" ? { severity: viewer.severity } : {}),
					...(viewer.manage
						? viewer.domain === "superadmin"
							? { scope: "platform" }
							: { scope: "college", college: collegeId }
						: {
								$or: [
									{ scope: "platform" },
									...(collegeId ? [{ scope: "college", college: collegeId }] : []),
								],
							}),
				},
				populate: {
					college: true,
					targetUser: true,
					targetRole: true,
					createdBy: true,
				},
				orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
				limit: 200,
			});
		const receiptEntries = await getReceiptsForUser(viewer.userId);
		const receiptsByNotificationId = new Map(
			receiptEntries.map((receipt: Record<string, unknown>) => [
				receiptKey(receipt),
				receipt,
			]),
		);
		const visible = notifications
			.filter((notification: Record<string, unknown>) => {
				if (statusFilter === "visible" && !isCurrentlyVisible(notification, now)) {
					return false;
				}

				if (viewer.manage) {
					return viewer.domain === "superadmin" || Boolean(collegeId);
				}

				if (
					!isVisibleToViewer(notification, {
						userId: viewer.userId,
						domain: viewer.domain,
						roleCode: viewer.roleCode,
						collegeId,
					})
				) {
					return false;
				}

				const receipt = receiptsByNotificationId.get(String(notification.id));
				return viewer.includeDismissed || !receipt?.dismissedAt;
			})
			.map((notification: Record<string, unknown>) =>
				mapNotification(
					notification,
					receiptsByNotificationId.get(String(notification.id)),
				),
			);
		const filtered = visible.filter((notification) => {
			const haystack =
				`${notification.title} ${notification.message} ${notification.audience}`.toLowerCase();
			const matchesQuery = !viewer.query || haystack.includes(viewer.query);
			const matchesReadState =
				viewer.readState === "all" ||
				(viewer.readState === "read" && notification.isRead) ||
				(viewer.readState === "unread" && !notification.isRead);

			return matchesQuery && matchesReadState;
		});
		const pageCount = Math.max(1, Math.ceil(filtered.length / viewer.pageSize));
		const page = Math.min(viewer.page, pageCount);
		const start = (page - 1) * viewer.pageSize;
		const pageItems = filtered.slice(start, start + viewer.pageSize);

		ctx.body = {
			notifications: pageItems,
			meta: {
				page,
				pageSize: viewer.pageSize,
				pageCount,
				total: filtered.length,
				unread: filtered.filter((notification) => !notification.isRead).length,
				critical: filtered.filter(
					(notification) => notification.severity === "critical",
				).length,
				generatedAt: new Date().toISOString(),
			},
		};
	},

	async create(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Notification creation is not authorized.");
		}

		const payload = parseCreatePayload(ctx.request.body);

		if (payload.title.length < 3 || payload.message.length < 10) {
			return ctx.badRequest("Notification title and message are required.");
		}

		if (payload.endAt && payload.startAt) {
			const start = parseDate(payload.startAt);
			const end = parseDate(payload.endAt);

			if (start && end && end < start) {
				return ctx.badRequest("Notification end date must be after start date.");
			}
		}

		if (
			["specific-admin", "specific-user"].includes(payload.audience) &&
			!payload.targetUserId
		) {
			return ctx.badRequest("A target user is required for this audience.");
		}

		const college =
			payload.scope === "college" ? await findCollegeBySlug(payload.collegeSlug) : null;
		const collegeId = asNumber(asRecord(college).id);

		if (payload.scope === "college" && !collegeId) {
			return ctx.badRequest("A valid college is required for college notifications.");
		}

		if (payload.idempotencyKey) {
			const existing = await strapi.db
				.query("api::app-notification.app-notification")
				.findOne({
					where: { idempotencyKey: payload.idempotencyKey },
					populate: {
						college: true,
						targetUser: true,
						targetRole: true,
						createdBy: true,
					},
				});

			if (existing?.id) {
				ctx.status = 200;
				ctx.body = { notification: mapNotification(existing), idempotent: true };
				return;
			}
		}

		const notification = await strapi.db
			.query("api::app-notification.app-notification")
			.create({
				data: {
					title: payload.title,
					message: payload.message,
					scope: payload.scope,
					audience: payload.audience,
					severity: payload.severity,
					status: payload.status,
					startAt: payload.startAt,
					endAt: payload.endAt,
					publishedAt: payload.publishedAt,
					idempotencyKey: payload.idempotencyKey || undefined,
					metadata: withActorMetadata(payload.metadata, {
						id: payload.createdById,
						name: payload.actorName,
						email: payload.actorEmail,
						role: payload.actorRole,
					}),
					...(collegeId ? { college: collegeId } : {}),
					...(payload.targetUserId ? { targetUser: payload.targetUserId } : {}),
					...(payload.targetRoleId ? { targetRole: payload.targetRoleId } : {}),
					...(payload.targetFacultyId ? { targetFaculty: payload.targetFacultyId } : {}),
					...(payload.targetDepartmentId
						? { targetDepartment: payload.targetDepartmentId }
						: {}),
				},
				populate: {
					college: true,
					targetUser: true,
					targetRole: true,
					createdBy: true,
				},
			});

		await createAuditLog({
			action: "notification.created",
			eventType: "created",
			actorId: payload.createdById,
			actorName: payload.actorName,
			actorEmail: payload.actorEmail,
			actorRole: payload.actorRole,
			collegeId,
			entityId: getEntityId(notification),
			targetLabel: payload.title,
			summary: `${payload.actorName || "Portal user"} created an in-app notification for ${payload.audience}.`,
			metadata: {
				scope: payload.scope,
				audience: payload.audience,
				severity: payload.severity,
				status: payload.status,
			},
		});

		ctx.status = 201;
		ctx.body = { notification: mapNotification(notification), idempotent: false };
	},

	async update(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Notification update is not authorized.");
		}

		const notificationId = asString(ctx.params?.id);
		const existing = await findNotificationByIdentifier(notificationId);

		if (!existing?.id) {
			return ctx.notFound("Notification was not found.");
		}

		const payload = parseUpdatePayload(ctx.request.body);
		const existingCollege = asRecord(existing.college);

		if (payload.managerDomain === "superadmin") {
			if (asString(existing.scope) !== "platform") {
				return ctx.notFound("Notification was not found in platform scope.");
			}
		} else {
			const managerCollege = await findCollegeBySlug(payload.managerCollegeSlug);

			if (
				!managerCollege?.id ||
				asString(existing.scope) !== "college" ||
				!sameNumericId(existingCollege.id, managerCollege.id)
			) {
				return ctx.notFound("Notification was not found in this college scope.");
			}
		}
		const data: Record<string, unknown> = {};

		if (payload.title) data.title = payload.title;
		if (payload.message) data.message = payload.message;
		if (AUDIENCES.includes(payload.audience as NotificationAudience)) {
			data.audience = payload.audience;
		}
		if (SEVERITIES.includes(payload.severity as NotificationSeverity)) {
			data.severity = payload.severity;
		}
		if (payload.status) {
			data.status = payload.status;
			if (payload.status === "active") {
				data.publishedAt = payload.publishedAt || new Date().toISOString();
			}
		}
		if (payload.startAt) data.startAt = payload.startAt;
		if (payload.endAt) data.endAt = payload.endAt;

		if (Object.keys(data).length === 0) {
			return ctx.badRequest("No notification updates were provided.");
		}

		const updated = await strapi.db
			.query("api::app-notification.app-notification")
			.update({
				where: { id: existing.id },
				data,
				populate: {
					college: true,
					targetUser: true,
					targetRole: true,
					createdBy: true,
				},
			});

		await createAuditLog({
			action:
				payload.status === "active"
					? "notification.published"
					: payload.status === "archived"
						? "notification.archived"
						: "notification.updated",
			eventType: "updated",
			actorId: payload.actorId,
			actorName: payload.actorName,
			actorEmail: payload.actorEmail,
			actorRole: payload.actorRole,
			collegeId: asNumber(asRecord(updated.college).id),
			entityId: getEntityId(updated),
			targetLabel: asString(updated.title),
			summary: `${payload.actorName || "Portal user"} updated an in-app notification.`,
			metadata: data,
		});

		ctx.body = {
			notification: mapNotification(updated),
		};
	},

	async markRead(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Notification read access is not authorized.");
		}

		const payload = asRecord(ctx.request.body);
		const viewer = {
			userId: asNumber(payload.viewerUserId),
			domain: normalizeDomain(payload.viewerDomain),
			roleCode: asString(payload.viewerRoleCode),
			collegeSlug: asString(payload.collegeSlug),
		};
		const notificationId = asString(ctx.params?.id);

		if (!viewer.userId || !viewer.domain || !notificationId) {
			return ctx.badRequest("Viewer context and notification id are required.");
		}

		const [notification, college] = await Promise.all([
			findNotificationByIdentifier(notificationId),
			findCollegeBySlug(viewer.collegeSlug),
		]);

		if (!notification?.id) {
			return ctx.notFound("Notification was not found.");
		}

		const collegeId = asNumber(asRecord(college).id);

		if (
			!isVisibleToViewer(notification, {
				userId: viewer.userId,
				domain: viewer.domain,
				roleCode: viewer.roleCode,
				collegeId,
			})
		) {
			return ctx.notFound("Notification was not found for this user.");
		}

		const receipt = await upsertReadReceipt({
			notification,
			userId: viewer.userId,
			collegeId,
			readAt: new Date().toISOString(),
		});

		ctx.body = {
			ok: true,
			notification: mapNotification(notification, receipt),
		};
	},

	async markAllRead(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Notification read access is not authorized.");
		}

		const payload = asRecord(ctx.request.body);
		const viewer = {
			userId: asNumber(payload.viewerUserId),
			domain: normalizeDomain(payload.viewerDomain),
			roleCode: asString(payload.viewerRoleCode),
			collegeSlug: asString(payload.collegeSlug),
		};

		if (!viewer.userId || !viewer.domain) {
			return ctx.badRequest("Viewer context is required.");
		}

		const college = await findCollegeBySlug(viewer.collegeSlug);
		const collegeId = asNumber(asRecord(college).id);
		const now = new Date();
		const notifications = await strapi.db
			.query("api::app-notification.app-notification")
			.findMany({
				where: {
					status: "active",
					$or: [
						{ scope: "platform" },
						...(collegeId ? [{ scope: "college", college: collegeId }] : []),
					],
				},
				populate: {
					college: true,
					targetUser: true,
					targetRole: true,
					createdBy: true,
				},
				orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
				limit: 200,
			});
		const visible = notifications.filter((notification: Record<string, unknown>) => {
			return (
				isCurrentlyVisible(notification, now) &&
				isVisibleToViewer(notification, {
					userId: viewer.userId,
					domain: viewer.domain,
					roleCode: viewer.roleCode,
					collegeId,
				})
			);
		});
		const readAt = new Date().toISOString();

		await Promise.all(
			visible.map((notification: Record<string, unknown>) =>
				upsertReadReceipt({
					notification,
					userId: viewer.userId,
					collegeId,
					readAt,
				}),
			),
		);

		ctx.body = {
			ok: true,
			updated: visible.length,
			readAt,
		};
	},
};

export default internalNotificationController;
