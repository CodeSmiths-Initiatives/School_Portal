import type { StudentPortalRegistrationResult } from "@/lib/services/student-registration.service";

export async function registerStudentPortalAccount(payload: {
	username: string;
	email: string;
	password: string;
	collegeSlug: string;
}) {
	const response = await fetch("/api/auth/register-student", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	const result = (await response.json()) as
		| { registration?: StudentPortalRegistrationResult; error?: string }
		| undefined;

	if (!response.ok || !result?.registration) {
		throw new Error(result?.error ?? "Unable to create student login.");
	}

	return result.registration;
}
