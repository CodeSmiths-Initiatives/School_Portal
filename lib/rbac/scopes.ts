import type { RoleScopeType, TenantScopeType, UserAssignment } from "./types";

export const TENANT_SCOPE_TYPES = ["platform", "college"] as const satisfies readonly TenantScopeType[];

export const ROLE_SCOPE_TYPES = [
	"platform",
	"college",
	"faculty",
	"department",
	"course",
	"self",
] as const satisfies readonly RoleScopeType[];

export const SCOPE_DESCRIPTIONS: Record<string, string> = {
	platform: "All colleges and global platform settings.",
	college: "One college tenant and all records inside that college.",
	faculty: "One faculty or school inside a college.",
	department: "One department inside a college.",
	course: "One course inside a department or college.",
	self: "Only the authenticated user's own record.",
};

export function createCollegeAssignment(
	collegeId: string,
	options?: Partial<UserAssignment>,
): UserAssignment {
	return {
		scopeType: "college",
		collegeId,
		...options,
	};
}

export function createDepartmentAssignment(
	collegeId: string,
	departmentId: string,
	options?: Partial<UserAssignment>,
): UserAssignment {
	return {
		scopeType: "department",
		collegeId,
		departmentId,
		...options,
	};
}

export function createCourseAssignment(
	collegeId: string,
	departmentId: string,
	courseId: string,
	options?: Partial<UserAssignment>,
): UserAssignment {
	return {
		scopeType: "course",
		collegeId,
		departmentId,
		courseId,
		...options,
	};
}

