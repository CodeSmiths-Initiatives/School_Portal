import { buildDashboardPath } from "./config";
import type {
	DashboardDestination,
	DashboardDomain,
	PlatformRole,
	TenantScope,
} from "./types";

export type AuthAudience = "student" | "staff";

export type MvpAuthAccount = {
	id: string;
	strapiUserId?: number;
	name: string;
	email: string;
	username: string;
	password: string;
	domain: DashboardDomain;
	role: PlatformRole;
	portalRoleCode?: string;
	roleLabel: string;
	scope: TenantScope;
	collegeId?: string;
	collegeSlug?: string;
	collegeName?: string;
	departmentIds?: string[];
	courseIds?: string[];
	permissions?: string[];
};

export type AuthSessionUser = Omit<MvpAuthAccount, "password">;

export type AuthSession = {
	token?: string;
	user: AuthSessionUser;
	destination: DashboardDestination;
	issuedAt: string;
	expiresAt: string;
};

const KWARA_COLLEGE = {
	id: "college_kwara_applied_sciences",
	slug: "kwara-applied-sciences",
	name: "Kwara Applied Sciences",
};

export const MVP_AUTH_ACCOUNTS = [
	{
		id: "usr_platform_superadmin",
		name: "Principal Superadmin",
		email: "superadmin@iums.test",
		username: "superadmin",
		password: "Super@123",
		domain: "superadmin",
		role: "superadmin",
		roleLabel: "Principal / Superadmin",
		scope: "platform",
	},
	{
		id: "usr_kwara_admin",
		name: "Kwara College Admin",
		email: "admin.kwara@iums.test",
		username: "kwara.admin",
		password: "Admin@123",
		domain: "admin",
		role: "admin",
		roleLabel: "College Admin",
		scope: "college",
		collegeId: KWARA_COLLEGE.id,
		collegeSlug: KWARA_COLLEGE.slug,
		collegeName: KWARA_COLLEGE.name,
	},
	{
		id: "usr_kwara_student",
		name: "Kwara Student",
		email: "student.kwara@iums.test",
		username: "kwara.student",
		password: "Student@1",
		domain: "student",
		role: "student",
		roleLabel: "College Student",
		scope: "college",
		collegeId: KWARA_COLLEGE.id,
		collegeSlug: KWARA_COLLEGE.slug,
		collegeName: KWARA_COLLEGE.name,
	},
	{
		id: "usr_kwara_hod",
		name: "Kwara HOD",
		email: "hod.kwara@iums.test",
		username: "kwara.hod",
		password: "Hod@1234",
		domain: "staff",
		role: "hod",
		roleLabel: "Head of Department",
		scope: "college",
		collegeId: KWARA_COLLEGE.id,
		collegeSlug: KWARA_COLLEGE.slug,
		collegeName: KWARA_COLLEGE.name,
		departmentIds: ["dept_computer_science"],
		courseIds: ["course_intro_programming", "course_database_systems"],
	},
	{
		id: "usr_kwara_clerk",
		name: "Kwara Clerk",
		email: "clerk.kwara@iums.test",
		username: "kwara.clerk",
		password: "Clerk@123",
		domain: "staff",
		role: "clerk",
		roleLabel: "Registry Clerk",
		scope: "college",
		collegeId: KWARA_COLLEGE.id,
		collegeSlug: KWARA_COLLEGE.slug,
		collegeName: KWARA_COLLEGE.name,
		departmentIds: ["dept_registry"],
	},
] as const satisfies readonly MvpAuthAccount[];

const ACCOUNT_BY_IDENTIFIER = new Map(
	MVP_AUTH_ACCOUNTS.flatMap((account) => [
		[account.email.toLowerCase(), account],
		[account.username.toLowerCase(), account],
	]),
);

export function findMvpAccount(identifier: string) {
	return ACCOUNT_BY_IDENTIFIER.get(identifier.trim().toLowerCase()) ?? null;
}

export function isAccountAllowedForAudience(
	account: MvpAuthAccount,
	audience: AuthAudience,
) {
	if (audience === "student") {
		return account.domain === "student";
	}

	return account.domain !== "student";
}

export function createDashboardDestinationForAccount(
	account: MvpAuthAccount,
): DashboardDestination {
	const path = buildDashboardPath(account.domain, {
		collegeSlug: account.collegeSlug,
		useTenantTemplate: account.scope === "college",
	});

	return {
		domain: account.domain,
		scope: account.scope,
		currentPath: path,
		routeTemplate: path,
		requiresCollegeSlug: account.scope === "college",
		label: account.roleLabel,
		description:
			account.scope === "college"
				? `${account.roleLabel} access is scoped to ${account.collegeName}.`
				: "Platform-wide superadmin access.",
		role: account.role,
		path,
		resolvedCollegeSlug: account.collegeSlug,
	};
}
