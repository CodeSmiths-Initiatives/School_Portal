import type {
	CollegeRole,
	DashboardDestination,
	DashboardDomain,
	DashboardOwnership,
	DashboardRouteBlueprint,
	PlatformRole,
	StaffRole,
	TenantScope,
	UserDomain,
} from "./types";

export const DEFAULT_MVP_COLLEGE_SLUG = "kwara-applied-sciences";

export const DASHBOARD_ROUTE_BLUEPRINTS: Record<
	DashboardDomain,
	DashboardRouteBlueprint
> = {
	student: {
		domain: "student",
		scope: "college",
		currentPath: `/college/${DEFAULT_MVP_COLLEGE_SLUG}/student/dashboard`,
		routeTemplate: "/college/[collegeSlug]/student/dashboard",
		requiresCollegeSlug: true,
		label: "College Student Dashboard",
		description:
			"Students belong to a single college and should only access their own college dashboard and data.",
	},
	staff: {
		domain: "staff",
		scope: "college",
		currentPath: `/college/${DEFAULT_MVP_COLLEGE_SLUG}/staff/dashboard`,
		routeTemplate: "/college/[collegeSlug]/staff/dashboard",
		requiresCollegeSlug: true,
		label: "College Staff Dashboard",
		description:
			"Staff members belong to one college and share a common operational dashboard shell with role-based modules.",
	},
	admin: {
		domain: "admin",
		scope: "college",
		currentPath: `/college/${DEFAULT_MVP_COLLEGE_SLUG}/admin/dashboard`,
		routeTemplate: "/college/[collegeSlug]/admin/dashboard",
		requiresCollegeSlug: true,
		label: "College Admin Dashboard",
		description:
			"College admins manage one college only, including staff, students, notices, and college-level reports.",
	},
	superadmin: {
		domain: "superadmin",
		scope: "platform",
		currentPath: "/platform/dashboard",
		routeTemplate: "/platform/dashboard",
		requiresCollegeSlug: false,
		label: "Platform Superadmin Dashboard",
		description:
			"The platform superadmin manages all colleges, provisions admins, and reviews platform-wide analytics.",
	},
};

export const DASHBOARD_PATHS = {
	student: DASHBOARD_ROUTE_BLUEPRINTS.student.currentPath,
	staff: DASHBOARD_ROUTE_BLUEPRINTS.staff.currentPath,
	admin: DASHBOARD_ROUTE_BLUEPRINTS.admin.currentPath,
	superadmin: DASHBOARD_ROUTE_BLUEPRINTS.superadmin.currentPath,
} as const;

export const DASHBOARD_OWNERSHIP_MAP: Record<
	DashboardDomain,
	DashboardOwnership
> = {
	student: {
		domain: "student",
		scope: "college",
		primaryRole: "student",
		description: "Owned by one college and visible only to students of that college.",
	},
	staff: {
		domain: "staff",
		scope: "college",
		primaryRole: "clerk",
		description:
			"Owned by one college and shared by staff roles such as teachers, bursary, registry, and admissions.",
	},
	admin: {
		domain: "admin",
		scope: "college",
		primaryRole: "admin",
		description:
			"Owned by one college and reserved for college administrators and college-level governance workflows.",
	},
	superadmin: {
		domain: "superadmin",
		scope: "platform",
		primaryRole: "superadmin",
		description:
			"Platform-owned dashboard with visibility across all colleges and tenant provisioning operations.",
	},
};

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
	teacher: "Teacher",
	clerk: "Clerk",
	bursary: "Bursary Officer",
	registry: "Registry Officer",
	hod: "Head of Department",
	dean: "Dean",
	admissions: "Admissions Officer",
};

export const COLLEGE_ROLE_LABELS: Record<CollegeRole, string> = {
	student: "College Student",
	admin: "College Admin",
	...STAFF_ROLE_LABELS,
};

export const USER_DOMAIN_LABELS: Record<UserDomain, string> = {
	student: "Student",
	staff: "Staff",
	admin: "College Admin",
	superadmin: "Platform Superadmin",
};

function normalizeIdentifier(identifier: string) {
	return identifier.trim().toLowerCase();
}

function resolveStaffRole(identifier: string): StaffRole {
	const normalized = normalizeIdentifier(identifier);

	if (
		normalized.includes("teacher") ||
		normalized.includes("lecturer") ||
		normalized.includes("faculty")
	) {
		return "teacher";
	}

	if (normalized.includes("bursary") || normalized.includes("finance")) {
		return "bursary";
	}

	if (normalized.includes("registry") || normalized.includes("registrar")) {
		return "registry";
	}

	if (normalized.includes("hod")) {
		return "hod";
	}

	if (normalized.includes("dean")) {
		return "dean";
	}

	if (normalized.includes("admission")) {
		return "admissions";
	}

	return "clerk";
}

export function resolveRoleScope(role: PlatformRole): TenantScope {
	return role === "superadmin" ? "platform" : "college";
}

export function buildDashboardPath(
	domain: DashboardDomain,
	options?: { collegeSlug?: string; useTenantTemplate?: boolean },
) {
	const blueprint = DASHBOARD_ROUTE_BLUEPRINTS[domain];

	if (!options?.useTenantTemplate) {
		return blueprint.currentPath;
	}

	if (!blueprint.requiresCollegeSlug || !options.collegeSlug) {
		return blueprint.currentPath;
	}

	return blueprint.routeTemplate.replace("[collegeSlug]", options.collegeSlug);
}

export function resolveDashboardDestination(
	audience: "student" | "staff",
	identifier: string,
): DashboardDestination {
	const normalized = normalizeIdentifier(identifier);

	if (audience === "student") {
		const path = buildDashboardPath("student", {
			collegeSlug: DEFAULT_MVP_COLLEGE_SLUG,
			useTenantTemplate: true,
		});

		return {
			...DASHBOARD_ROUTE_BLUEPRINTS.student,
			role: "student",
			path,
			resolvedCollegeSlug: DEFAULT_MVP_COLLEGE_SLUG,
		};
	}

	if (
		normalized.includes("principal") ||
		normalized.includes("superadmin") ||
		normalized.includes("platformadmin")
	) {
		return {
			...DASHBOARD_ROUTE_BLUEPRINTS.superadmin,
			role: "superadmin",
			path: DASHBOARD_ROUTE_BLUEPRINTS.superadmin.currentPath,
		};
	}

	if (
		normalized === "admin" ||
		normalized.includes("collegeadmin") ||
		normalized.includes("campusadmin")
	) {
		const path = buildDashboardPath("admin", {
			collegeSlug: DEFAULT_MVP_COLLEGE_SLUG,
			useTenantTemplate: true,
		});

		return {
			...DASHBOARD_ROUTE_BLUEPRINTS.admin,
			role: "admin",
			path,
			resolvedCollegeSlug: DEFAULT_MVP_COLLEGE_SLUG,
			description:
				"College admin accounts are college-scoped. In Phase 2 the UI route is prepared, while full tenant-aware auth wiring lands in the next phase.",
		};
	}

	const role = resolveStaffRole(identifier);
	const path = buildDashboardPath("staff", {
		collegeSlug: DEFAULT_MVP_COLLEGE_SLUG,
		useTenantTemplate: true,
	});

	return {
		...DASHBOARD_ROUTE_BLUEPRINTS.staff,
		role,
		path,
		resolvedCollegeSlug: DEFAULT_MVP_COLLEGE_SLUG,
		description: `${STAFF_ROLE_LABELS[role]} accounts currently route into the shared staff dashboard shell. In the multi-tenant model this remains college-scoped.`,
	};
}
