export type TenantScope = "platform" | "college";

export type TenantStatus = "active" | "inactive" | "archived";

export type DashboardDomain = "student" | "staff" | "admin" | "superadmin";

// Backward-compatible alias used by the current dashboard shell.
export type UserDomain = DashboardDomain;

export type StaffRole =
	| "teacher"
	| "clerk"
	| "bursary"
	| "registry"
	| "hod"
	| "dean"
	| "admissions";

export type CollegeRole = "student" | "admin" | StaffRole;

export type PlatformRole = "superadmin" | CollegeRole;

export interface CollegeTenantBlueprint {
	id?: string;
	name: string;
	slug: string;
	code: string;
	status: TenantStatus;
}

export interface DashboardRouteBlueprint {
	domain: DashboardDomain;
	scope: TenantScope;
	currentPath: string;
	routeTemplate: string;
	requiresCollegeSlug: boolean;
	label: string;
	description: string;
}

export interface DashboardOwnership {
	domain: DashboardDomain;
	scope: TenantScope;
	primaryRole: PlatformRole;
	description: string;
}

export interface DashboardDestination extends DashboardRouteBlueprint {
	role: PlatformRole;
	path: string;
	resolvedCollegeSlug?: string;
}
