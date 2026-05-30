import type { ActionDefinition } from "./types";

export const ACTION_CATALOG = [
	{
		key: "students.create",
		label: "Add Student",
		module: "Students",
		requiredPermissions: ["students.create"],
	},
	{
		key: "students.update",
		label: "Edit Student",
		module: "Students",
		requiredPermissions: ["students.update"],
	},
	{
		key: "students.delete",
		label: "Delete Student",
		module: "Students",
		requiredPermissions: ["students.delete"],
	},
	{
		key: "courses.create",
		label: "Add Course",
		module: "Courses",
		requiredPermissions: ["courses.create"],
	},
	{
		key: "courses.assign_staff",
		label: "Assign Lecturer",
		module: "Courses",
		requiredPermissions: ["courses.assign_staff"],
	},
	{
		key: "results.upload",
		label: "Upload Result",
		module: "Results",
		requiredPermissions: ["results.upload"],
	},
	{
		key: "results.approve",
		label: "Approve Result",
		module: "Results",
		requiredPermissions: ["results.approve"],
	},
	{
		key: "payments.verify",
		label: "Verify Payment",
		module: "Payments",
		requiredPermissions: ["payments.verify"],
	},
	{
		key: "roles.assign_permissions",
		label: "Assign Permissions",
		module: "Roles",
		requiredPermissions: ["roles.assign_permissions"],
	},
] as const satisfies readonly ActionDefinition[];

