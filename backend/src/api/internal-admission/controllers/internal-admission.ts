type StrapiContext = {
	request: {
		header: Record<string, string | undefined>;
		query?: Record<string, string | undefined>;
	};
	unauthorized: (message?: string) => unknown;
	badRequest?: (message?: string) => unknown;
	body: unknown;
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
};
