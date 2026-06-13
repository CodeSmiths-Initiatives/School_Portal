type StrapiContext = {
	request: {
		body?: unknown;
		header: Record<string, string | undefined>;
		query?: Record<string, string | undefined>;
	};
	unauthorized: (message?: string) => unknown;
	badRequest?: (message?: string) => unknown;
	body: unknown;
};

const DEV_INTERNAL_SECRET =
	"iums-local-registration-secret-change-before-production";
const STUDENT_ROLE_CODE = "platform-student";
const COLLEGE_ADMIN_ROLE_CODE = "platform-college-admin";

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
	return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown) {
	if (typeof value === "number") {
		return value;
	}

	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}

	return 0;
}

function asRecord(value: unknown) {
	return value && typeof value === "object"
		? (value as Record<string, unknown>)
		: {};
}

function asArray(value: unknown) {
	return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function getCollege(value: unknown) {
	const college = asRecord(value);

	return {
		id: asNumber(college.id),
		name: asString(college.name),
		slug: asString(college.slug),
		code: asString(college.code),
		status: asString(college.status, "active"),
	};
}

function toDate(value: unknown) {
	const date = new Date(asString(value));
	return Number.isNaN(date.getTime()) ? null : date;
}

function inDateRange(value: unknown, from?: string, to?: string) {
	const date = toDate(value);

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

function monthKey(date: Date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function recentMonths() {
	const now = new Date();

	return Array.from({ length: 6 }, (_, index) => {
		const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
		return monthKey(date);
	});
}

function createReportRow(college: ReturnType<typeof getCollege>) {
	return {
		collegeSlug: college.slug,
		collegeCode: college.code,
		collegeName: college.name,
		collegeStatus: college.status,
		onboardedStudents: 0,
		staffAccounts: 0,
		adminAccounts: 0,
		admissionDone: 0,
		admissionDraft: 0,
		admissionPending: 0,
		paymentPaid: 0,
		paymentUnpaid: 0,
		revenue: 0,
		trend: [0, 0, 0, 0, 0, 0],
	};
}

type AuditRow = {
	id: string;
	collegeSlug: string;
	collegeName: string;
	actor: string;
	actorEmail: string;
	role: string;
	activity: string;
	target: string;
	eventType: string;
	when: string;
	ipAddress: string;
	summary: string;
};

function formatPaymentAmount(value: unknown, currencyValue: unknown) {
	const amount = asNumber(value);
	const currency = asString(currencyValue, "NGN");

	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency,
		maximumFractionDigits: 2,
	}).format(amount);
}

function paymentRowFromInvoice(invoice: Record<string, unknown>): AuditRow | null {
	const college = getCollege(invoice.college);
	const transactions = asArray(invoice.transactions);
	const latestTransaction =
		transactions.find((transaction) => asString(transaction.status) === "success") ??
		transactions[0] ??
		{};
	const metadata = asRecord(invoice.metadata);
	const application = asRecord(invoice.admissionApplication);
	const invoiceNumber = asString(invoice.invoiceNumber, String(invoice.id ?? ""));
	const reference =
		asString(latestTransaction.reference) ||
		asString(metadata.paymentReference) ||
		invoiceNumber;
	const status = asString(invoice.status, "pending");
	const payerName = asString(invoice.payerName, asString(invoice.payerEmail, "Student"));
	const payerEmail = asString(invoice.payerEmail);
	const occurredAt =
		asString(invoice.paidAt) ||
		asString(latestTransaction.verifiedAt) ||
		asString(latestTransaction.paidAt) ||
		asString(invoice.createdAt);

	if (!invoiceNumber || !occurredAt) {
		return null;
	}

	return {
		id: `PAY-${asString(invoice.documentId, String(invoice.id ?? invoiceNumber))}`,
		collegeSlug: college.slug,
		collegeName: college.name || "Platform",
		actor: payerName,
		actorEmail: payerEmail,
		role: "Student",
		activity: status === "paid" ? "Payment verified" : "Payment initialized",
		target: invoiceNumber,
		eventType: "payment",
		when: occurredAt,
		ipAddress: "Gateway",
		summary: `${payerName} ${status === "paid" ? "completed" : "started"} ${asString(
			invoice.module,
			"student",
		)} payment ${reference} for ${formatPaymentAmount(
			invoice.amount,
			invoice.currency,
		)}${
			asString(application.applicationNumber)
				? ` on application ${asString(application.applicationNumber)}`
				: ""
		}.`,
	};
}

export default {
	async recordAudit(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Audit write access is not authorized.");
		}

		const input = asRecord(ctx.request.body);
		const action = asString(input.action);
		const summary = asString(input.summary);

		if (!action || !summary) {
			return ctx.badRequest?.("Audit action and summary are required.");
		}

		const collegeSlug = asString(input.collegeSlug);
		const actorEmail = asString(input.actorEmail);
		const college = collegeSlug
			? await strapi.db.query("api::college.college").findOne({
					where: { slug: collegeSlug },
				})
			: null;
		const actor = actorEmail
			? await strapi.db.query("plugin::users-permissions.user").findOne({
					where: { email: actorEmail.toLowerCase() },
				})
			: null;

		const audit = await strapi.db.query("api::audit-log.audit-log").create({
			data: {
				action,
				eventType: asString(input.eventType, "updated"),
				actorName: asString(input.actorName, "System"),
				actorEmail,
				actorRole: asString(input.actorRole, "System"),
				entityType: asString(input.entityType, "system"),
				entityId: asString(input.entityId),
				targetLabel: asString(input.targetLabel, action),
				ipAddress: asString(input.ipAddress, "server"),
				occurredAt: asString(input.occurredAt, new Date().toISOString()),
				summary,
				metadata: input.metadata ?? {},
				...(actor?.id ? { actor: actor.id } : {}),
				...(college?.id ? { college: college.id } : {}),
			},
		});

		ctx.body = { ok: true, auditId: audit.id };
	},

	async reports(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Superadmin report access is not authorized.");
		}

		const from = ctx.request.query?.from;
		const to = ctx.request.query?.to;
		const collegeSlug = ctx.request.query?.collegeSlug;
		const colleges = await strapi.db.query("api::college.college").findMany({
			orderBy: { name: "asc" },
			limit: 500,
		});
		const collegeRows = new Map<string, ReturnType<typeof createReportRow>>();

		for (const item of colleges as Record<string, unknown>[]) {
			const college = getCollege(item);

			if (
				!college.slug ||
				(collegeSlug && college.slug !== collegeSlug) ||
				(!collegeSlug && college.status !== "active")
			) {
				continue;
			}

			collegeRows.set(college.slug, createReportRow(college));
		}

		const assignments = await strapi.db
			.query("api::role-assignment.role-assignment")
			.findMany({
				where: { status: "active" },
				populate: { role: true, college: true },
				limit: 10000,
			});

		for (const assignment of assignments as Record<string, unknown>[]) {
			const college = getCollege(assignment.college);
			const row = collegeRows.get(college.slug);
			const roleCode = asString(asRecord(assignment.role).code).toLowerCase();

			if (!row) {
				continue;
			}

			if (roleCode === STUDENT_ROLE_CODE) {
				row.onboardedStudents += 1;
			} else if (roleCode === COLLEGE_ADMIN_ROLE_CODE) {
				row.adminAccounts += 1;
			} else if (roleCode) {
				row.staffAccounts += 1;
			}
		}

		const monthKeys = recentMonths();
		const applications = await strapi.db
			.query("api::admission-application.admission-application")
			.findMany({
				populate: { college: true },
				limit: 10000,
			});

		for (const application of applications as Record<string, unknown>[]) {
			const college = getCollege(application.college);
			const row = collegeRows.get(college.slug);
			const dateValue = application.lastSavedAt ?? application.createdAt;

			if (!row || !inDateRange(dateValue, from, to)) {
				continue;
			}

			const status = asString(application.status);
			if (status === "draft") {
				row.admissionDraft += 1;
			} else if (status === "payment_pending") {
				row.admissionPending += 1;
			} else {
				row.admissionDone += 1;
			}

			const date = toDate(dateValue);
			const key = date ? monthKey(date) : "";
			const monthIndex = monthKeys.indexOf(key);
			if (monthIndex >= 0) {
				row.trend[monthIndex] += 1;
			}
		}

		const invoices = await strapi.db
			.query("api::payment-invoice.payment-invoice")
			.findMany({
				populate: { college: true },
				limit: 10000,
			});

		for (const invoice of invoices as Record<string, unknown>[]) {
			const college = getCollege(invoice.college);
			const row = collegeRows.get(college.slug);

			if (!row || !inDateRange(invoice.createdAt, from, to)) {
				continue;
			}

			if (asString(invoice.status) === "paid") {
				row.paymentPaid += 1;
				row.revenue += asNumber(invoice.amount);
			} else {
				row.paymentUnpaid += 1;
			}
		}

		ctx.body = {
			generatedAt: new Date().toISOString(),
			monthLabels: monthKeys,
			rows: Array.from(collegeRows.values()),
		};
	},

	async audit(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Superadmin audit access is not authorized.");
		}

		const from = ctx.request.query?.from;
		const to = ctx.request.query?.to;
		const collegeSlug = ctx.request.query?.collegeSlug;
		const logs = await strapi.db.query("api::audit-log.audit-log").findMany({
			orderBy: { occurredAt: "desc" },
			limit: 1000,
			populate: { college: true, actor: true },
		});
		const logRows = (logs as Record<string, unknown>[])
			.map((log) => {
				const college = getCollege(log.college);
				const actor = asRecord(log.actor);
				const occurredAt = asString(log.occurredAt, asString(log.createdAt));
				const eventType = asString(log.eventType);
				const hasStructuredAuditShape = Boolean(
					eventType ||
						asString(log.actorName) ||
						asString(log.actorRole) ||
						asString(log.targetLabel) ||
						asString(log.occurredAt),
				);

				return {
					id: asString(log.documentId, String(log.id ?? "")),
					collegeSlug: college.slug,
					collegeName: college.name || "Platform",
					actor:
						asString(log.actorName) ||
						asString(actor.username) ||
						asString(actor.email, "System"),
					actorEmail: asString(log.actorEmail, asString(actor.email)),
					role: asString(log.actorRole, "System"),
					activity: asString(log.action, "Activity"),
					target: asString(log.targetLabel, asString(log.entityType, "Record")),
					eventType: eventType || "updated",
					when: occurredAt,
					ipAddress: asString(log.ipAddress, "Unknown"),
					summary: asString(log.summary, "No audit summary was recorded."),
					hasStructuredAuditShape,
				};
			})
			.filter((row) => {
				const matchesCollege =
					!collegeSlug || collegeSlug === "all" || row.collegeSlug === collegeSlug;

				return (
					row.hasStructuredAuditShape &&
					matchesCollege &&
					inDateRange(row.when, from, to)
				);
			})
			.sort((left, right) => {
				const leftTime = toDate(left.when)?.getTime() ?? 0;
				const rightTime = toDate(right.when)?.getTime() ?? 0;
				return rightTime - leftTime;
			})
			.map((row) => ({
				id: row.id,
				collegeSlug: row.collegeSlug,
				collegeName: row.collegeName,
				actor: row.actor,
				actorEmail: row.actorEmail,
				role: row.role,
				activity: row.activity,
				target: row.target,
				eventType: row.eventType,
				when: row.when,
				ipAddress: row.ipAddress,
				summary: row.summary,
			}));

		const invoices = await strapi.db
			.query("api::payment-invoice.payment-invoice")
			.findMany({
				orderBy: { createdAt: "desc" },
				limit: 1000,
				populate: {
					college: true,
					transactions: true,
					admissionApplication: true,
				},
			});
		const paymentRows = (invoices as Record<string, unknown>[])
			.map(paymentRowFromInvoice)
			.filter((row): row is AuditRow => Boolean(row))
			.filter((row) => {
				const matchesCollege =
					!collegeSlug || collegeSlug === "all" || row.collegeSlug === collegeSlug;

				return matchesCollege && inDateRange(row.when, from, to);
			});
		const rows = [...logRows, ...paymentRows]
			.sort((left, right) => {
				const leftTime = toDate(left.when)?.getTime() ?? 0;
				const rightTime = toDate(right.when)?.getTime() ?? 0;
				return rightTime - leftTime;
			})
			.slice(0, 250);

		ctx.body = {
			generatedAt: new Date().toISOString(),
			events: rows,
		};
	},
};
