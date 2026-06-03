import {
	createDashboardDestinationForAccount,
	findMvpAccount,
	isAccountAllowedForAudience,
	type AuthAudience,
	type AuthSession,
} from "@/lib/auth/accounts";
import { buildDashboardPath } from "@/lib/auth/config";
import type { DashboardDomain, PlatformRole, TenantScope } from "@/lib/auth/types";
import { createSessionExpiry } from "@/lib/auth/session";
import type { LoginInput } from "@/lib/validation";
import { strapiGet, strapiPost, StrapiApiError } from "@/lib/api";

export type LoginSuccess = {
	ok: true;
	session: AuthSession;
};

export type LoginFailure = {
	ok: false;
	message: string;
};

export type LoginResult = LoginSuccess | LoginFailure;

type StrapiLoginResponse = {
	jwt: string;
	user: {
		id: number;
		username: string;
		email: string;
	};
};

type StrapiPortalSessionResponse = {
	user: {
		id: number;
		username: string;
		email: string;
		confirmed: boolean;
	};
	assignment: {
		id: number;
		scopeType: TenantScope | "faculty" | "department" | "course" | "self";
		isPrimary: boolean;
		status: "active" | "inactive" | "expired";
	};
	role: {
		id: number;
		name: string;
		code: string;
		tenantScope: TenantScope;
		scopeType: TenantScope | "faculty" | "department" | "course" | "self";
		permissions: string[];
	};
	college: {
		id: number;
		name: string;
		slug: string;
		code: string;
	} | null;
};

type AuthProviderMode = "auto" | "mvp" | "strapi";

function getAuthProviderMode(): AuthProviderMode {
	const value = process.env.NEXT_PUBLIC_AUTH_PROVIDER;

	if (value === "strapi" || value === "mvp" || value === "auto") {
		return value;
	}

	return "auto";
}

function createPreviewToken(accountId: string) {
	const entropy =
		typeof crypto !== "undefined" && "randomUUID" in crypto
			? crypto.randomUUID()
			: `${Date.now()}-${Math.random().toString(36).slice(2)}`;

	return `mvp_${accountId}_${entropy}`;
}

export async function loginWithMvpCredentials(
	input: LoginInput,
	audience: AuthAudience,
): Promise<LoginResult> {
	const account = findMvpAccount(input.identifier);

	await new Promise((resolve) => setTimeout(resolve, 250));

	if (
		!account ||
		account.password !== input.password ||
		!isAccountAllowedForAudience(account, audience)
	) {
		return {
			ok: false,
			message:
				audience === "student"
					? "Student login failed. Use the seeded student account for this MVP."
					: "Internal login failed. Use a seeded admin, staff, or superadmin account for this MVP.",
		};
	}

	const { password: _password, ...user } = account;
	const destination = createDashboardDestinationForAccount(account);
	const issuedAt = new Date().toISOString();

	return {
		ok: true,
		session: {
			token: createPreviewToken(account.id),
			user,
			destination,
			issuedAt,
			expiresAt: createSessionExpiry(new Date(issuedAt)),
		},
	};
}

function createSessionFromAccount(account: NonNullable<ReturnType<typeof findMvpAccount>>, token: string): AuthSession {
	const { password: _password, ...user } = account;
	const destination = createDashboardDestinationForAccount(account);
	const issuedAt = new Date().toISOString();

	return {
		token,
		user,
		destination,
		issuedAt,
		expiresAt: createSessionExpiry(new Date(issuedAt)),
	};
}

function normalizeRoleCode(code: string) {
	return code.trim().toLowerCase();
}

function resolveDomainFromPortalRole(
	roleCode: string,
	roleName: string,
): DashboardDomain {
	const normalized = normalizeRoleCode(`${roleCode} ${roleName}`);

	if (normalized.includes("superadmin")) {
		return "superadmin";
	}

	if (normalized.includes("college-admin")) {
		return "admin";
	}

	if (normalized.includes("student")) {
		return "student";
	}

	return "staff";
}

function resolvePlatformRoleFromPortalRole(
	domain: DashboardDomain,
	roleCode: string,
): PlatformRole {
	const normalized = normalizeRoleCode(roleCode);

	if (domain === "superadmin") {
		return "superadmin";
	}

	if (domain === "admin") {
		return "admin";
	}

	if (domain === "student") {
		return "student";
	}

	if (normalized.includes("hod")) {
		return "hod";
	}

	if (normalized.includes("teacher")) {
		return "teacher";
	}

	if (normalized.includes("bursary")) {
		return "bursary";
	}

	if (normalized.includes("registry")) {
		return "registry";
	}

	if (normalized.includes("dean")) {
		return "dean";
	}

	if (normalized.includes("admission")) {
		return "admissions";
	}

	return "clerk";
}

function isDomainAllowedForAudience(domain: DashboardDomain, audience: AuthAudience) {
	return audience === "student" ? domain === "student" : domain !== "student";
}

async function getStrapiPortalSession(token: string) {
	return strapiGet<StrapiPortalSessionResponse>("/api/auth/portal-session", {
		authToken: token,
		cache: "no-store",
	});
}

function createSessionFromStrapiPortal(
	portal: StrapiPortalSessionResponse,
	token: string,
): AuthSession {
	const domain = resolveDomainFromPortalRole(portal.role.code, portal.role.name);
	const role = resolvePlatformRoleFromPortalRole(domain, portal.role.code);
	const requiresCollege = domain !== "superadmin";

	if (requiresCollege && !portal.college?.slug) {
		throw new Error("This portal account is missing its college assignment.");
	}

	const path = buildDashboardPath(domain, {
		collegeSlug: portal.college?.slug,
		useTenantTemplate: requiresCollege,
	});
	const scope = domain === "superadmin" ? "platform" : "college";
	const issuedAt = new Date().toISOString();

	return {
		token,
		user: {
			id: `strapi:${portal.user.id}`,
			strapiUserId: portal.user.id,
			name: portal.role.name === "Student" ? portal.user.username : portal.user.username,
			email: portal.user.email,
			username: portal.user.username,
			domain,
			role,
			portalRoleCode: portal.role.code,
			roleLabel: portal.role.name,
			scope,
			collegeId: portal.college ? String(portal.college.id) : undefined,
			collegeSlug: portal.college?.slug,
			collegeName: portal.college?.name,
			permissions: portal.role.permissions,
		},
		destination: {
			domain,
			scope,
			currentPath: path,
			routeTemplate: path,
			requiresCollegeSlug: requiresCollege,
			label: portal.role.name,
			description: portal.college
				? `${portal.role.name} access is scoped to ${portal.college.name}.`
				: "Platform-wide superadmin access.",
			role,
			path,
			resolvedCollegeSlug: portal.college?.slug,
		},
		issuedAt,
		expiresAt: createSessionExpiry(new Date(issuedAt)),
	};
}

async function loginWithStrapiCredentials(
	input: LoginInput,
	audience: AuthAudience,
): Promise<LoginResult> {
	try {
		const response = await strapiPost<StrapiLoginResponse>("/api/auth/local", {
			identifier: input.identifier,
			password: input.password,
		});

		const portal = await getStrapiPortalSession(response.jwt);
		const session = createSessionFromStrapiPortal(portal, response.jwt);

		if (!isDomainAllowedForAudience(session.user.domain, audience)) {
			return {
				ok: false,
				message:
					audience === "student"
						? "This account is not a student account."
						: "This account is not an internal staff/admin account.",
			};
		}

		return {
			ok: true,
			session,
		};
	} catch (error) {
		if (error instanceof StrapiApiError && error.status === 400) {
			return {
				ok: false,
				message:
					audience === "student"
						? "Student login failed. Check the student email and password."
						: "Internal login failed. Check the staff/admin email and password.",
			};
		}

		return {
			ok: false,
			message:
				error instanceof Error
					? error.message
					: "Unable to reach Strapi authentication.",
		};
	}
}

export async function loginWithConfiguredAuthProvider(
	input: LoginInput,
	audience: AuthAudience,
): Promise<LoginResult> {
	const provider = getAuthProviderMode();

	if (provider === "mvp") {
		return loginWithMvpCredentials(input, audience);
	}

	const strapiResult = await loginWithStrapiCredentials(input, audience);

	if (strapiResult.ok || provider === "strapi") {
		return strapiResult;
	}

	return loginWithMvpCredentials(input, audience);
}

export async function requestPasswordReset(email: string) {
	return strapiPost<{ ok?: true }>("/api/auth/forgot-password", { email });
}

export async function resetPasswordWithCode(input: {
	code: string;
	password: string;
	confirmPassword: string;
}) {
	return strapiPost<{ jwt: string; user: unknown }>("/api/auth/reset-password", {
		code: input.code,
		password: input.password,
		passwordConfirmation: input.confirmPassword,
	});
}
