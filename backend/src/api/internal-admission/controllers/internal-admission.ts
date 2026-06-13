type StrapiContext = {
	request: {
		body?: unknown;
		header: Record<string, string | undefined>;
		query?: Record<string, string | undefined>;
	};
	params?: Record<string, string | undefined>;
	unauthorized: (message?: string) => unknown;
	badRequest?: (message?: string) => unknown;
	notFound?: (message?: string) => unknown;
	body: unknown;
};

type AdmissionStep =
	| "account"
	| "programme"
	| "payment"
	| "biodata"
	| "contact"
	| "olevel"
	| "programme_details"
	| "declaration"
	| "submitted";

type ApplicationStatus =
	| "draft"
	| "payment_pending"
	| "submitted"
	| "under_review"
	| "approved"
	| "rejected"
	| "cancelled";

type PaymentStatus =
	| "not_started"
	| "pending"
	| "paid"
	| "failed"
	| "cancelled"
	| "refunded";

type AdmissionApplicationPayload = {
	collegeSlug?: string;
	account?: {
		username?: string;
		email?: string;
	};
	programme?: {
		programmeType?: "undergraduate" | "topup" | "distance";
		facultyId?: string;
		entrySession?: string;
	};
	currentStep?: AdmissionStep;
	completedStep?: AdmissionStep;
	formData?: Record<string, unknown>;
	status?: ApplicationStatus;
	paymentStatus?: PaymentStatus;
};

const DEV_INTERNAL_SECRET =
	"iums-local-registration-secret-change-before-production";

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
	return Array.isArray(value) ? value : [];
}

function asObject(value: unknown) {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
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

function getCollege(value: unknown) {
	const college = asRecord(value);

	return {
		id: asNumber(college.id),
		name: asString(college.name),
		slug: asString(college.slug),
		code: asString(college.code),
	};
}

function getApplicationId(application: Record<string, unknown>) {
	return asString(application.documentId) || String(application.id ?? "");
}

function createApplicationNumber(collegeCode?: string) {
	const code = (collegeCode || "APP").replace(/[^a-z0-9]/gi, "").toUpperCase();
	const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
	return `APP-${code}-${Date.now()}-${randomPart}`;
}

function splitFacultyDepartment(value?: string) {
	const [facultyKey, departmentKey] = asString(value).split("::");

	return {
		facultyKey: facultyKey || asString(value),
		departmentKey: departmentKey || "",
	};
}

function mergeUniqueSteps(current: unknown, next?: AdmissionStep) {
	return Array.from(
		new Set([
			...asArray(current).filter((step): step is AdmissionStep => typeof step === "string"),
			...(next ? [next] : []),
		]),
	);
}

function mapApplication(application: Record<string, unknown>) {
	const college = getCollege(application.college);

	return {
		id: getApplicationId(application),
		documentId: asString(application.documentId) || undefined,
		numericId: asNumber(application.id) || undefined,
		applicationNumber:
			asString(application.applicationNumber) || getApplicationId(application),
		applicantUsername: asString(application.applicantUsername) || undefined,
		applicantEmail: asString(application.applicantEmail) || undefined,
		collegeId: college.id || undefined,
		collegeSlug: college.slug,
		status: asString(application.status, "draft"),
		paymentStatus: asString(application.paymentStatus, "not_started"),
		currentStep: asString(application.currentStep, "account"),
		completedSteps: asArray(application.completedSteps),
		lastSavedAt: asString(application.lastSavedAt, asString(application.updatedAt)),
		metadata: asRecord(application.metadata),
		persisted: true,
	};
}

async function findApplication(applicationId?: string) {
	if (!applicationId) {
		return null;
	}

	return strapi.db.query("api::admission-application.admission-application").findOne({
		where: {
			$or: [{ documentId: applicationId }, { id: Number(applicationId) || 0 }],
		},
		populate: { college: true },
	});
}

async function findLatestApplicationByEmail(collegeSlug: string, email: string) {
	return strapi.db.query("api::admission-application.admission-application").findOne({
		where: {
			applicantEmail: { $eqi: email },
			college: { slug: { $eq: collegeSlug } },
		},
		populate: { college: true },
		orderBy: { updatedAt: "desc" },
	});
}

async function updateApplicationEntity(
	application: Record<string, unknown>,
	input: AdmissionApplicationPayload,
) {
	const existingMetadata = asObject(application.metadata);
	const programme = input.programme;
	const payload: Record<string, unknown> = {
		...(input.account?.username ? { applicantUsername: input.account.username } : {}),
		...(input.account?.email ? { applicantEmail: input.account.email } : {}),
		...(input.status ? { status: input.status } : {}),
		...(input.paymentStatus ? { paymentStatus: input.paymentStatus } : {}),
		...(input.currentStep ? { currentStep: input.currentStep } : {}),
		completedSteps: mergeUniqueSteps(application.completedSteps, input.completedStep),
		lastSavedAt: new Date().toISOString(),
	};

	if (programme) {
		const { facultyKey, departmentKey } = splitFacultyDepartment(programme.facultyId);
		payload.programmeType = programme.programmeType;
		payload.facultyKey = facultyKey;
		payload.departmentKey = departmentKey;
		payload.entrySession = programme.entrySession;
	}

	payload.metadata = {
		...existingMetadata,
		collegeSlug: input.collegeSlug ?? asString(existingMetadata.collegeSlug),
		...(input.account
			? {
					account: {
						...asObject(existingMetadata.account),
						...input.account,
					},
				}
			: {}),
		...(programme ? { programmeSelection: programme } : {}),
		...(input.formData
			? {
					formData: {
						...asObject(existingMetadata.formData),
						...input.formData,
					},
				}
			: {}),
		source: existingMetadata.source ?? "tenant-admission-wizard",
	};

	const updated = await strapi.db
		.query("api::admission-application.admission-application")
		.update({
			where: { id: application.id },
			data: payload,
			populate: { college: true },
		});

	return mapApplication(updated as Record<string, unknown>);
}

export default {
	async list(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Admission application lookup is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);

		if (!collegeSlug) {
			return ctx.badRequest?.("College slug is required.");
		}

		const limit = Math.min(Math.max(asNumber(ctx.request.query?.limit) || 100, 1), 500);
		const status = asString(ctx.request.query?.status);
		const paymentStatus = asString(ctx.request.query?.paymentStatus);
		const currentStep = asString(ctx.request.query?.currentStep);
		const email = asString(ctx.request.query?.email);
		const search = asString(ctx.request.query?.search).toLowerCase();
		const from = asString(ctx.request.query?.from);
		const to = asString(ctx.request.query?.to);
		const filters: Record<string, unknown> = {
			college: { slug: { $eq: collegeSlug } },
		};

		if (status) {
			filters.status = { $eq: status };
		}

		if (paymentStatus) {
			filters.paymentStatus = { $eq: paymentStatus };
		}

		if (currentStep) {
			filters.currentStep = { $eq: currentStep };
		}

		if (email) {
			filters.applicantEmail = { $eqi: email };
		}

		const applications = await strapi.db
			.query("api::admission-application.admission-application")
			.findMany({
				where: filters,
				populate: { college: true },
				orderBy: { lastSavedAt: "desc" },
				limit,
			});

		const rows = (applications as Record<string, unknown>[])
			.map(mapApplication)
			.filter((application) => {
				const haystack = [
					application.applicationNumber,
					application.applicantUsername,
					application.applicantEmail,
					JSON.stringify(application.metadata),
				]
					.join(" ")
					.toLowerCase();

				return (
					(!search || haystack.includes(search)) &&
					inDateRange(application.lastSavedAt, from, to)
				);
			});

		ctx.body = {
			applications: rows,
			count: rows.length,
			generatedAt: new Date().toISOString(),
		};
	},

	async create(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Admission application persistence is not authorized.");
		}

		const input = (ctx.request.body ?? {}) as AdmissionApplicationPayload;
		const collegeSlug = asString(input.collegeSlug);
		const email = asString(input.account?.email);

		if (!collegeSlug || !email || !input.account?.username || !input.programme) {
			return ctx.badRequest?.("Complete admission application details are required.");
		}

		const existing = await findLatestApplicationByEmail(collegeSlug, email);

		if (
			existing &&
			!["cancelled", "rejected"].includes(asString(existing.status))
		) {
			const application = await updateApplicationEntity(existing as Record<string, unknown>, {
				...input,
				status: asString(existing.status) === "draft" ? "payment_pending" : input.status,
				paymentStatus:
					asString(existing.paymentStatus) === "not_started"
						? "pending"
						: input.paymentStatus,
				currentStep: ["account", "programme"].includes(asString(existing.currentStep))
					? "payment"
					: input.currentStep,
				completedStep: "programme",
			});

			ctx.body = { application };
			return;
		}

		const college = await strapi.db.query("api::college.college").findOne({
			where: { slug: collegeSlug },
		});

		if (!college?.id) {
			return ctx.badRequest?.("Selected college could not be resolved.");
		}

		const { facultyKey, departmentKey } = splitFacultyDepartment(input.programme.facultyId);
		const savedAt = new Date().toISOString();
		const created = await strapi.db
			.query("api::admission-application.admission-application")
			.create({
				data: {
					applicationNumber: createApplicationNumber(asString(college.code)),
					applicantUsername: input.account.username,
					applicantEmail: email,
					programmeType: input.programme.programmeType,
					facultyKey,
					departmentKey,
					entrySession: input.programme.entrySession,
					status: "payment_pending",
					paymentStatus: "pending",
					currentStep: "payment",
					completedSteps: ["programme"],
					lastSavedAt: savedAt,
					college: college.id,
					metadata: {
						collegeSlug,
						account: input.account,
						programmeSelection: input.programme,
						source: "tenant-admission-wizard",
					},
				},
				populate: { college: true },
			});

		ctx.body = { application: mapApplication(created as Record<string, unknown>) };
	},

	async update(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Admission application persistence is not authorized.");
		}

		const application = await findApplication(ctx.params?.id);

		if (!application) {
			return ctx.notFound?.("Admission application could not be found.");
		}

		const updated = await updateApplicationEntity(
			application as Record<string, unknown>,
			(ctx.request.body ?? {}) as AdmissionApplicationPayload,
		);

		ctx.body = { application: updated };
	},
};
