import type { DashboardDomain } from "@/lib/auth";

export type PermissionKey = `${string}.${string}`;
export type UserPermissionKey = PermissionKey | "*";

export type PermissionDefinition = {
	key: PermissionKey;
	module: string;
	action: string;
	label: string;
	description?: string;
};

export type PermissionMode = "all" | "any";

export type TenantScopeType = "platform" | "college" | (string & {});

export type RoleScopeType =
	| "platform"
	| "college"
	| "faculty"
	| "department"
	| "course"
	| "self"
	| (string & {});

export type ScopeSubject = {
	collegeId?: string;
	facultyId?: string;
	departmentId?: string;
	courseId?: string;
	userId?: string;
};

export type AccessScope = ScopeSubject & {
	scopeType: RoleScopeType;
};

export type UserAssignment = AccessScope & {
	id?: string;
	label?: string;
	startsAt?: string;
	endsAt?: string;
	isPrimary?: boolean;
};

export type RoleDefinition = {
	id: string;
	name: string;
	scopeType: RoleScopeType;
	tenantScope: TenantScopeType;
	permissions: UserPermissionKey[];
	isSystem?: boolean;
	collegeId?: string;
	description?: string;
};

export type RbacUserContext = {
	id: string;
	name: string;
	email?: string;
	domain: DashboardDomain;
	role: RoleDefinition;
	tenantScope: TenantScopeType;
	permissions: UserPermissionKey[];
	assignments: UserAssignment[];
	collegeId?: string;
	departmentId?: string;
};

export type MenuItemDefinition = {
	key: string;
	label: string;
	href: string;
	icon: string;
	domains: DashboardDomain[];
	requiredPermissions: PermissionKey[];
	permissionMode?: PermissionMode;
	children?: MenuItemDefinition[];
};

export type ActionDefinition = {
	key: string;
	label: string;
	module: string;
	requiredPermissions: PermissionKey[];
	permissionMode?: PermissionMode;
};

export type PermissionCheckOptions = {
	mode?: PermissionMode;
	scope?: AccessScope;
};
