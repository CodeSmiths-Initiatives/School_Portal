import { getCurrentAuthSession } from "@/lib/auth/server-session";
import { strapiGet, strapiPatch, strapiPost } from "@/lib/api";
import type { AuthSession } from "@/lib/auth/accounts";
import type { AdmissionApplicationSummary } from "@/lib/services/admission-application.service";

export type StudentAdmissionProfileStep =
	| "bioData"
	| "contactData"
	| "oLevelData"
	| "programmeData"
	| "declarationData";

export type StudentAdmissionProfileResponse = {
	application: AdmissionApplicationSummary | null;
	generatedAt?: string;
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
		throw new Error("PORTAL_INTERNAL_API_SECRET is required in production.");
	}

	return DEV_INTERNAL_SECRET;
}

function assertStudentSession(
	session: AuthSession | null | undefined,
	collegeSlug: string,
): AuthSession {
	if (!session) {
		throw new Error("You must sign in before updating admission details.");
	}

	if (session.user.domain !== "student") {
		throw new Error("Only student accounts can update student admission details.");
	}

	if (session.user.collegeSlug !== collegeSlug) {
		throw new Error("Admission details must be saved under your assigned college.");
	}

	return session;
}

function getInternalHeaders() {
	return {
		"x-portal-internal-secret": getInternalSecret(),
	};
}

function getStudentPayload(session: AuthSession) {
	return {
		id: session.user.id,
		strapiUserId: session.user.strapiUserId,
		username: session.user.username,
		email: session.user.email,
		name: session.user.name,
	};
}

function normalizeAdmissionStepPayload(
	step: StudentAdmissionProfileStep,
	payload: Record<string, unknown>,
	session: AuthSession,
) {
	if (step !== "contactData") {
		return payload;
	}

	return {
		...payload,
		emailAddress: session.user.email,
		confirmEmail: session.user.email,
	};
}

export async function getStudentAdmissionProfile(collegeSlug: string) {
	const session = assertStudentSession(await getCurrentAuthSession(), collegeSlug);

	return strapiGet<StudentAdmissionProfileResponse>(
		"/api/internal/student-admission-profile",
		{
			cache: "no-store",
			headers: getInternalHeaders(),
			query: {
				collegeSlug,
				email: session.user.email,
			},
		},
	);
}

export async function saveStudentAdmissionProfileStep(input: {
	collegeSlug: string;
	step: StudentAdmissionProfileStep;
	payload: Record<string, unknown>;
}) {
	const session = assertStudentSession(
		await getCurrentAuthSession(),
		input.collegeSlug,
	);

	return strapiPatch<StudentAdmissionProfileResponse>(
		"/api/internal/student-admission-profile/step",
		{
			collegeSlug: input.collegeSlug,
			student: getStudentPayload(session),
			step: input.step,
			payload: normalizeAdmissionStepPayload(input.step, input.payload, session),
		},
		{
			headers: getInternalHeaders(),
		},
	);
}

export async function submitStudentAdmissionProfile(collegeSlug: string) {
	const session = assertStudentSession(await getCurrentAuthSession(), collegeSlug);

	return strapiPost<StudentAdmissionProfileResponse>(
		"/api/internal/student-admission-profile/submit",
		{
			collegeSlug,
			student: getStudentPayload(session),
		},
		{
			headers: getInternalHeaders(),
		},
	);
}
