import { randomInt } from "node:crypto";

type StrapiContext = {
	request: {
		body?: unknown;
		header: Record<string, string | undefined>;
		params?: Record<string, string | undefined>;
	};
	unauthorized: (message?: string) => unknown;
	badRequest: (message?: string) => unknown;
	conflict: (message?: string) => unknown;
	notFound?: (message?: string) => unknown;
	body: unknown;
};

type ProvisionCollegePayload = {
	name?: unknown;
	code?: unknown;
	contactEmail?: unknown;
	adminName?: unknown;
	adminUsername?: unknown;
	adminEmail?: unknown;
	adminPhone?: unknown;
	temporaryPassword?: unknown;
};

type UpdateCollegePayload = {
	name?: unknown;
	contactEmail?: unknown;
	adminName?: unknown;
	adminUsername?: unknown;
	adminEmail?: unknown;
	adminPhone?: unknown;
	status?: unknown;
};

const DEV_INTERNAL_SECRET = "iums-local-registration-secret-change-before-production";
const GLOBAL_COLLEGE_ADMIN_ROLE_CODE = "platform-college-admin";
const GLOBAL_STUDENT_ROLE_CODE = "platform-student";
const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const COLLEGE_ADMIN_PERMISSIONS = [
	"dashboard.view",
	"faculties.view",
	"faculties.create",
	"departments.view",
	"departments.create",
	"staff.view",
	"staff.create",
	"staff.assign_role",
	"students.view",
	"students.create",
	"admissions.view",
	"admissions.approve",
	"courses.view",
	"courses.create",
	"courses.update",
	"courses.assign_staff",
	"courses.approve",
	"courses.reject",
	"payments.view",
	"payments.verify",
	"payments.print",
	"notices.view",
	"notices.create",
	"reports.view",
	"roles.view",
	"roles.create",
	"roles.assign_permissions",
	"settings.view",
	"hostels.view",
	"hostels.create",
	"hostels.update",
	"hostels.allocate",
];

const STUDENT_PERMISSIONS = [
	"dashboard.view",
	"profile.view",
	"profile.update",
	"admissions.view",
	"courses.view",
	"courses.register",
	"results.view",
	"payments.view",
	"payments.print",
	"hostels.view",
	"notices.view",
];

function getInternalSecret() {
	const configured =
		process.env.PORTAL_INTERNAL_API_SECRET ?? process.env.PORTAL_REGISTRATION_SECRET;

	if (configured) {
		return configured;
	}

	if (process.env.NODE_ENV === "production") {
		return null;
	}

	return DEV_INTERNAL_SECRET;
}

function getHeader(ctx: StrapiContext, name: string) {
	const lowerName = name.toLowerCase();
	return ctx.request.header[lowerName] ?? ctx.request.header[name];
}

function normalizeEmail(value: string) {
	return value.trim().toLowerCase();
}

function normalizeCode(value: string) {
	return value
		.trim()
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "")
		.slice(0, 12);
}

function normalizeUsername(value: string) {
	return value.trim().toLowerCase().replace(/\s+/g, ".");
}

function toSlug(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/&/g, " and ")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function toText(value: unknown) {
	return typeof value === "string" ? value.trim() : "";
}

function toStatus(value: unknown) {
	const status = toText(value).toLowerCase();

	if (status === "active" || status === "inactive" || status === "archived") {
		return status;
	}

	return "";
}

function padTwo(value: number) {
	return String(value).padStart(2, "0");
}

function randomAlphaNumeric(length: number) {
	return Array.from({ length }, () => {
		const index = randomInt(ALPHANUMERIC.length);
		return ALPHANUMERIC[index];
	}).join("");
}

function createTemporaryPassword(now = new Date()) {
	const yy = padTwo(now.getFullYear() % 100);
	const hh = padTwo(now.getHours());
	const mm = padTwo(now.getMinutes());

	return `${randomAlphaNumeric(5)}@${yy}${hh}${mm}!`;
}

function parsePayload(body: unknown) {
	const payload = (body ?? {}) as ProvisionCollegePayload;
	const name = toText(payload.name);
	const code = normalizeCode(toText(payload.code));
	const contactEmail = normalizeEmail(toText(payload.contactEmail || payload.adminEmail));
	const adminName = toText(payload.adminName);
	const adminUsername = normalizeUsername(toText(payload.adminUsername));
	const adminEmail = normalizeEmail(toText(payload.adminEmail));
	const adminPhone = toText(payload.adminPhone);
	const temporaryPassword =
		typeof payload.temporaryPassword === "string" && payload.temporaryPassword.trim()
			? payload.temporaryPassword.trim()
			: createTemporaryPassword();

	return {
		name,
		slug: toSlug(name),
		code,
		contactEmail,
		adminName,
		adminUsername,
		adminEmail,
		adminPhone,
		temporaryPassword,
	};
}

function parseUpdatePayload(body: unknown) {
	const payload = (body ?? {}) as UpdateCollegePayload;

	return {
		name: toText(payload.name),
		contactEmail:
			typeof payload.contactEmail === "string"
				? normalizeEmail(payload.contactEmail)
				: "",
		adminName: toText(payload.adminName),
		adminUsername:
			typeof payload.adminUsername === "string"
				? normalizeUsername(payload.adminUsername)
				: "",
		adminEmail:
			typeof payload.adminEmail === "string"
				? normalizeEmail(payload.adminEmail)
				: "",
		adminPhone: toText(payload.adminPhone),
		status: toStatus(payload.status),
	};
}

async function getAuthenticatedPluginRoleId() {
	const role = await strapi.db.query("plugin::users-permissions.role").findOne({
		where: { type: "authenticated" },
	});

	return role?.id;
}

async function getPermissionIds(keys: string[]) {
	const permissions = await strapi.db.query("api::permission.permission").findMany({
		where: { key: { $in: keys } },
	});

	return permissions
		.map((permission: { id?: number }) => permission.id)
		.filter((id: unknown): id is number => typeof id === "number");
}

async function upsertPortalRole(input: {
	name: string;
	code: string;
	description: string;
	scopeType: "college" | "self";
	collegeId?: number;
	permissions: string[];
}) {
	const existing = await strapi.db.query("api::portal-role.portal-role").findOne({
		where: { code: input.code },
	});
	const permissionIds = await getPermissionIds(input.permissions);
	const data = {
		name: input.name,
		code: input.code,
		description: input.description,
		roleType: "system",
		tenantScope: "college",
		scopeType: input.scopeType,
		permissions: permissionIds,
	};
	const roleData =
		typeof input.collegeId === "number"
			? { ...data, college: input.collegeId }
			: data;

	if (existing?.id) {
		return strapi.db.query("api::portal-role.portal-role").update({
			where: { id: existing.id },
			data: roleData,
		});
	}

	return strapi.db.query("api::portal-role.portal-role").create({ data: roleData });
}

async function upsertAdminUser(input: {
	username: string;
	email: string;
	password: string;
	pluginRoleId: number;
}) {
	const existingUser = await strapi.db
		.query("plugin::users-permissions.user")
		.findOne({
			where: {
				$or: [{ email: input.email }, { username: input.username }],
			},
		});

	if (
		existingUser?.id &&
		existingUser.email &&
		normalizeEmail(String(existingUser.email)) !== input.email
	) {
		throw new Error("Username is already linked to another email address.");
	}

	if (existingUser?.id) {
		throw new Error("Admin email or username is already linked to another portal account.");
	}

	const userService = strapi.plugin("users-permissions").service("user");

	return userService.add({
		username: input.username,
		email: input.email,
		password: input.password,
		provider: "local",
		confirmed: true,
		blocked: false,
		role: input.pluginRoleId,
	});
}

async function upsertAdminAssignment(input: {
	userId: number;
	roleId: number;
	collegeId: number;
}) {
	const existing = await strapi.db
		.query("api::role-assignment.role-assignment")
		.findOne({
			where: {
				user: input.userId,
				role: input.roleId,
				college: input.collegeId,
				scopeType: "college",
			},
		});

	const data = {
		user: input.userId,
		role: input.roleId,
		college: input.collegeId,
		scopeType: "college",
		status: "active",
		isPrimary: true,
	};

	const activeAssignments = await strapi.db
		.query("api::role-assignment.role-assignment")
		.findMany({
			where: {
				user: input.userId,
				status: "active",
			},
		});

	for (const assignment of activeAssignments as Array<{ id?: number }>) {
		if (assignment.id) {
			await strapi.db.query("api::role-assignment.role-assignment").update({
				where: { id: assignment.id },
				data: { isPrimary: false },
			});
		}
	}

	if (existing?.id) {
		return strapi.db.query("api::role-assignment.role-assignment").update({
			where: { id: existing.id },
			data,
		});
	}

	return strapi.db.query("api::role-assignment.role-assignment").create({ data });
}

async function sendAdminInvite(input: {
	collegeName: string;
	adminName: string;
	adminEmail: string;
	username: string;
	temporaryPassword: string;
}) {
	try {
		await strapi.plugin("email").service("email").send({
			to: input.adminEmail,
			subject: `${input.collegeName} admin portal access`,
			text: [
				`Hello ${input.adminName || input.username},`,
				"",
				`Your college admin account for ${input.collegeName} has been created.`,
				"",
				`Username: ${input.username}`,
				`Email: ${input.adminEmail}`,
				`Temporary password: ${input.temporaryPassword}`,
				"",
				`Sign in: ${(process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "")}/staff/signin`,
				"",
				"Please sign in and change your password before continuing operational work.",
			].join("\n"),
		});

		return true;
	} catch (error) {
		strapi.log.warn(
			`[superadmin-college] Admin invite email failed: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		);
		return false;
	}
}

function serializeCollege(college: Record<string, unknown>) {
	const metadata =
		college.metadata && typeof college.metadata === "object" && !Array.isArray(college.metadata)
			? (college.metadata as Record<string, unknown>)
			: {};
	const admin =
		metadata.admin && typeof metadata.admin === "object" && !Array.isArray(metadata.admin)
			? (metadata.admin as Record<string, unknown>)
			: {};

	return {
		id: college.id,
		documentId: college.documentId,
		name: college.name,
		slug: college.slug,
		code: college.code,
		status: college.status,
		contactEmail: college.contactEmail,
		admin: {
			name: admin.name,
			username: admin.username,
			email: admin.email,
			phone: admin.phone,
			userId: admin.userId,
		},
		createdAt: college.createdAt,
		updatedAt: college.updatedAt,
	};
}

function getCollegeAdminMetadata(college: Record<string, unknown>) {
	const metadata =
		college.metadata && typeof college.metadata === "object" && !Array.isArray(college.metadata)
			? (college.metadata as Record<string, unknown>)
			: {};

	return metadata.admin && typeof metadata.admin === "object" && !Array.isArray(metadata.admin)
		? (metadata.admin as Record<string, unknown>)
		: {};
}

function sameId(left: unknown, right: unknown) {
	return String(left) === String(right);
}

async function findCollegeById(id: string) {
	const numericId = Number(id);

	if (Number.isInteger(numericId) && numericId > 0) {
		const byId = await strapi.db.query("api::college.college").findOne({
			where: { id: numericId },
		});

		if (byId?.id) {
			return byId;
		}
	}

	return strapi.db.query("api::college.college").findOne({
		where: {
			$or: [{ documentId: id }, { slug: id }],
		},
	});
}

async function ensureUniqueCollegeUpdate(input: {
	collegeId: unknown;
	name?: string;
	contactEmail?: string;
}) {
	const colleges = await strapi.db.query("api::college.college").findMany({});
	const normalizedName = input.name?.trim().toLowerCase();
	const normalizedEmail = input.contactEmail?.trim().toLowerCase();

	for (const college of colleges as Array<Record<string, unknown>>) {
		if (sameId(college.id, input.collegeId)) {
			continue;
		}

		if (
			normalizedName &&
			String(college.name ?? "").trim().toLowerCase() === normalizedName
		) {
			throw new Error("A college with this name already exists.");
		}

		if (
			normalizedEmail &&
			String(college.contactEmail ?? "").trim().toLowerCase() === normalizedEmail
		) {
			throw new Error("A college with this contact email already exists.");
		}
	}
}

async function updateLinkedAdminUser(input: {
	adminUserId?: number;
	currentAdmin: Record<string, unknown>;
	username: string;
	email: string;
}) {
	const fallbackEmail = normalizeEmail(String(input.currentAdmin.email ?? ""));
	const fallbackUsername = normalizeUsername(String(input.currentAdmin.username ?? ""));
	const existingTarget = await strapi.db
		.query("plugin::users-permissions.user")
		.findOne({
			where: {
				$or: [{ email: input.email }, { username: input.username }],
			},
		});
	const linkedUser =
		input.adminUserId
			? await strapi.db.query("plugin::users-permissions.user").findOne({
					where: { id: input.adminUserId },
				})
			: await strapi.db.query("plugin::users-permissions.user").findOne({
					where: {
						$or: [{ email: fallbackEmail }, { username: fallbackUsername }],
					},
				});

	if (!linkedUser?.id) {
		throw new Error("Linked college admin user could not be resolved.");
	}

	if (existingTarget?.id && !sameId(existingTarget.id, linkedUser.id)) {
		throw new Error("Admin email or username is already linked to another portal account.");
	}

	const userService = strapi.plugin("users-permissions").service("user");

	return userService.edit(linkedUser.id, {
		username: input.username,
		email: input.email,
		provider: "local",
		confirmed: true,
		blocked: false,
	});
}

function authorize(ctx: StrapiContext) {
	const expectedSecret = getInternalSecret();
	const providedSecret = getHeader(ctx, "x-portal-internal-secret");

	return Boolean(expectedSecret && providedSecret === expectedSecret);
}

export default {
	async listColleges(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("College provisioning is not authorized.");
		}

		const colleges = await strapi.db.query("api::college.college").findMany({
			orderBy: { name: "asc" },
		});

		ctx.body = {
			colleges: colleges.map((college: Record<string, unknown>) =>
				serializeCollege(college),
			),
		};
	},

	async provisionCollege(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("College provisioning is not authorized.");
		}

		const payload = parsePayload(ctx.request.body);

		if (
			!payload.name ||
			!payload.slug ||
			!payload.code ||
			!payload.adminUsername ||
			!payload.adminEmail ||
			!payload.temporaryPassword
		) {
			return ctx.badRequest(
				"College name, code, admin username, admin email, and temporary password are required.",
			);
		}

		const existingCollege = await strapi.db.query("api::college.college").findOne({
			where: {
				$or: [
					{ slug: payload.slug },
					{ code: payload.code },
					{ contactEmail: payload.contactEmail || payload.adminEmail },
				],
			},
		});

		if (existingCollege?.id) {
			return ctx.conflict(
				"A college with this name, code, or contact email already exists.",
			);
		}

		const pluginRoleId = await getAuthenticatedPluginRoleId();

		if (!pluginRoleId) {
			return ctx.badRequest("The authenticated user role is not configured.");
		}

		try {
			const college = await strapi.db.query("api::college.college").create({
				data: {
					name: payload.name,
					slug: payload.slug,
					code: payload.code,
					status: "active",
					contactEmail: payload.contactEmail || payload.adminEmail,
					metadata: {
						admin: {
							name: payload.adminName,
							username: payload.adminUsername,
							email: payload.adminEmail,
							phone: payload.adminPhone,
							provisionedAt: new Date().toISOString(),
						},
					},
				},
			});

			const adminRole = await upsertPortalRole({
				name: "College Admin",
				code: GLOBAL_COLLEGE_ADMIN_ROLE_CODE,
				description:
					"Global college admin role template. Tenant access comes from each user's college role assignment.",
				scopeType: "college",
				permissions: COLLEGE_ADMIN_PERMISSIONS,
			});

			const studentRole = await upsertPortalRole({
				name: "Student",
				code: GLOBAL_STUDENT_ROLE_CODE,
				description:
					"Global student/applicant role template. Tenant access comes from each user's college role assignment.",
				scopeType: "self",
				permissions: STUDENT_PERMISSIONS,
			});

			const adminUser = await upsertAdminUser({
				username: payload.adminUsername,
				email: payload.adminEmail,
				password: payload.temporaryPassword,
				pluginRoleId,
			});

			await upsertAdminAssignment({
				userId: adminUser.id,
				roleId: adminRole.id,
				collegeId: college.id,
			});

			const emailSent = await sendAdminInvite({
				collegeName: payload.name,
				adminName: payload.adminName,
				adminEmail: payload.adminEmail,
				username: payload.adminUsername,
				temporaryPassword: payload.temporaryPassword,
			});

			const updatedCollege = await strapi.db.query("api::college.college").update({
				where: { id: college.id },
				data: {
					metadata: {
						admin: {
							name: payload.adminName,
							username: payload.adminUsername,
							email: payload.adminEmail,
							phone: payload.adminPhone,
							userId: adminUser.id,
							roleCode: adminRole.code,
							studentRoleCode: studentRole.code,
							roleAssignmentScope: "college",
							inviteEmailSent: emailSent,
							provisionedAt: new Date().toISOString(),
						},
					},
				},
			});

			ctx.body = {
				ok: true,
				college: serializeCollege(updatedCollege),
				admin: {
					id: adminUser.id,
					username: adminUser.username,
					email: adminUser.email,
					roleCode: adminRole.code,
				},
				studentRole: {
					id: studentRole.id,
					code: studentRole.code,
				},
				roleTemplates: {
					adminRoleCode: adminRole.code,
					studentRoleCode: studentRole.code,
					scopeSource: "role_assignment",
				},
				emailSent,
			};
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unable to provision college.";

			if (message.includes("already linked")) {
				return ctx.conflict(message);
			}

			return ctx.badRequest(message);
		}
	},

	async updateCollege(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("College provisioning is not authorized.");
		}

		const collegeId = ctx.request.params?.id;

		if (!collegeId) {
			return ctx.badRequest("College id is required.");
		}

		const college = await findCollegeById(collegeId);

		if (!college?.id) {
			return ctx.notFound
				? ctx.notFound("College could not be found.")
				: ctx.badRequest("College could not be found.");
		}

		const payload = parseUpdatePayload(ctx.request.body);
		const currentAdmin = getCollegeAdminMetadata(college);
		const nextName = payload.name || String(college.name ?? "");
		const nextContactEmail =
			payload.contactEmail || String(college.contactEmail ?? currentAdmin.email ?? "");
		const nextStatus = payload.status || String(college.status ?? "active");
		const nextAdminName = payload.adminName || String(currentAdmin.name ?? "");
		const nextAdminUsername =
			payload.adminUsername || normalizeUsername(String(currentAdmin.username ?? ""));
		const nextAdminEmail =
			payload.adminEmail || normalizeEmail(String(currentAdmin.email ?? ""));
		const nextAdminPhone = payload.adminPhone || String(currentAdmin.phone ?? "");
		const hasAdminUpdate = Boolean(
			payload.adminName !== undefined ||
				payload.adminUsername !== undefined ||
				payload.adminEmail !== undefined ||
				payload.adminPhone !== undefined,
		);
		const hasAdminIdentity = Boolean(nextAdminUsername && nextAdminEmail);
		const adminUserId =
			typeof currentAdmin.userId === "number"
				? currentAdmin.userId
				: Number.isInteger(Number(currentAdmin.userId))
					? Number(currentAdmin.userId)
					: undefined;

		if (!nextName) {
			return ctx.badRequest("College name is required.");
		}

		if (hasAdminUpdate && !hasAdminIdentity) {
			return ctx.badRequest("Admin username and admin email are required.");
		}

		try {
			await ensureUniqueCollegeUpdate({
				collegeId: college.id,
				name: nextName,
				contactEmail: nextContactEmail,
			});

			const adminUser = hasAdminIdentity
				? await updateLinkedAdminUser({
						adminUserId,
						currentAdmin,
						username: nextAdminUsername,
						email: nextAdminEmail,
					})
				: null;
			const adminRole = adminUser?.id
				? await upsertPortalRole({
						name: "College Admin",
						code: GLOBAL_COLLEGE_ADMIN_ROLE_CODE,
						description:
							"Global college admin role template. Tenant access comes from each user's college role assignment.",
						scopeType: "college",
						permissions: COLLEGE_ADMIN_PERMISSIONS,
					})
				: null;

			if (adminUser?.id && adminRole?.id) {
				await upsertAdminAssignment({
					userId: adminUser.id,
					roleId: adminRole.id,
					collegeId: college.id,
				});
			}

			const nextMetadata =
				college.metadata &&
				typeof college.metadata === "object" &&
				!Array.isArray(college.metadata)
					? (college.metadata as Record<string, unknown>)
					: {};
			const nextAdmin =
				Object.keys(currentAdmin).length > 0 || hasAdminUpdate || adminUser?.id
					? {
							...currentAdmin,
							name: nextAdminName,
							username: nextAdminUsername,
							email: nextAdminEmail,
							phone: nextAdminPhone,
							userId: adminUser?.id ?? currentAdmin.userId,
							roleCode:
								adminRole?.code ??
								currentAdmin.roleCode ??
								GLOBAL_COLLEGE_ADMIN_ROLE_CODE,
							roleAssignmentScope: "college",
							updatedAt: new Date().toISOString(),
						}
					: undefined;
			const previousStatus = String(college.status ?? "active");

			const updatedCollege = await strapi.db.query("api::college.college").update({
				where: { id: college.id },
				data: {
					name: nextName,
					status: nextStatus,
					contactEmail: nextContactEmail,
					metadata: {
						...nextMetadata,
						...(nextAdmin ? { admin: nextAdmin } : {}),
						statusHistory: [
							...((nextMetadata.statusHistory as unknown[]) ?? []),
							...(previousStatus !== nextStatus
								? [
										{
											status: nextStatus,
											updatedAt: new Date().toISOString(),
										},
									]
								: []),
						],
					},
				},
			});

			ctx.body = {
				ok: true,
				college: serializeCollege(updatedCollege),
				...(adminUser
					? {
							admin: {
								id: adminUser.id,
								username: adminUser.username,
								email: adminUser.email,
								roleCode: String(
									currentAdmin.roleCode ?? GLOBAL_COLLEGE_ADMIN_ROLE_CODE,
								),
							},
						}
					: {}),
			};
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unable to update college.";

			if (message.includes("already")) {
				return ctx.conflict(message);
			}

			return ctx.badRequest(message);
		}
	},
};
