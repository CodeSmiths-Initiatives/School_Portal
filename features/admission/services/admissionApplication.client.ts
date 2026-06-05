import type { AdmissionApplicationSummary } from "@/lib/services/admission-application.service";
import type {
	AdmissionApplicationDraftRequestInput,
	AdmissionApplicationListQueryInput,
	AdmissionApplicationRequestInput,
	AdmissionApplicationUpdateRequestInput,
} from "@/lib/validation";

export async function createAdmissionApplication(
	payload: AdmissionApplicationRequestInput,
) {
	const response = await fetch("/api/admissions/applications", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	const result = (await response.json()) as
		| { application?: AdmissionApplicationSummary; error?: string }
		| undefined;

	if (!response.ok || !result?.application) {
		throw new Error(
			result?.error ?? "Unable to create the admission application record.",
		);
	}

	return result.application;
}

export async function createAdmissionApplicationDraft(
	payload: AdmissionApplicationDraftRequestInput,
) {
	const response = await fetch("/api/admissions/applications", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	const result = (await response.json()) as
		| { application?: AdmissionApplicationSummary; error?: string }
		| undefined;

	if (!response.ok || !result?.application) {
		throw new Error(
			result?.error ?? "Unable to save the admission application draft.",
		);
	}

	return result.application;
}

export async function updateAdmissionApplication(
	applicationId: string,
	payload: AdmissionApplicationUpdateRequestInput,
) {
	const response = await fetch(`/api/admissions/applications/${applicationId}`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	const result = (await response.json()) as
		| { application?: AdmissionApplicationSummary; error?: string }
		| undefined;

	if (!response.ok || !result?.application) {
		throw new Error(
			result?.error ?? "Unable to update the admission application draft.",
		);
	}

	return result.application;
}

export async function listAdmissionApplications(
	query: AdmissionApplicationListQueryInput,
) {
	const params = new URLSearchParams({
		collegeSlug: query.collegeSlug,
		limit: String(query.limit ?? 25),
	});

	if (query.email) {
		params.set("email", query.email);
	}

	if (query.status) {
		params.set("status", query.status);
	}

	const response = await fetch(`/api/admissions/applications?${params.toString()}`, {
		cache: "no-store",
	});

	const result = (await response.json()) as
		| { applications?: AdmissionApplicationSummary[]; error?: string }
		| undefined;

	if (!response.ok || !result?.applications) {
		throw new Error(result?.error ?? "Unable to load admission applications.");
	}

	return result.applications;
}
