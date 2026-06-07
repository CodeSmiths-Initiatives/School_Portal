type StrapiContext = {
	params?: Record<string, string | undefined>;
	request: {
		body?: unknown;
		header: Record<string, string | undefined>;
		query?: Record<string, string | undefined>;
	};
	unauthorized: (message?: string) => unknown;
	badRequest: (message?: string) => unknown;
	notFound?: (message?: string) => unknown;
	conflict?: (message?: string) => unknown;
	body: unknown;
};

type PermissionInput = {
	permissionKeys?: unknown;
	name?: unknown;
	description?: unknown;
	scopeType?: unknown;
};

const DEV_INTERNAL_SECRET =
	"iums-local-registration-secret-change-before-production";
const STAFF_ROLE_EXCLUDED_CODES = [
	"platform-superadmin",
	"platform-college-admin",
	"platform-student",
];
const ALLOWED_SCOPE_TYPES = [
	"college",
	"faculty",
	"department",
	"course",
] as const;

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

function authorize(ctx: StrapiContext) {
	const expectedSecret = getInternalSecret();
	const providedSecret = getHeader(ctx, "x-portal-internal-secret");

	return Boolean(expectedSecret && providedSecret === expectedSecret);
}

function asString(value: unknown, fallback = "") {
	return typeof value === "string" ? value.trim() : fallback;
}

function asNumber(value: unknown) {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

function asRecord(value: unknown) {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function asArray(value: unknown) {
	return Array.isArray(value) ? value : [];
}

function normalizeEmail(value: unknown) {
	return asString(value).toLowerCase();
}

function normalizeSlug(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/&/g, " and ")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function normalizePermissionKey(value: unknown) {
	return asString(value).toLowerCase();
}

function uniqueStrings(values: unknown[]) {
	return Array.from(
		new Set(
			values
				.map((value) => (typeof value === "string" ? value.trim() : ""))
				.filter(Boolean),
		),
	);
}

function parseDate(value: unknown) {
	const text = asString(value);
	const date = new Date(text);
	return text && !Number.isNaN(date.getTime()) ? date : null;
}

function isWithinDateRange(value: unknown, from?: string, to?: string) {
	const date = parseDate(value);

	if (!date) {
		return true;
	}

	if (from && date < new Date(`${from}T00:00:00.000Z`)) {
		return false;
	}

	if (to && date > new Date(`${to}T23:59:59.999Z`)) {
		return false;
	}

	return true;
}

function mapPermission(permission: Record<string, unknown>) {
	return {
		id: permission.id,
		key: permission.key,
		module: permission.module,
		action: permission.action,
		label: permission.label,
		description: permission.description,
	};
}

function mapRole(role: Record<string, unknown>) {
	const permissions = asArray(role.permissions);

	return {
		id: role.id,
		documentId: role.documentId,
		name: role.name,
		code: role.code,
		description: role.description,
		roleType: role.roleType,
		tenantScope: role.tenantScope,
		scopeType: role.scopeType,
		permissions: permissions.map((permission) =>
			mapPermission(permission as Record<string, unknown>),
		),
		createdAt: role.createdAt,
		updatedAt: role.updatedAt,
	};
}

function getApplicationId(application: Record<string, unknown>) {
	return asString(application.documentId) || String(application.id ?? "");
}

function mapApplication(application: Record<string, unknown>, collegeSlug: string) {
	return {
		id: getApplicationId(application),
		documentId: asString(application.documentId) || undefined,
		numericId: asNumber(application.id) || undefined,
		applicationNumber:
			asString(application.applicationNumber) || getApplicationId(application),
		applicantUsername: asString(application.applicantUsername) || undefined,
		applicantEmail: asString(application.applicantEmail) || undefined,
		collegeId: asNumber(asRecord(application.college).id) || undefined,
		collegeSlug,
		status: asString(application.status, "draft"),
		paymentStatus: asString(application.paymentStatus, "not_started"),
		currentStep: asString(application.currentStep, "account"),
		completedSteps: asArray(application.completedSteps),
		lastSavedAt: asString(application.lastSavedAt, asString(application.updatedAt)),
		metadata: asRecord(application.metadata),
		persisted: true,
	};
}

function hasSubmittedAdmissionData(application: Record<string, unknown> | null) {
	if (!application) {
		return false;
	}

	const metadata = asRecord(application.metadata);
	const formData = asRecord(metadata.formData);
	const status = asString(application.status);

	return (
		Object.keys(formData).length > 0 &&
		["submitted", "under_review", "approved"].includes(status)
	);
}

function mapStudent(assignment: Record<string, unknown>, applicationByEmail: Map<string, unknown>) {
	const user = asRecord(assignment.user);
	const role = asRecord(assignment.role);
	const email = normalizeEmail(user.email);
	const application = (email ? applicationByEmail.get(email) : null) as
		| Record<string, unknown>
		| null;
	const hasApplicationRecord = Boolean(application);
	const hasAdmissionData = hasSubmittedAdmissionData(application);

	return {
		id: String(user.id ?? assignment.id ?? ""),
		username: asString(user.username),
		email,
		confirmed: Boolean(user.confirmed),
		blocked: Boolean(user.blocked),
		role: {
			name: asString(role.name, "Student"),
			code: asString(role.code, "platform-student"),
		},
		assignment: {
			id: assignment.id,
			scopeType: assignment.scopeType,
			status: assignment.status,
			isPrimary: Boolean(assignment.isPrimary),
		},
		createdAt: asString(user.createdAt),
		updatedAt: asString(user.updatedAt),
		hasApplicationRecord,
		hasAdmissionData,
		application: application ?? null,
	};
}

async function findCollegeBySlug(collegeSlug: string) {
	return strapi.db.query("api::college.college").findOne({
		where: { slug: collegeSlug },
	});
}

async function getPermissionIds(permissionKeys: string[]) {
	const permissions = await strapi.db.query("api::permission.permission").findMany({
		where: { key: { $in: permissionKeys } },
		orderBy: [{ module: "asc" }, { action: "asc" }],
	});

	return {
		permissions,
		ids: permissions
			.map((permission: { id?: number }) => permission.id)
			.filter((id: unknown): id is number => typeof id === "number"),
	};
}

async function createAuditLog(input: {
	collegeId?: number;
	actor?: string;
	action: string;
	entityType: string;
	entityId?: string;
	summary: string;
	metadata?: Record<string, unknown>;
}) {
	try {
		await strapi.db.query("api::audit-log.audit-log").create({
			data: {
				action: input.action,
				entityType: input.entityType,
				entityId: input.entityId,
				summary: input.summary,
				metadata: input.metadata ?? {},
				occurredAt: new Date().toISOString(),
				...(input.collegeId ? { college: input.collegeId } : {}),
			},
		});
	} catch (error) {
		strapi.log.warn(
			`[internal-college-admin] Audit write failed: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		);
	}
}

function parseRolePayload(body: unknown) {
	const payload = (body ?? {}) as PermissionInput;
	const name = asString(payload.name);
	const scopeType = asString(payload.scopeType, "college");

	return {
		name,
		description: asString(payload.description),
		scopeType: ALLOWED_SCOPE_TYPES.includes(scopeType as (typeof ALLOWED_SCOPE_TYPES)[number])
			? scopeType
			: "college",
		permissionKeys: uniqueStrings(asArray(payload.permissionKeys)),
	};
}

function monthKey(value: unknown) {
	const date = parseDate(value) ?? new Date();
	return new Intl.DateTimeFormat("en", {
		month: "short",
		year: "2-digit",
	}).format(date);
}

function increment(map: Map<string, number>, key: string, amount = 1) {
	map.set(key, (map.get(key) ?? 0) + amount);
}

function mapToPoints(map: Map<string, number>) {
	return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
}

export default {
	async students(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("College student access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);

		if (!collegeSlug) {
			return ctx.badRequest("College slug is required.");
		}

		const college = await findCollegeBySlug(collegeSlug);

		if (!college?.id) {
			return ctx.notFound?.("College could not be found.") ?? ctx.badRequest("College could not be found.");
		}

		const [assignments, applications] = await Promise.all([
			strapi.db.query("api::role-assignment.role-assignment").findMany({
				where: {
					college: college.id,
					status: "active",
					role: { code: "platform-student" },
				},
				populate: { user: true, role: true, college: true },
				orderBy: { id: "desc" },
				limit: 1000,
			}),
			strapi.db.query("api::admission-application.admission-application").findMany({
				where: { college: college.id },
				populate: { college: true },
				orderBy: { lastSavedAt: "desc" },
				limit: 1000,
			}),
		]);
		const applicationByEmail = new Map<string, unknown>();

		for (const application of applications as Record<string, unknown>[]) {
			const email = normalizeEmail(application.applicantEmail);

			if (email && !applicationByEmail.has(email)) {
				applicationByEmail.set(email, mapApplication(application, collegeSlug));
			}
		}

		const students = (assignments as Record<string, unknown>[])
			.filter((assignment) => asRecord(assignment.user).id)
			.map((assignment) => mapStudent(assignment, applicationByEmail));

		ctx.body = {
			college: {
				id: college.id,
				name: college.name,
				slug: college.slug,
				code: college.code,
				status: college.status,
			},
			students,
			count: students.length,
			withApplicationRecord: students.filter((student) => student.hasApplicationRecord).length,
			withAdmissionData: students.filter((student) => student.hasAdmissionData).length,
			generatedAt: new Date().toISOString(),
		};
	},

	async roles(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("College role access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const college = await findCollegeBySlug(collegeSlug);

		if (!college?.id) {
			return ctx.notFound?.("College could not be found.") ?? ctx.badRequest("College could not be found.");
		}

		const [roles, permissions] = await Promise.all([
			strapi.db.query("api::portal-role.portal-role").findMany({
				where: {
					college: college.id,
					tenantScope: "college",
					code: { $notIn: STAFF_ROLE_EXCLUDED_CODES },
				},
				populate: { permissions: true, college: true },
				orderBy: { name: "asc" },
			}),
			strapi.db.query("api::permission.permission").findMany({
				orderBy: [{ module: "asc" }, { action: "asc" }],
			}),
		]);

		ctx.body = {
			roles: (roles as Record<string, unknown>[]).map(mapRole),
			permissions: (permissions as Record<string, unknown>[]).map(mapPermission),
			college: {
				id: college.id,
				name: college.name,
				slug: college.slug,
				code: college.code,
			},
		};
	},

	async createRole(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("College role access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const college = await findCollegeBySlug(collegeSlug);

		if (!college?.id) {
			return ctx.notFound?.("College could not be found.") ?? ctx.badRequest("College could not be found.");
		}

		const payload = parseRolePayload(ctx.request.body);

		if (!payload.name) {
			return ctx.badRequest("Role name is required.");
		}

		const roleCode = `${asString(college.code, collegeSlug).toLowerCase()}-${normalizeSlug(payload.name)}`;
		const existing = await strapi.db.query("api::portal-role.portal-role").findOne({
			where: { code: roleCode },
		});

		if (existing?.id) {
			return ctx.conflict?.("A role with this name already exists in this college.") ??
				ctx.badRequest("A role with this name already exists in this college.");
		}

		const { permissions, ids } = await getPermissionIds(payload.permissionKeys);

		if (ids.length !== payload.permissionKeys.length) {
			return ctx.badRequest("One or more selected permissions could not be found.");
		}

		const role = await strapi.db.query("api::portal-role.portal-role").create({
			data: {
				name: payload.name,
				code: roleCode,
				description: payload.description,
				roleType: "custom",
				tenantScope: "college",
				scopeType: payload.scopeType,
				college: college.id,
				permissions: ids,
			},
			populate: { permissions: true, college: true },
		});

		await createAuditLog({
			collegeId: college.id,
			action: "college_role.created",
			entityType: "portal-role",
			entityId: String(role.id),
			summary: `Created college role ${payload.name}`,
			metadata: { collegeSlug, permissionKeys: payload.permissionKeys },
		});

		ctx.body = {
			role: mapRole({ ...role, permissions }),
		};
	},

	async updateRole(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("College role access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const roleId = asString(ctx.params?.id);
		const college = await findCollegeBySlug(collegeSlug);

		if (!college?.id || !roleId) {
			return ctx.badRequest("College slug and role id are required.");
		}

		const existing = await strapi.db.query("api::portal-role.portal-role").findOne({
			where: {
				$or: [{ documentId: roleId }, { id: asNumber(roleId) }],
				college: college.id,
			},
		});

		if (!existing?.id) {
			return ctx.notFound?.("Role could not be found for this college.") ??
				ctx.badRequest("Role could not be found for this college.");
		}

		if (STAFF_ROLE_EXCLUDED_CODES.includes(asString(existing.code))) {
			return ctx.badRequest("System role templates cannot be updated here.");
		}

		const payload = parseRolePayload(ctx.request.body);
		const { ids } = await getPermissionIds(payload.permissionKeys);

		if (ids.length !== payload.permissionKeys.length) {
			return ctx.badRequest("One or more selected permissions could not be found.");
		}

		const role = await strapi.db.query("api::portal-role.portal-role").update({
			where: { id: existing.id },
			data: {
				...(payload.name ? { name: payload.name } : {}),
				description: payload.description,
				scopeType: payload.scopeType,
				permissions: ids,
			},
			populate: { permissions: true, college: true },
		});

		await createAuditLog({
			collegeId: college.id,
			action: "college_role.permissions_updated",
			entityType: "portal-role",
			entityId: String(role.id),
			summary: `Updated permissions for ${asString(role.name)}`,
			metadata: { collegeSlug, permissionKeys: payload.permissionKeys },
		});

		ctx.body = { role: mapRole(role) };
	},

	async reports(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("College reports access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const from = asString(ctx.request.query?.from);
		const to = asString(ctx.request.query?.to);
		const college = await findCollegeBySlug(collegeSlug);

		if (!college?.id) {
			return ctx.notFound?.("College could not be found.") ?? ctx.badRequest("College could not be found.");
		}

		const [applications, invoices, assignments] = await Promise.all([
			strapi.db.query("api::admission-application.admission-application").findMany({
				where: { college: college.id },
				populate: { college: true },
				orderBy: { lastSavedAt: "desc" },
				limit: 2000,
			}),
			strapi.db.query("api::payment-invoice.payment-invoice").findMany({
				where: { college: college.id },
				populate: { transactions: true, ledgerEntries: true, college: true },
				orderBy: { createdAt: "desc" },
				limit: 2000,
			}),
			strapi.db.query("api::role-assignment.role-assignment").findMany({
				where: { college: college.id, status: "active" },
				populate: { role: true, user: true },
				limit: 2000,
			}),
		]);
		const scopedApplications = (applications as Record<string, unknown>[]).filter(
			(application) => isWithinDateRange(application.lastSavedAt ?? application.createdAt, from, to),
		);
		const scopedInvoices = (invoices as Record<string, unknown>[]).filter((invoice) =>
			isWithinDateRange(invoice.createdAt, from, to),
		);
		const admissionStatus = new Map<string, number>();
		const paymentStatus = new Map<string, number>();
		const monthlyAdmissions = new Map<string, number>();
		const monthlyPayments = new Map<string, number>();
		let totalPaid = 0;
		let totalPending = 0;

		for (const application of scopedApplications) {
			increment(admissionStatus, asString(application.status, "draft"));
			increment(monthlyAdmissions, monthKey(application.lastSavedAt ?? application.createdAt));
		}

		for (const invoice of scopedInvoices) {
			const status = asString(invoice.status, "pending");
			const amount = asNumber(invoice.amount);
			increment(paymentStatus, status);
			increment(monthlyPayments, monthKey(invoice.paidAt ?? invoice.createdAt), status === "paid" ? amount : 0);

			if (status === "paid") totalPaid += amount;
			if (status === "pending") totalPending += amount;
		}

		ctx.body = {
			college: {
				id: college.id,
				name: college.name,
				slug: college.slug,
				code: college.code,
			},
			summary: {
				totalStudents: (assignments as Record<string, unknown>[]).filter(
					(assignment) => asString(asRecord(assignment.role).code) === "platform-student",
				).length,
				totalApplications: scopedApplications.length,
				submittedApplications: scopedApplications.filter(
					(application) => asString(application.status) === "submitted",
				).length,
				draftApplications: scopedApplications.filter(
					(application) => asString(application.status) === "draft",
				).length,
				totalPaid,
				totalPending,
				totalInvoices: scopedInvoices.length,
				activeStaff: (assignments as Record<string, unknown>[]).filter(
					(assignment) =>
						!["platform-student", "platform-college-admin"].includes(
							asString(asRecord(assignment.role).code),
						),
				).length,
			},
			charts: {
				admissionStatus: mapToPoints(admissionStatus),
				paymentStatus: mapToPoints(paymentStatus),
				monthlyAdmissions: mapToPoints(monthlyAdmissions),
				monthlyPayments: mapToPoints(monthlyPayments),
			},
			generatedAt: new Date().toISOString(),
		};
	},
};
