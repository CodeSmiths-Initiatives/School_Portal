import type { PermissionKey } from "@/lib/rbac";

export type CollegeModuleKey =
	| "courses"
	| "results"
	| "hostel"
	| "payments";

export type CollegeModuleIconName =
	| "BookOpenCheck"
	| "ClipboardCheck"
	| "Building2"
	| "CircleDollarSign";

export type CollegeModuleAction = {
	label: string;
	description: string;
	requiredPermissions: PermissionKey[];
};

export type CollegeModuleMetric = {
	label: string;
	value: string;
	description: string;
};

export type CollegeModulePanel = {
	title: string;
	description: string;
};

export type CollegeModuleConfig = {
	key: CollegeModuleKey;
	activeMenuKey: string;
	badge: string;
	title: string;
	description: string;
	icon: CollegeModuleIconName;
	requiredPermissions: PermissionKey[];
	metrics: CollegeModuleMetric[];
	panels: CollegeModulePanel[];
	actions: CollegeModuleAction[];
};

export const COLLEGE_MODULES = {
	courses: {
		key: "courses",
		activeMenuKey: "courses",
		badge: "College Course Module",
		title: "Course management workspace",
		description:
			"Shared college-scoped course module for student registration, staff teaching workflows, adviser review, and admin course governance.",
		icon: "BookOpenCheck",
		requiredPermissions: ["courses.view"],
		metrics: [
			{
				label: "Active Courses",
				value: "42",
				description: "Published for the current academic session",
			},
			{
				label: "Pending Review",
				value: "08",
				description: "Awaiting adviser or HOD attention",
			},
			{
				label: "Credit Load",
				value: "18",
				description: "Average registered student load",
			},
		],
		panels: [
			{
				title: "Course catalogue",
				description:
					"Reusable list area for college courses, departments, levels, and semester filters.",
			},
			{
				title: "Registration and assignment",
				description:
					"Students register courses, while staff and admins receive assignment and approval tools through permissions.",
			},
			{
				title: "Approval state",
				description:
					"Course changes can move through draft, submitted, approved, or rejected states without changing this route.",
			},
			{
				title: "Audit trail",
				description:
					"Future integration can show who created, assigned, approved, or updated each course.",
			},
		],
		actions: [
			{
				label: "Register courses",
				description: "Student-facing semester course registration action.",
				requiredPermissions: ["courses.register"],
			},
			{
				label: "Add course",
				description: "College admin or authorized staff can create a course.",
				requiredPermissions: ["courses.create"],
			},
			{
				label: "Assign lecturer",
				description: "Assign course owners or teaching staff inside the college.",
				requiredPermissions: ["courses.assign_staff"],
			},
		],
	},
	results: {
		key: "results",
		activeMenuKey: "results",
		badge: "College Result Module",
		title: "Result management workspace",
		description:
			"Shared result module for released student results, staff uploads, approval queues, print requests, and transcript readiness.",
		icon: "ClipboardCheck",
		requiredPermissions: ["results.view"],
		metrics: [
			{
				label: "Published Results",
				value: "316",
				description: "Visible to eligible students",
			},
			{
				label: "Uploads Pending",
				value: "14",
				description: "Awaiting review or correction",
			},
			{
				label: "Approval Queue",
				value: "06",
				description: "Waiting for academic approval",
			},
		],
		panels: [
			{
				title: "Student result view",
				description:
					"Students see only their own released results and print/request status.",
			},
			{
				title: "Result upload queue",
				description:
					"Authorized staff can upload or amend results based on assigned department/course scope.",
			},
			{
				title: "Approval workflow",
				description:
					"HODs, college admins, or approved roles can approve, reject, and publish result batches.",
			},
			{
				title: "Print and verification",
				description:
					"Future workflows can generate result slips, verification records, and transcript requests.",
			},
		],
		actions: [
			{
				label: "Upload result",
				description: "Upload result batches for assigned courses or departments.",
				requiredPermissions: ["results.upload"],
			},
			{
				label: "Approve result",
				description: "Approve reviewed result batches for release.",
				requiredPermissions: ["results.approve"],
			},
			{
				label: "Print result",
				description: "Generate printable result records.",
				requiredPermissions: ["results.print"],
			},
		],
	},
	hostel: {
		key: "hostel",
		activeMenuKey: "hostel",
		badge: "College Hostel Module",
		title: "Hostel management workspace",
		description:
			"Shared hostel module for accommodation applications, allocations, room readiness, payment status, and residence notices.",
		icon: "Building2",
		requiredPermissions: ["hostels.view"],
		metrics: [
			{
				label: "Open Requests",
				value: "27",
				description: "Student accommodation applications",
			},
			{
				label: "Rooms Ready",
				value: "112",
				description: "Available in active residence blocks",
			},
			{
				label: "Allocations",
				value: "74%",
				description: "Current allocation progress",
			},
		],
		panels: [
			{
				title: "Accommodation request",
				description:
					"Students can track application status and required hostel documentation.",
			},
			{
				title: "Room allocation",
				description:
					"Authorized staff can allocate rooms or update residence status inside college scope.",
			},
			{
				title: "Residence payments",
				description:
					"Payment trails and outstanding accommodation charges can be connected here later.",
			},
			{
				title: "Residence notices",
				description:
					"College-specific hostel announcements can be surfaced without changing the route.",
			},
		],
		actions: [
			{
				label: "Add hostel",
				description: "Create a college-scoped hostel residence and publish capacity.",
				requiredPermissions: ["hostels.create"],
			},
			{
				label: "Edit rooms and beds",
				description: "Update hostel blocks, rooms, bed availability, and residence status.",
				requiredPermissions: ["hostels.update"],
			},
			{
				label: "Allocate hostel",
				description: "Assign eligible students to rooms or residence blocks.",
				requiredPermissions: ["hostels.allocate"],
			},
		],
	},
	payments: {
		key: "payments",
		activeMenuKey: "payments",
		badge: "College Payment Module",
		title: "Payment management workspace",
		description:
			"Shared payment module for student receipts, college finance review, verification status, refunds, exports, and print actions.",
		icon: "CircleDollarSign",
		requiredPermissions: ["payments.view"],
		metrics: [
			{
				label: "Verified Today",
				value: "96",
				description: "Confirmed payment records",
			},
			{
				label: "Pending Review",
				value: "11",
				description: "Manual follow-up required",
			},
			{
				label: "Collections",
				value: "NGN 8.4M",
				description: "College-scoped payment total",
			},
		],
		panels: [
			{
				title: "Student receipts",
				description:
					"Students can review payment status, receipt references, and print-ready records.",
			},
			{
				title: "Verification queue",
				description:
					"Finance or admin users can reconcile gateway status and internal payment records.",
			},
			{
				title: "Refund and exception handling",
				description:
					"Authorized roles can handle payment exceptions without exposing tools to every user.",
			},
			{
				title: "Finance exports",
				description:
					"Payment exports and reports remain college-scoped for tenant-safe reporting.",
			},
		],
		actions: [
			{
				label: "Create payment",
				description: "Initiate or record a permitted student payment.",
				requiredPermissions: ["payments.create"],
			},
			{
				label: "Verify payment",
				description: "Confirm payment status against gateway or finance records.",
				requiredPermissions: ["payments.verify"],
			},
			{
				label: "Export payments",
				description: "Generate college-scoped payment exports.",
				requiredPermissions: ["payments.export"],
			},
			{
				label: "Print receipt",
				description: "Generate print-ready student payment receipts.",
				requiredPermissions: ["payments.print"],
			},
		],
	},
} as const satisfies Record<CollegeModuleKey, CollegeModuleConfig>;

export function isCollegeModuleKey(value: string): value is CollegeModuleKey {
	return value in COLLEGE_MODULES;
}

export function getCollegeModuleConfig(moduleKey: CollegeModuleKey) {
	return COLLEGE_MODULES[moduleKey];
}
