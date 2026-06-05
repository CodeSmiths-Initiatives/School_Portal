import {
	STRAPI_ENDPOINTS,
	getRelationId,
	strapiGet,
	strapiPost,
	strapiPut,
	unwrapStrapiCollection,
	unwrapStrapiEntity,
	type StrapiCollectionResponse,
	type StrapiQueryValue,
	type StrapiSingleResponse,
} from "@/lib/api";
import {
	FALLBACK_ADMISSION_COLLEGES,
	getAdmissionCollegeBySlug,
} from "@/lib/services/admission-college.service";
import {
	getActiveColleges,
	type CollegeSummary,
} from "@/lib/services/college.service";
import type { AdmissionApplicationRequestInput } from "@/lib/validation";
import type {
	AdmissionApplicationDraftRequestInput,
	AdmissionApplicationListQueryInput,
	AdmissionApplicationStep,
	AdmissionApplicationUpdateRequestInput,
} from "@/lib/validation";

export type AdmissionApplicationSummary = {
	id: string;
	documentId?: string;
	numericId?: number;
	applicationNumber: string;
	applicantUsername?: string;
	applicantEmail?: string;
	collegeId?: string | number;
	collegeSlug: string;
	status: "draft" | "payment_pending" | "submitted" | "under_review" | "approved" | "rejected" | "cancelled";
	paymentStatus: "not_started" | "pending" | "paid" | "failed" | "cancelled" | "refunded";
	currentStep?: AdmissionApplicationStep;
	completedSteps?: AdmissionApplicationStep[];
	lastSavedAt?: string;
	metadata?: Record<string, unknown>;
	persisted: boolean;
	reason?: string;
};

type StrapiAdmissionApplication = Record<string, unknown> & {
	applicationNumber?: unknown;
	applicantUsername?: unknown;
	applicantEmail?: unknown;
	status?: unknown;
	paymentStatus?: unknown;
	currentStep?: unknown;
	completedSteps?: unknown;
	lastSavedAt?: unknown;
	metadata?: unknown;
	college?: unknown;
};

function hasPersistenceToken() {
	return Boolean(process.env.STRAPI_API_TOKEN?.trim());
}

function createApplicationNumber(collegeCode?: string) {
	const code = (collegeCode || "APP").replace(/[^a-z0-9]/gi, "").toUpperCase();
	const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
	return `APP-${code}-${Date.now()}-${randomPart}`;
}

function splitFacultyDepartment(value: string) {
	const [facultyKey, departmentKey] = value.split("::");

	return {
		facultyKey: facultyKey || value,
		departmentKey: departmentKey || "",
	};
}

function asApplicationStatus(value: unknown): AdmissionApplicationSummary["status"] {
	return [
		"draft",
		"payment_pending",
		"submitted",
		"under_review",
		"approved",
		"rejected",
		"cancelled",
	].includes(String(value))
		? (value as AdmissionApplicationSummary["status"])
		: "draft";
}

function asPaymentStatus(
	value: unknown,
): AdmissionApplicationSummary["paymentStatus"] {
	return ["not_started", "pending", "paid", "failed", "cancelled", "refunded"].includes(
		String(value),
	)
		? (value as AdmissionApplicationSummary["paymentStatus"])
		: "not_started";
}

function asCurrentStep(value: unknown): AdmissionApplicationStep | undefined {
	return [
		"account",
		"programme",
		"payment",
		"biodata",
		"contact",
		"olevel",
		"programme_details",
		"declaration",
		"submitted",
	].includes(String(value))
		? (value as AdmissionApplicationStep)
		: undefined;
}

function asCompletedSteps(value: unknown): AdmissionApplicationStep[] {
	return Array.isArray(value)
		? value.filter((step): step is AdmissionApplicationStep => Boolean(asCurrentStep(step)))
		: [];
}

function asMetadata(value: unknown): Record<string, unknown> {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function toAdmissionApplicationSummary(
	application: ReturnType<typeof unwrapStrapiEntity<StrapiAdmissionApplication>>,
	collegeSlug: string,
	collegeId?: string | number,
): AdmissionApplicationSummary {
	return {
		id: application.id,
		documentId: application.documentId,
		numericId: application.numericId,
		applicationNumber:
			typeof application.applicationNumber === "string"
				? application.applicationNumber
				: application.id,
		applicantUsername:
			typeof application.applicantUsername === "string"
				? application.applicantUsername
				: undefined,
		applicantEmail:
			typeof application.applicantEmail === "string"
				? application.applicantEmail
				: undefined,
		collegeId: getRelationId(application.college) ?? collegeId,
		collegeSlug,
		status: asApplicationStatus(application.status),
		paymentStatus: asPaymentStatus(application.paymentStatus),
		currentStep: asCurrentStep(application.currentStep),
		completedSteps: asCompletedSteps(application.completedSteps),
		lastSavedAt:
			typeof application.lastSavedAt === "string"
				? application.lastSavedAt
				: undefined,
		metadata: asMetadata(application.metadata),
		persisted: true,
	};
}

function relationId(
	entity?: { numericId?: number; documentId?: string; id?: string } | null,
) {
	return entity?.numericId ?? entity?.documentId ?? entity?.id;
}

async function getPersistableCollege(slug: string) {
	try {
		const colleges = await getActiveColleges({
			cache: "no-store",
			query: {
				filters: { slug: { $eq: slug } },
				pagination: { page: 1, pageSize: 1 },
			},
		});

		return colleges[0] ?? null;
	} catch {
		return null;
	}
}

async function getApplicationCollege(slug: string) {
	if (hasPersistenceToken()) {
		return getPersistableCollege(slug);
	}

	return getAdmissionCollegeBySlug(slug);
}

async function findLatestApplicationByEmail(
	collegeSlug: string,
	email: string,
): Promise<AdmissionApplicationSummary | null> {
	if (!hasPersistenceToken()) {
		return null;
	}

	const response = await strapiGet<
		StrapiCollectionResponse<StrapiAdmissionApplication>
	>(STRAPI_ENDPOINTS.admissionApplications, {
		cache: "no-store",
		query: {
			filters: {
				applicantEmail: { $eqi: email },
				college: { slug: { $eq: collegeSlug } },
			},
			sort: ["updatedAt:desc"],
			pagination: { page: 1, pageSize: 1 },
			populate: ["college"],
		},
	});

	const application = unwrapStrapiCollection(response.data)[0];
	return application
		? toAdmissionApplicationSummary(application, collegeSlug)
		: null;
}

function getCollegeCode(
	slug: string,
	college?: Pick<CollegeSummary, "code"> | { code?: string } | null,
) {
	return (
		college?.code ??
		FALLBACK_ADMISSION_COLLEGES.find((option) => option.slug === slug)?.code
	);
}

export async function createAdmissionApplicationRecord(
	input: AdmissionApplicationRequestInput,
): Promise<AdmissionApplicationSummary> {
	const draft = await createAdmissionApplicationDraftRecord({
		collegeSlug: input.collegeSlug,
		account: input.account,
	});

	if (!draft.persisted) {
		return {
			...draft,
			status: "payment_pending",
			paymentStatus: "pending",
			currentStep: "payment",
			metadata: {
				...(draft.metadata ?? {}),
				programmeSelection: input.programme,
			},
		};
	}

	return updateAdmissionApplicationRecord(draft.id, {
		collegeSlug: input.collegeSlug,
		programme: input.programme,
		status: "payment_pending",
		paymentStatus: "pending",
		currentStep: "payment",
		completedStep: "programme",
	});
}

export async function createAdmissionApplicationDraftRecord(
	input: AdmissionApplicationDraftRequestInput,
): Promise<AdmissionApplicationSummary> {
	const college = await getApplicationCollege(input.collegeSlug);
	const applicationNumber = createApplicationNumber(
		getCollegeCode(input.collegeSlug, college),
	);
	const collegeId = relationId(college);
	const existingApplication = await findLatestApplicationByEmail(
		input.collegeSlug,
		input.account.email,
	);

	if (
		existingApplication &&
		existingApplication.status !== "cancelled" &&
		existingApplication.status !== "rejected"
	) {
		return existingApplication;
	}

	if (!hasPersistenceToken()) {
		return {
			id: applicationNumber,
			applicationNumber,
			collegeId,
			collegeSlug: input.collegeSlug,
			status: "draft",
			paymentStatus: "not_started",
			currentStep: "account",
			completedSteps: ["account"],
			lastSavedAt: new Date().toISOString(),
			persisted: false,
			reason: "STRAPI_API_TOKEN is not configured.",
		};
	}

	if (!college || !collegeId) {
		return {
			id: applicationNumber,
			applicationNumber,
			collegeSlug: input.collegeSlug,
			status: "draft",
			paymentStatus: "not_started",
			currentStep: "account",
			completedSteps: ["account"],
			lastSavedAt: new Date().toISOString(),
			persisted: false,
			reason: "Selected college could not be resolved in Strapi.",
		};
	}

	try {
		const savedAt = new Date().toISOString();
		const response = await strapiPost<
			StrapiSingleResponse<StrapiAdmissionApplication>
		>(STRAPI_ENDPOINTS.admissionApplications, {
			data: {
				applicationNumber,
				applicantUsername: input.account.username,
				applicantEmail: input.account.email,
				status: "draft",
				paymentStatus: "not_started",
				currentStep: "account",
				completedSteps: ["account"],
				lastSavedAt: savedAt,
				college: collegeId,
				metadata: {
					collegeSlug: input.collegeSlug,
					account: {
						username: input.account.username,
						email: input.account.email,
					},
					source: "tenant-admission-wizard",
				},
			},
		});

		if (!response.data) {
			throw new Error("Strapi did not return the created application record.");
		}

		const application = unwrapStrapiEntity(response.data);
		return toAdmissionApplicationSummary(application, input.collegeSlug, collegeId);
	} catch (error) {
		return {
			id: applicationNumber,
			applicationNumber,
			collegeId,
			collegeSlug: input.collegeSlug,
			status: "draft",
			paymentStatus: "not_started",
			currentStep: "account",
			completedSteps: ["account"],
			lastSavedAt: new Date().toISOString(),
			persisted: false,
			reason:
				error instanceof Error
					? error.message
					: "Unable to create admission application.",
		};
	}
}

export async function updateAdmissionApplicationRecord(
	applicationId: string,
	input: AdmissionApplicationUpdateRequestInput,
): Promise<AdmissionApplicationSummary> {
	const college = await getApplicationCollege(input.collegeSlug);
	const collegeId = relationId(college);

	if (!hasPersistenceToken()) {
		return {
			id: applicationId,
			applicationNumber: applicationId,
			collegeId,
			collegeSlug: input.collegeSlug,
			status: input.status ?? "draft",
			paymentStatus: input.paymentStatus ?? "not_started",
			currentStep: input.currentStep,
			completedSteps: input.completedStep ? [input.completedStep] : [],
			lastSavedAt: new Date().toISOString(),
			metadata: input.formData ? { formData: input.formData } : undefined,
			persisted: false,
			reason: "STRAPI_API_TOKEN is not configured.",
		};
	}

	const existing = await strapiGet<StrapiSingleResponse<StrapiAdmissionApplication>>(
		`${STRAPI_ENDPOINTS.admissionApplications}/${applicationId}`,
		{
			cache: "no-store",
			query: { populate: ["college"] },
		},
	);
	const existingApplication = existing.data
		? unwrapStrapiEntity(existing.data)
		: null;

	if (!existingApplication) {
		throw new Error("Admission application could not be found.");
	}

	const existingMetadata = asMetadata(existingApplication.metadata);
	const completedSteps = new Set([
		...asCompletedSteps(existingApplication.completedSteps),
		...(input.completedStep ? [input.completedStep] : []),
	]);
	const payload: Record<string, unknown> = {
		...(input.account?.username ? { applicantUsername: input.account.username } : {}),
		...(input.account?.email ? { applicantEmail: input.account.email } : {}),
		...(input.status ? { status: input.status } : {}),
		...(input.paymentStatus ? { paymentStatus: input.paymentStatus } : {}),
		...(input.currentStep ? { currentStep: input.currentStep } : {}),
		completedSteps: Array.from(completedSteps),
		lastSavedAt: new Date().toISOString(),
	};

	if (input.programme) {
		const { facultyKey, departmentKey } = splitFacultyDepartment(
			input.programme.facultyId,
		);
		payload.programmeType = input.programme.programmeType;
		payload.facultyKey = facultyKey;
		payload.departmentKey = departmentKey;
		payload.entrySession = input.programme.entrySession;
	}

	payload.metadata = {
		...existingMetadata,
		collegeSlug: input.collegeSlug,
		...(input.account
			? {
					account: {
						...(asMetadata(existingMetadata.account)),
						...input.account,
					},
				}
			: {}),
		...(input.programme ? { programmeSelection: input.programme } : {}),
		...(input.formData
			? {
					formData: {
						...(asMetadata(existingMetadata.formData)),
						...input.formData,
					},
				}
			: {}),
		source: existingMetadata.source ?? "tenant-admission-wizard",
	};

	const response = await strapiPut<StrapiSingleResponse<StrapiAdmissionApplication>>(
		`${STRAPI_ENDPOINTS.admissionApplications}/${applicationId}`,
		{ data: payload },
		{
			query: { populate: ["college"] },
		},
	);

	if (!response.data) {
		throw new Error("Strapi did not return the updated application record.");
	}

	return toAdmissionApplicationSummary(
		unwrapStrapiEntity(response.data),
		input.collegeSlug,
		collegeId,
	);
}

export async function listAdmissionApplicationRecords(
	input: AdmissionApplicationListQueryInput,
): Promise<AdmissionApplicationSummary[]> {
	if (!hasPersistenceToken()) {
		return [];
	}

	const filters: Record<string, StrapiQueryValue> = {
		college: { slug: { $eq: input.collegeSlug } },
	};

	if (input.email) {
		filters.applicantEmail = { $eqi: input.email };
	}

	if (input.status) {
		filters.status = { $eq: input.status };
	}

	const response = await strapiGet<
		StrapiCollectionResponse<StrapiAdmissionApplication>
	>(STRAPI_ENDPOINTS.admissionApplications, {
		cache: "no-store",
		query: {
			filters,
			sort: ["updatedAt:desc"],
			pagination: { page: 1, pageSize: input.limit },
			populate: ["college"],
		},
	});

	return unwrapStrapiCollection(response.data).map((application) =>
		toAdmissionApplicationSummary(application, input.collegeSlug),
	);
}
