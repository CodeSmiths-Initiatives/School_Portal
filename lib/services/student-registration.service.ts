import { z } from "zod";

const DEV_REGISTRATION_SECRET =
	"iums-local-registration-secret-change-before-production";

export const studentPortalRegistrationSchema = z.object({
	username: z.string().trim().min(3),
	email: z.string().trim().email(),
	password: z.string().min(8).max(15),
	collegeSlug: z.string().trim().min(1),
});

export type StudentPortalRegistrationInput = z.infer<
	typeof studentPortalRegistrationSchema
>;

export type StudentPortalRegistrationResult = {
	ok: true;
	user: {
		id: number;
		username: string;
		email: string;
	};
	college: {
		id: number;
		name: string;
		slug: string;
		code: string;
	};
	role: {
		id: number;
		name: string;
		code: string;
	};
};

function getStrapiBaseUrl() {
	return (
		process.env.STRAPI_API_URL ??
		process.env.NEXT_PUBLIC_STRAPI_API_URL ??
		"http://localhost:1337"
	).replace(/\/$/, "");
}

function getRegistrationSecret() {
	const configured = process.env.PORTAL_REGISTRATION_SECRET;

	if (configured) {
		return configured;
	}

	if (process.env.NODE_ENV === "production") {
		throw new Error("PORTAL_REGISTRATION_SECRET is required in production.");
	}

	return DEV_REGISTRATION_SECRET;
}

export async function registerStudentPortalAccount(
	input: StudentPortalRegistrationInput,
) {
	const response = await fetch(
		`${getStrapiBaseUrl()}/api/auth/register-student-portal`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-portal-registration-secret": getRegistrationSecret(),
			},
			body: JSON.stringify(input),
			cache: "no-store",
		},
	);

	const payload = (await response.json().catch(() => null)) as
		| StudentPortalRegistrationResult
		| { error?: { message?: string }; message?: string }
		| null;

	if (!response.ok || !payload || !("ok" in payload)) {
		const message =
			payload && "error" in payload
				? payload.error?.message
				: payload && "message" in payload
					? payload.message
					: undefined;

		throw new Error(message ?? "Unable to create the student portal account.");
	}

	return payload;
}
