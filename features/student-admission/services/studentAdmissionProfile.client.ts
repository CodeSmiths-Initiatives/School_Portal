import type {
	BioData,
	ContactData,
	DeclarationData,
	OLevelData,
	ProgrammeData,
} from "@/features/student-admission/store/studentAdmissionStore";
import type { AdmissionApplicationSummary } from "@/lib/services/admission-application.service";
import type { StudentAdmissionProfileStep } from "@/lib/services/student-admission-profile.service";

type AdmissionProfilePayloadByStep = {
	bioData: BioData;
	contactData: ContactData;
	oLevelData: OLevelData;
	programmeData: ProgrammeData;
	declarationData: DeclarationData;
};

type StudentAdmissionProfileResult = {
	application: AdmissionApplicationSummary | null;
	error?: string;
};

async function readResult(response: Response) {
	const result = (await response.json()) as StudentAdmissionProfileResult;

	if (!response.ok) {
		throw new Error(result?.error ?? "Admission profile request failed.");
	}

	return result;
}

export async function loadAdmissionProfile(collegeSlug: string) {
	const params = new URLSearchParams({ collegeSlug });
	const response = await fetch(
		`/api/student/admission-profile?${params.toString()}`,
		{ cache: "no-store" },
	);

	return readResult(response);
}

export async function saveAdmissionProfileStep<
	TStep extends StudentAdmissionProfileStep,
>(input: {
	collegeSlug: string;
	step: TStep;
	payload: AdmissionProfilePayloadByStep[TStep];
}) {
	const response = await fetch("/api/student/admission-profile/step", {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(input),
	});

	return readResult(response);
}

export async function submitAdmissionProfile(collegeSlug: string) {
	const response = await fetch("/api/student/admission-profile/submit", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ collegeSlug }),
	});

	return readResult(response);
}
