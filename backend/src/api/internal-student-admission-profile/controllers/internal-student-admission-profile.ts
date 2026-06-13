type StrapiContext = {
	request: {
		body?: unknown;
		header: Record<string, string | undefined>;
		query?: Record<string, string | undefined>;
	};
	unauthorized: (message?: string) => unknown;
	badRequest: (message?: string) => unknown;
	notFound?: (message?: string) => unknown;
	body: unknown;
};

type AdmissionProfileStep =
	| "bioData"
	| "contactData"
	| "oLevelData"
	| "programmeData"
	| "declarationData";

const DEV_INTERNAL_SECRET =
	"iums-local-registration-secret-change-before-production";

const STEP_TO_CURRENT_STEP: Record<AdmissionProfileStep, string> = {
	bioData: "biodata",
	contactData: "contact",
	oLevelData: "olevel",
	programmeData: "programme_details",
	declarationData: "declaration",
};
const REQUIRED_PROFILE_STEPS: AdmissionProfileStep[] = [
	"bioData",
	"contactData",
	"oLevelData",
	"programmeData",
	"declarationData",
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

function getApplicationId(application: Record<string, unknown>) {
	return asString(application.documentId) || String(application.id ?? "");
}

function createApplicationNumber(collegeCode?: string) {
	const code = (collegeCode || "APP").replace(/[^a-z0-9]/gi, "").toUpperCase();
	const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
	return `APP-${code}-${Date.now()}-${randomPart}`;
}

function createAdmissionReferenceNumber(collegeCode?: string) {
	const code = (collegeCode || "ADM").replace(/[^a-z0-9]/gi, "").toUpperCase();
	const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
	return `ADM-${code}-${Date.now()}-${randomPart}`;
}

function normalizeStep(value: unknown): AdmissionProfileStep | null {
	const step = asString(value);

	return [
		"bioData",
		"contactData",
		"oLevelData",
		"programmeData",
		"declarationData",
	].includes(step)
		? (step as AdmissionProfileStep)
		: null;
}

function getChangedFields(payload: Record<string, unknown>) {
	return Object.keys(payload).filter((key) => payload[key] !== undefined);
}

function isPersistedPhotoSource(value: unknown) {
	const photo = asString(value);

	return (
		photo.startsWith("http://") ||
		photo.startsWith("https://") ||
		photo.startsWith("/uploads/")
	);
}

function mergeUniqueSteps(existing: unknown, nextStep: string) {
	return Array.from(new Set([...asArray(existing).map(String), nextStep]));
}

function hasCompleteAdmissionProfile(profile: Record<string, unknown>) {
	return REQUIRED_PROFILE_STEPS.every(
		(step) => Object.keys(asRecord(profile[step])).length > 0,
	);
}

function flattenAdmissionProfile(profile: Record<string, unknown>) {
	const bioData = asRecord(profile.bioData);
	const contactData = asRecord(profile.contactData);
	const oLevelData = asRecord(profile.oLevelData);
	const programmeData = asRecord(profile.programmeData);
	const declarationData = asRecord(profile.declarationData);

	return {
		...bioData,
		...contactData,
		...oLevelData,
		...programmeData,
		...declarationData,
		lga: bioData.localGovtArea,
		phone: contactData.phoneNumber,
		altPhone: contactData.alternatePhone,
		email: contactData.emailAddress,
		address: contactData.residentialAddress,
		guardianName: contactData.guardianFullName,
		examType: oLevelData.examinationType,
		examYear: oLevelData.examinationYear,
		examNumber: oLevelData.examinationNumber,
		entryMode: programmeData.modeOfEntry,
		secondChoiceProgramme: programmeData.secondChoice,
		interestedInCisco: programmeData.ciscoInterest,
		agreedToDeclaration: declarationData.agreed,
		declarationDate: declarationData.date,
	};
}

function getProgrammeType(value: unknown) {
	const text = asString(value).toLowerCase();
	if (text.includes("top")) return "topup";
	if (text.includes("distance")) return "distance";
	return "undergraduate";
}

function mapApplication(application: Record<string, unknown>, collegeSlug: string) {
	const metadata = asRecord(application.metadata);
	const admissionProfile = asRecord(metadata.admissionProfile);
	const isComplete = hasCompleteAdmissionProfile(admissionProfile);
	const currentStep = asString(application.currentStep, "account");
	const admissionReferenceNumber =
		asString(application.admissionReferenceNumber) ||
		asString(metadata.admissionReferenceNumber) ||
		undefined;
	const effectiveCurrentStep =
		currentStep === "submitted" && !isComplete
			? "biodata"
			: currentStep === "submitted" && !admissionReferenceNumber
				? "declaration"
				: currentStep;

	return {
		id: getApplicationId(application),
		documentId: asString(application.documentId) || undefined,
		numericId: asNumber(application.id) || undefined,
		applicationNumber:
			asString(application.applicationNumber) || getApplicationId(application),
		admissionReferenceNumber,
		applicantUsername: asString(application.applicantUsername) || undefined,
		applicantEmail: asString(application.applicantEmail) || undefined,
		collegeId: asNumber(asRecord(application.college).id) || undefined,
		collegeSlug,
		status: asString(application.status, "draft"),
		paymentStatus: asString(application.paymentStatus, "not_started"),
		currentStep: effectiveCurrentStep,
		completedSteps: asArray(application.completedSteps),
		lastSavedAt: asString(application.lastSavedAt, asString(application.updatedAt)),
		metadata,
		persisted: true,
	};
}

async function findCollegeBySlug(collegeSlug: string) {
	return strapi.db.query("api::college.college").findOne({
		where: { slug: collegeSlug },
	});
}

async function findStudentUser(student: Record<string, unknown>) {
	const strapiUserId = asNumber(student.strapiUserId);
	const email = normalizeEmail(student.email);

	if (strapiUserId) {
		const user = await strapi.db.query("plugin::users-permissions.user").findOne({
			where: { id: strapiUserId },
		});

		if (user) {
			return user as Record<string, unknown>;
		}
	}

	if (!email) {
		return null;
	}

	return strapi.db.query("plugin::users-permissions.user").findOne({
		where: { email },
	});
}

async function findApplication(collegeId: number, email: string, applicantId?: number) {
	const applications = await strapi.db
		.query("api::admission-application.admission-application")
		.findMany({
			where: {
				college: collegeId,
				applicantEmail: { $eqi: email },
			},
			populate: { college: true, applicant: true },
			orderBy: { updatedAt: "desc" },
			limit: 1,
		});

	if (applications[0]) {
		return applications[0] as Record<string, unknown>;
	}

	if (!applicantId) {
		return null;
	}

	const byApplicant = await strapi.db
		.query("api::admission-application.admission-application")
		.findMany({
			where: {
				college: collegeId,
				applicant: applicantId,
			},
			populate: { college: true, applicant: true },
			orderBy: { updatedAt: "desc" },
			limit: 1,
		});

	return (byApplicant[0] as Record<string, unknown>) ?? null;
}

async function createAuditLog(input: {
	collegeId: number;
	actor?: Record<string, unknown> | null;
	action: string;
	eventType?: string;
	entityId?: string;
	targetLabel?: string;
	summary: string;
	metadata?: Record<string, unknown>;
}) {
	try {
		await strapi.db.query("api::audit-log.audit-log").create({
			data: {
				action: input.action,
				eventType: input.eventType ?? "updated",
				actorName: asString(input.actor?.username) || asString(input.actor?.email),
				actorEmail: asString(input.actor?.email) || undefined,
				actorRole: "student",
				entityType: "admission-application",
				entityId: input.entityId,
				targetLabel: input.targetLabel,
				summary: input.summary,
				metadata: input.metadata ?? {},
				occurredAt: new Date().toISOString(),
				...(asNumber(input.actor?.id) ? { actor: asNumber(input.actor?.id) } : {}),
				college: input.collegeId,
			},
		});
	} catch (error) {
		strapi.log.warn(
			`[internal-student-admission-profile] Audit write failed: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		);
	}
}

async function resolveContext(ctx: StrapiContext, body?: Record<string, unknown>) {
	const query = ctx.request.query ?? {};
	const collegeSlug = asString(body?.collegeSlug ?? query.collegeSlug);
	const student = asRecord(body?.student);
	const email = normalizeEmail(student.email ?? query.email);

	if (!collegeSlug) {
		return { error: ctx.badRequest("College slug is required.") };
	}

	if (!email) {
		return { error: ctx.badRequest("Student email is required.") };
	}

	const college = await findCollegeBySlug(collegeSlug);

	if (!college?.id) {
		return {
			error:
				ctx.notFound?.("College could not be found.") ??
				ctx.badRequest("College could not be found."),
		};
	}

	if (asString((college as Record<string, unknown>).status, "active") !== "active") {
		return { error: ctx.badRequest("College is inactive.") };
	}

	const user =
		(await findStudentUser(student)) ??
		({
			id: asNumber(student.strapiUserId),
			username: asString(student.username),
			email,
		} as Record<string, unknown>);
	const application = await findApplication(
		asNumber((college as Record<string, unknown>).id),
		email,
		asNumber(user.id),
	);

	return {
		college: college as Record<string, unknown>,
		collegeSlug,
		email,
		user,
		application,
	};
}

async function ensureApplication(input: {
	college: Record<string, unknown>;
	collegeSlug: string;
	email: string;
	user: Record<string, unknown>;
	application?: Record<string, unknown> | null;
}) {
	if (input.application) {
		return input.application;
	}

	const now = new Date().toISOString();
	const collegeId = asNumber(input.college.id);
	const applicationNumber = createApplicationNumber(asString(input.college.code));
	const created = await strapi.db
		.query("api::admission-application.admission-application")
		.create({
			data: {
				applicationNumber,
				applicantUsername:
					asString(input.user.username) || asString(input.user.email) || input.email,
				applicantEmail: input.email,
				programmeType: "undergraduate",
				status: "draft",
				paymentStatus: "not_started",
				currentStep: "biodata",
				completedSteps: [],
				lastSavedAt: now,
				college: collegeId,
				...(asNumber(input.user.id) ? { applicant: asNumber(input.user.id) } : {}),
				metadata: {
					collegeSlug: input.collegeSlug,
					account: {
						username: asString(input.user.username),
						email: input.email,
					},
					source: "student-admission-profile",
				},
			},
			populate: { college: true, applicant: true },
		});

	await createAuditLog({
		collegeId,
		actor: input.user,
		action: "student.admission.created",
		eventType: "created",
		entityId: getApplicationId(created as Record<string, unknown>),
		targetLabel: applicationNumber,
		summary: "Student admission profile draft created.",
		metadata: { collegeSlug: input.collegeSlug },
	});

	return created as Record<string, unknown>;
}

export default {
	async find(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Student admission profile access is not authorized.");
		}

		const resolved = await resolveContext(ctx);

		if ("error" in resolved) {
			return resolved.error;
		}

		ctx.body = {
			application: resolved.application
				? mapApplication(resolved.application, resolved.collegeSlug)
				: null,
			generatedAt: new Date().toISOString(),
		};
	},

	async saveStep(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Student admission profile access is not authorized.");
		}

		const body = asRecord(ctx.request.body);
		const step = normalizeStep(body.step);
		const payload = asRecord(body.payload);

		if (!step) {
			return ctx.badRequest("Valid admission profile step is required.");
		}

		if (!Object.keys(payload).length) {
			return ctx.badRequest("Admission step payload is required.");
		}

		if (step === "bioData" && !isPersistedPhotoSource(payload.passportPhoto)) {
			return ctx.badRequest("Upload a valid passport photograph before continuing.");
		}

		const resolved = await resolveContext(ctx, body);

		if ("error" in resolved) {
			return resolved.error;
		}

		const application = await ensureApplication(resolved);
		const metadata = asRecord(application.metadata);
		const admissionProfile = {
			...asRecord(metadata.admissionProfile),
			[step]: payload,
		};
		const currentStep = STEP_TO_CURRENT_STEP[step];
		const completedSteps = mergeUniqueSteps(application.completedSteps, currentStep);
		const now = new Date().toISOString();
		const status = asString(application.status, "draft");
		const programmeData = asRecord(admissionProfile.programmeData);
		const isComplete = hasCompleteAdmissionProfile(admissionProfile);
		const nextStatus =
			["under_review", "approved", "rejected"].includes(status) ||
			(status === "submitted" && isComplete)
				? status
				: "draft";
		const response = await strapi.db
			.query("api::admission-application.admission-application")
			.update({
				where: { id: asNumber(application.id) },
				data: {
					currentStep,
					completedSteps,
					lastSavedAt: now,
					status: nextStatus,
					...(step === "programmeData"
						? {
								programmeType: getProgrammeType(programmeData.programmeType),
								facultyKey: asString(programmeData.faculty),
								departmentKey: asString(programmeData.department),
								entrySession: asString(programmeData.jambYear, "2026/2027"),
							}
						: {}),
					metadata: {
						...metadata,
						collegeSlug: resolved.collegeSlug,
						admissionProfile,
						formData: flattenAdmissionProfile(admissionProfile),
						source: "student-admission-profile",
						lastDraftStep: step,
					},
				},
				populate: { college: true, applicant: true },
			});

		await createAuditLog({
			collegeId: asNumber(resolved.college.id),
			actor: resolved.user,
			action: `student.admission.${step}.saved`,
			entityId: getApplicationId(response as Record<string, unknown>),
			targetLabel: asString(response.applicationNumber),
			summary: `Student saved ${currentStep} admission profile step.`,
			metadata: {
				step,
				changedFields: getChangedFields(payload),
			},
		});

		ctx.body = {
			application: mapApplication(
				response as Record<string, unknown>,
				resolved.collegeSlug,
			),
			savedStep: step,
			generatedAt: now,
		};
	},

	async submit(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Student admission profile access is not authorized.");
		}

		const body = asRecord(ctx.request.body);
		const resolved = await resolveContext(ctx, body);

		if ("error" in resolved) {
			return resolved.error;
		}

		const application = await ensureApplication(resolved);
		const metadata = asRecord(application.metadata);
		const admissionProfile = asRecord(metadata.admissionProfile);
		const missingSteps = REQUIRED_PROFILE_STEPS.filter(
			(step) => !Object.keys(asRecord(admissionProfile[step])).length,
		);

		if (missingSteps.length) {
			return ctx.badRequest(`Missing admission profile step: ${missingSteps[0]}.`);
		}

		const now = new Date().toISOString();
		const admissionReferenceNumber =
			asString(application.admissionReferenceNumber) ||
			asString(metadata.admissionReferenceNumber) ||
			createAdmissionReferenceNumber(asString(resolved.college.code));
		const response = await strapi.db
			.query("api::admission-application.admission-application")
			.update({
				where: { id: asNumber(application.id) },
				data: {
					admissionReferenceNumber,
					status: "submitted",
					currentStep: "submitted",
					completedSteps: [
						"biodata",
						"contact",
						"olevel",
						"programme_details",
						"declaration",
						"submitted",
					],
					lastSavedAt: now,
					submittedAt: now,
					metadata: {
						...metadata,
						collegeSlug: resolved.collegeSlug,
						admissionProfile,
						formData: flattenAdmissionProfile(admissionProfile),
						source: "student-admission-profile",
						admissionReferenceNumber,
						submittedBy: normalizeEmail(resolved.user.email),
					},
				},
				populate: { college: true, applicant: true },
			});

		await createAuditLog({
			collegeId: asNumber(resolved.college.id),
			actor: resolved.user,
			action: "student.admission.submitted",
			eventType: "updated",
			entityId: getApplicationId(response as Record<string, unknown>),
			targetLabel: admissionReferenceNumber,
			summary: "Student submitted complete admission profile.",
			metadata: {
				steps: REQUIRED_PROFILE_STEPS,
				registrationNumber: asString(response.applicationNumber),
				admissionReferenceNumber,
			},
		});

		ctx.body = {
			application: mapApplication(
				response as Record<string, unknown>,
				resolved.collegeSlug,
			),
			generatedAt: now,
		};
	},
};
