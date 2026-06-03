import type { DashboardDomain } from "@/lib/auth";
import type { PermissionDefinition, PermissionKey } from "./types";

function permission(
	key: PermissionKey,
	module: string,
	action: string,
	label: string,
	description?: string,
): PermissionDefinition {
	return { key, module, action, label, description };
}

export const PERMISSIONS = [
	permission("dashboard.view", "Dashboard", "view", "View dashboard"),

	permission("profile.view", "Profile", "view", "View profile"),
	permission("profile.update", "Profile", "update", "Update profile"),

	permission("colleges.view", "Colleges", "view", "View colleges"),
	permission("colleges.create", "Colleges", "create", "Create college"),
	permission("colleges.update", "Colleges", "update", "Update college"),
	permission("colleges.delete", "Colleges", "delete", "Delete college"),

	permission("faculties.view", "Faculties", "view", "View faculties"),
	permission("faculties.create", "Faculties", "create", "Create faculty"),
	permission("faculties.update", "Faculties", "update", "Update faculty"),
	permission("faculties.delete", "Faculties", "delete", "Delete faculty"),

	permission("departments.view", "Departments", "view", "View departments"),
	permission("departments.create", "Departments", "create", "Create department"),
	permission("departments.update", "Departments", "update", "Update department"),
	permission("departments.delete", "Departments", "delete", "Delete department"),

	permission("staff.view", "Staff", "view", "View staff"),
	permission("staff.create", "Staff", "create", "Create staff"),
	permission("staff.update", "Staff", "update", "Update staff"),
	permission("staff.delete", "Staff", "delete", "Delete staff"),
	permission("staff.assign_role", "Staff", "assign_role", "Assign staff role"),

	permission("students.view", "Students", "view", "View students"),
	permission("students.create", "Students", "create", "Create student"),
	permission("students.update", "Students", "update", "Update student"),
	permission("students.delete", "Students", "delete", "Delete student"),
	permission("students.export", "Students", "export", "Export students"),

	permission("admissions.view", "Admissions", "view", "View admissions"),
	permission("admissions.create", "Admissions", "create", "Create application"),
	permission("admissions.update", "Admissions", "update", "Update admission"),
	permission("admissions.approve", "Admissions", "approve", "Approve admission"),
	permission("admissions.reject", "Admissions", "reject", "Reject admission"),

	permission("courses.view", "Courses", "view", "View courses"),
	permission("courses.create", "Courses", "create", "Create course"),
	permission("courses.update", "Courses", "update", "Update course"),
	permission("courses.delete", "Courses", "delete", "Delete course"),
	permission("courses.assign_staff", "Courses", "assign_staff", "Assign course staff"),
	permission("courses.register", "Courses", "register", "Register course"),

	permission("results.view", "Results", "view", "View results"),
	permission("results.create", "Results", "create", "Create result"),
	permission("results.upload", "Results", "upload", "Upload result"),
	permission("results.approve", "Results", "approve", "Approve result"),
	permission("results.reject", "Results", "reject", "Reject result"),
	permission("results.print", "Results", "print", "Print result"),

	permission("payments.view", "Payments", "view", "View payments"),
	permission("payments.create", "Payments", "create", "Create payment"),
	permission("payments.verify", "Payments", "verify", "Verify payment"),
	permission("payments.refund", "Payments", "refund", "Refund payment"),
	permission("payments.export", "Payments", "export", "Export payments"),
	permission("payments.print", "Payments", "print", "Print receipt"),

	permission("notices.view", "Notices", "view", "View notices"),
	permission("notices.create", "Notices", "create", "Create notice"),
	permission("notices.update", "Notices", "update", "Update notice"),
	permission("notices.delete", "Notices", "delete", "Delete notice"),
	permission("notices.publish", "Notices", "publish", "Publish notice"),

	permission("reports.view", "Reports", "view", "View reports"),
	permission("reports.export", "Reports", "export", "Export reports"),
	permission("reports.print", "Reports", "print", "Print reports"),

	permission("roles.view", "Roles", "view", "View roles"),
	permission("roles.create", "Roles", "create", "Create role"),
	permission("roles.update", "Roles", "update", "Update role"),
	permission("roles.delete", "Roles", "delete", "Delete role"),
	permission(
		"roles.assign_permissions",
		"Roles",
		"assign_permissions",
		"Assign permissions",
	),

	permission("audit.view", "Audit", "view", "View audit logs"),
	permission("settings.view", "Settings", "view", "View settings"),
	permission("settings.update", "Settings", "update", "Update settings"),

	permission("transcripts.view", "Transcripts", "view", "View transcripts"),
	permission("transcripts.request", "Transcripts", "request", "Request transcript"),
	permission("transcripts.approve", "Transcripts", "approve", "Approve transcript"),

	permission("hostels.view", "Hostels", "view", "View hostels"),
	permission("hostels.allocate", "Hostels", "allocate", "Allocate hostel"),

	permission("library.view", "Library", "view", "View library"),
	permission("library.upload", "Library", "upload", "Upload library resource"),

	permission("elections.view", "Elections", "view", "View elections"),
	permission("elections.manage", "Elections", "manage", "Manage elections"),
	permission("elections.vote", "Elections", "vote", "Vote in election"),

	permission("marketplace.view", "Marketplace", "view", "View marketplace"),
	permission("marketplace.manage", "Marketplace", "manage", "Manage marketplace"),
] as const satisfies readonly PermissionDefinition[];

export const PERMISSION_KEYS = PERMISSIONS.map(({ key }) => key);

export const DEFAULT_DOMAIN_PERMISSIONS: Record<DashboardDomain, PermissionKey[]> = {
	student: [
		"dashboard.view",
		"profile.view",
		"profile.update",
		"admissions.view",
		"admissions.create",
		"courses.view",
		"courses.register",
		"payments.view",
		"payments.create",
		"results.view",
		"notices.view",
		"transcripts.view",
		"transcripts.request",
		"hostels.view",
		"library.view",
		"elections.view",
		"elections.vote",
		"marketplace.view",
	],
	staff: [
		"dashboard.view",
		"students.view",
		"admissions.view",
		"courses.view",
		"results.view",
		"results.upload",
		"payments.view",
		"hostels.view",
		"notices.view",
		"notices.create",
		"reports.view",
	],
	admin: [
		"dashboard.view",
		"faculties.view",
		"faculties.create",
		"departments.view",
		"departments.create",
		"staff.view",
		"staff.create",
		"staff.assign_role",
		"students.view",
		"students.create",
		"admissions.view",
		"admissions.approve",
		"courses.view",
		"courses.create",
		"courses.assign_staff",
		"results.view",
		"results.approve",
		"payments.view",
		"payments.verify",
		"payments.export",
		"hostels.view",
		"hostels.allocate",
		"notices.view",
		"notices.create",
		"reports.view",
		"roles.view",
		"roles.create",
		"roles.assign_permissions",
		"settings.view",
	],
	superadmin: [
		"dashboard.view",
		"colleges.view",
		"colleges.create",
		"colleges.update",
		"staff.view",
		"staff.create",
		"roles.view",
		"roles.create",
		"roles.update",
		"roles.assign_permissions",
		"reports.view",
		"reports.export",
		"audit.view",
		"settings.view",
		"settings.update",
	],
};

export function getDefaultPermissionsForDomain(domain: DashboardDomain) {
	return DEFAULT_DOMAIN_PERMISSIONS[domain];
}
