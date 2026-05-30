import type {
	AccessScope,
	PermissionCheckOptions,
	PermissionKey,
	RbacUserContext,
	UserPermissionKey,
	UserAssignment,
} from "./types";

function isWithinDateWindow(assignment: UserAssignment, now = new Date()) {
	const startsAt = assignment.startsAt ? new Date(assignment.startsAt) : null;
	const endsAt = assignment.endsAt ? new Date(assignment.endsAt) : null;

	if (startsAt && startsAt > now) {
		return false;
	}

	if (endsAt && endsAt < now) {
		return false;
	}

	return true;
}

export function hasPermissions(
	userPermissions: UserPermissionKey[],
	requiredPermissions: PermissionKey[],
	options?: Pick<PermissionCheckOptions, "mode">,
) {
	if (requiredPermissions.length === 0) {
		return true;
	}

	const permissionSet = new Set(userPermissions);

	if (permissionSet.has("*")) {
		return true;
	}

	const mode = options?.mode ?? "all";

	if (mode === "any") {
		return requiredPermissions.some((permission) => permissionSet.has(permission));
	}

	return requiredPermissions.every((permission) => permissionSet.has(permission));
}

export function assignmentMatchesScope(
	assignment: UserAssignment,
	scope: AccessScope,
) {
	if (!isWithinDateWindow(assignment)) {
		return false;
	}

	if (assignment.scopeType === "platform") {
		return true;
	}

	if (assignment.scopeType === "college") {
		return assignment.collegeId === scope.collegeId;
	}

	if (assignment.scopeType === "faculty") {
		return (
			assignment.collegeId === scope.collegeId &&
			assignment.facultyId === scope.facultyId
		);
	}

	if (assignment.scopeType === "department") {
		return (
			assignment.collegeId === scope.collegeId &&
			assignment.departmentId === scope.departmentId
		);
	}

	if (assignment.scopeType === "course") {
		return (
			assignment.collegeId === scope.collegeId &&
			assignment.departmentId === scope.departmentId &&
			assignment.courseId === scope.courseId
		);
	}

	if (assignment.scopeType === "self") {
		return assignment.userId === scope.userId;
	}

	return assignment.scopeType === scope.scopeType;
}

export function hasScope(user: RbacUserContext, scope?: AccessScope) {
	if (!scope) {
		return true;
	}

	return user.assignments.some((assignment) =>
		assignmentMatchesScope(assignment, scope),
	);
}

export function can(
	user: Pick<RbacUserContext, "permissions" | "assignments">,
	requiredPermissions: PermissionKey | PermissionKey[],
	options?: PermissionCheckOptions,
) {
	const permissions = Array.isArray(requiredPermissions)
		? requiredPermissions
		: [requiredPermissions];

	if (!hasPermissions(user.permissions, permissions, { mode: options?.mode })) {
		return false;
	}

	if (!options?.scope) {
		return true;
	}

	return user.assignments.some((assignment) =>
		assignmentMatchesScope(assignment, options.scope as AccessScope),
	);
}
