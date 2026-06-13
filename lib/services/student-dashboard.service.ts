import {
	asString,
	strapiGet,
	unwrapStrapiCollection,
	type StrapiCollectionResponse,
} from "@/lib/api";
import type { AuthSession } from "@/lib/auth/accounts";
import type { AdmissionApplicationSummary } from "@/lib/services/admission-application.service";
import { getPaymentLedgerRecords } from "@/lib/services/payment-ledger.service";
import { getStudentAdmissionProfile } from "@/lib/services/student-admission-profile.service";

export type StudentDashboardCourse = {
	id: string;
	code: string;
	title: string;
	level: number;
	semester: string;
	creditUnits: number;
	status: string;
};

export type StudentDashboardNotice = {
	title: string;
	message: string;
	tone: "info" | "success" | "warning" | "critical";
	meta: string;
};

export type StudentDashboardChartPoint = {
	label: string;
	value: number;
	amount: string;
};

export type StudentDashboardData = {
	studentName: string;
	email: string;
	collegeName: string;
	admission: AdmissionApplicationSummary | null;
	applicationNumber: string;
	admissionStatus: string;
	paymentStatus: string;
	currentStage: string;
	profileCompletion: number;
	completedProfileSections: number;
	totalProfileSections: number;
	paymentSummary: {
		totalInvoiced: number;
		totalPaid: number;
		pendingAmount: number;
		failedCount: number;
		currency: string;
		latestInvoice?: {
			invoiceNumber: string;
			description: string;
			status: string;
			amount: number;
			createdAt: string;
		};
	};
	courses: StudentDashboardCourse[];
	notices: StudentDashboardNotice[];
	charts: {
		admissionProgress: StudentDashboardChartPoint[];
		paymentMix: StudentDashboardChartPoint[];
		courseLoad: StudentDashboardChartPoint[];
	};
	generatedAt: string;
};

type StrapiCourse = Record<string, unknown> & {
	code?: unknown;
	title?: unknown;
	level?: unknown;
	semester?: unknown;
	creditUnits?: unknown;
	status?: unknown;
};

const PROFILE_SECTION_REQUIREMENTS = {
	bioData: [
		"surname",
		"firstName",
		"dateOfBirth",
		"gender",
		"nationality",
		"stateOfOrigin",
		"localGovtArea",
		"passportPhoto",
	],
	contactData: [
		"phoneNumber",
		"emailAddress",
		"residentialAddress",
		"guardianFullName",
		"guardianRelationship",
		"guardianPhone",
	],
	oLevelData: [
		"examinationType",
		"examinationYear",
		"examinationNumber",
		"centreNumber",
		"subjects",
	],
	programmeData: [
		"faculty",
		"department",
		"modeOfEntry",
		"programmeType",
		"jambRegNumber",
		"jambScore",
	],
	declarationData: ["agreed", "signature", "date"],
} satisfies Record<string, string[]>;

const ADMISSION_STEPS = [
	"programme",
	"payment",
	"biodata",
	"contact",
	"olevel",
	"programme_details",
	"declaration",
	"submitted",
];

function asRecord(value: unknown) {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function asNumber(value: unknown, fallback = 0) {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : fallback;
	}

	return fallback;
}

function toTitleCase(value: string) {
	return value
		.replaceAll("_", " ")
		.split(" ")
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function getProfileCompletion(application: AdmissionApplicationSummary | null) {
	const profile = asRecord(asRecord(application?.metadata).admissionProfile);
	const sections = Object.entries(PROFILE_SECTION_REQUIREMENTS);
	const completed = sections.filter(([sectionKey, requiredFields]) => {
		const section = asRecord(profile[sectionKey]);

		return requiredFields.every((field) => {
			const value = section[field];

			if (Array.isArray(value)) {
				return value.length > 0;
			}

			if (typeof value === "boolean") {
				return value;
			}

			return Boolean(asString(value));
		});
	}).length;

	return {
		completed,
		total: sections.length,
		percent: Math.round((completed / sections.length) * 100),
	};
}

function mapCourse(
	course: ReturnType<typeof unwrapStrapiCollection<StrapiCourse>>[number],
): StudentDashboardCourse {
	return {
		id: course.id,
		code: asString(course.code, course.id),
		title: asString(course.title, "Untitled course"),
		level: asNumber(course.level),
		semester: asString(course.semester, "first"),
		creditUnits: asNumber(course.creditUnits, 0),
		status: asString(course.status, "active"),
	};
}

async function getStudentCourses(collegeSlug: string) {
	const response = await strapiGet<StrapiCollectionResponse<StrapiCourse>>(
		"/api/courses",
		{
			cache: "no-store",
			query: {
				filters: {
					college: { slug: { $eq: collegeSlug } },
					status: { $eq: "active" },
				},
				sort: ["level:asc", "code:asc"],
				pagination: { page: 1, pageSize: 8 },
			},
		},
	);

	return unwrapStrapiCollection(response.data).map(mapCourse);
}

function getAdmissionProgressPoints(application: AdmissionApplicationSummary | null) {
	const completed = new Set(
		(application?.completedSteps ?? []).map((step) => String(step)),
	);
	const currentStep = application?.currentStep;

	return ADMISSION_STEPS.map((step, index) => {
		const reached =
			completed.has(step) ||
			currentStep === step ||
			(currentStep === "submitted" && step !== "submitted");

		return {
			label: toTitleCase(step === "programme_details" ? "programme" : step),
			value: reached ? Math.min(100, 22 + index * 11) : 8,
			amount: reached ? "Done" : "Pending",
		};
	});
}

function getPaymentMixPoints(input: {
	totalPaid: number;
	pendingAmount: number;
	totalInvoiced: number;
	failedCount: number;
}) {
	const total = Math.max(input.totalInvoiced, input.totalPaid + input.pendingAmount, 1);
	const other = Math.max(total - input.totalPaid - input.pendingAmount, 0);

	return [
		{
			label: "Paid",
			value: Math.round((input.totalPaid / total) * 100),
			amount: `${Math.round(input.totalPaid).toLocaleString("en-NG")}`,
		},
		{
			label: "Pending",
			value: Math.round((input.pendingAmount / total) * 100),
			amount: `${Math.round(input.pendingAmount).toLocaleString("en-NG")}`,
		},
		{
			label: "Other",
			value: Math.round((other / total) * 100),
			amount: input.failedCount ? `${input.failedCount} failed` : "Clear",
		},
	];
}

function getCourseLoadPoints(courses: StudentDashboardCourse[]) {
	const bySemester = courses.reduce<Record<string, number>>((summary, course) => {
		const key = toTitleCase(course.semester);
		summary[key] = (summary[key] ?? 0) + course.creditUnits;
		return summary;
	}, {});
	const entries = Object.entries(bySemester);

	if (!entries.length) {
		return [
			{ label: "First", value: 0, amount: "0 units" },
			{ label: "Second", value: 0, amount: "0 units" },
		];
	}

	const maxUnits = Math.max(...entries.map(([, units]) => units), 1);

	return entries.map(([label, units]) => ({
		label,
		value: Math.round((units / maxUnits) * 100),
		amount: `${units} units`,
	}));
}

function createNotices(input: {
	application: AdmissionApplicationSummary | null;
	profileCompletion: number;
	pendingAmount: number;
	latestCourse?: StudentDashboardCourse;
}) {
	const notices: StudentDashboardNotice[] = [];

	notices.push({
		title: "Admission status",
		message: input.application
			? `Your application is ${toTitleCase(input.application.status)} at ${toTitleCase(input.application.currentStep ?? "programme")} stage.`
			: "No admission application is currently linked to this student account.",
		tone:
			input.application?.status === "approved" ||
			input.application?.status === "submitted"
				? "success"
				: "info",
		meta: input.application?.lastSavedAt
			? new Intl.DateTimeFormat("en-NG", {
					day: "2-digit",
					month: "short",
					hour: "2-digit",
					minute: "2-digit",
				}).format(new Date(input.application.lastSavedAt))
			: "Live",
	});

	notices.push({
		title: "Payment watch",
		message:
			input.pendingAmount > 0
				? `You still have NGN ${Math.round(input.pendingAmount).toLocaleString("en-NG")} pending across your invoices.`
				: "No pending student invoice is currently blocking your dashboard.",
		tone: input.pendingAmount > 0 ? "warning" : "success",
		meta: "Ledger",
	});

	notices.push({
		title: "Profile readiness",
		message:
			input.profileCompletion >= 100
				? "All admission profile sections are complete."
				: `${input.profileCompletion}% of the admission profile is complete.`,
		tone: input.profileCompletion >= 100 ? "success" : "warning",
		meta: "Profile",
	});

	if (input.latestCourse) {
		notices.push({
			title: "Course catalogue",
			message: `${input.latestCourse.code} is available under the current college course list.`,
			tone: "info",
			meta: `${input.latestCourse.creditUnits} units`,
		});
	}

	return notices;
}

export async function getStudentDashboardData(input: {
	collegeSlug: string;
	session: AuthSession;
	application?: AdmissionApplicationSummary | null;
}): Promise<StudentDashboardData> {
	const [profileResponse, paymentLedger, courses] = await Promise.all([
		getStudentAdmissionProfile(input.collegeSlug).catch(() => ({
			application: null,
		})),
		getPaymentLedgerRecords({
			scope: "student",
			collegeSlug: input.collegeSlug,
			payerEmail: input.session.user.email,
		}).catch(() => ({
			scope: "student" as const,
			collegeName: input.session.user.collegeName ?? input.collegeSlug,
			invoices: [],
			summary: {
				totalInvoiced: 0,
				totalPaid: 0,
				pendingAmount: 0,
				failedCount: 0,
				currency: "NGN",
			},
		})),
		getStudentCourses(input.collegeSlug).catch(() => []),
	]);
	const application =
		profileResponse.application ?? input.application ?? null;
	const profile = getProfileCompletion(application);
	const latestInvoice = paymentLedger.invoices[0];
	const paymentSummary = {
		...paymentLedger.summary,
		latestInvoice: latestInvoice
			? {
					invoiceNumber: latestInvoice.invoiceNumber,
					description: latestInvoice.description,
					status: latestInvoice.status,
					amount: latestInvoice.amount,
					createdAt: latestInvoice.createdAt,
				}
			: undefined,
	};

	return {
		studentName: input.session.user.name,
		email: input.session.user.email,
		collegeName:
			input.session.user.collegeName ?? paymentLedger.collegeName ?? input.collegeSlug,
		admission: application,
		applicationNumber: application?.applicationNumber ?? "Not assigned",
		admissionStatus: toTitleCase(application?.status ?? "not started"),
		paymentStatus: toTitleCase(application?.paymentStatus ?? "not started"),
		currentStage: toTitleCase(application?.currentStep ?? "programme"),
		profileCompletion: profile.percent,
		completedProfileSections: profile.completed,
		totalProfileSections: profile.total,
		paymentSummary,
		courses,
		notices: createNotices({
			application,
			profileCompletion: profile.percent,
			pendingAmount: paymentLedger.summary.pendingAmount,
			latestCourse: courses[0],
		}),
		charts: {
			admissionProgress: getAdmissionProgressPoints(application),
			paymentMix: getPaymentMixPoints(paymentLedger.summary),
			courseLoad: getCourseLoadPoints(courses),
		},
		generatedAt: new Date().toISOString(),
	};
}
