import type { AuthAudience, AuthSession } from "@/lib/auth";
import type { LoginInput } from "@/lib/validation";
import type { MaintenanceWindow } from "@/lib/services/superadmin-settings.service";

type ClientLoginSuccess = {
	ok: true;
	session: AuthSession;
};

type ClientLoginFailure = {
	ok: false;
	message: string;
	maintenance?: MaintenanceWindow;
};

export type ClientLoginResult = ClientLoginSuccess | ClientLoginFailure;

export async function loginThroughSessionRoute(
	input: LoginInput,
	audience: AuthAudience,
): Promise<ClientLoginResult> {
	const response = await fetch("/api/auth/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ ...input, audience }),
	});

	const payload = (await response.json()) as ClientLoginResult;

	if (!response.ok) {
		if (payload.ok === false) {
			return payload;
		}

		return {
			ok: false,
			message: "Unable to sign in.",
		};
	}

	return payload;
}

export async function logoutThroughSessionRoute() {
	await fetch("/api/auth/logout", {
		method: "POST",
	});
}
