import type {
	DashboardActivity,
	DashboardHighlight,
	DashboardQuickLink,
	DashboardReportPanel,
	DashboardStat,
	DashboardTenantContext,
} from "@/features/dashboard/components/RoleDashboardShell";
import { DEFAULT_MVP_COLLEGE_SLUG } from "@/lib/auth";

type DashboardContentBundle = {
	badge: string;
	title: string;
	subtitle: string;
	roleLabel: string;
	stats: DashboardStat[];
	highlights: DashboardHighlight[];
	activity: DashboardActivity[];
	quickLinks: DashboardQuickLink[];
	reportPanel?: DashboardReportPanel;
	tenantContext?: DashboardTenantContext;
};

const DEFAULT_STUDENT_DASHBOARD_PATH = `/college/${DEFAULT_MVP_COLLEGE_SLUG}/student/dashboard`;
const DEFAULT_STAFF_DASHBOARD_PATH = `/college/${DEFAULT_MVP_COLLEGE_SLUG}/staff/dashboard`;

export function formatCollegeName(collegeSlug: string) {
	return collegeSlug
		.split("-")
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

export function createCollegeTenantContext(
	collegeSlug: string,
	description?: string,
): DashboardTenantContext {
	const collegeName = formatCollegeName(collegeSlug);

	return {
		label: "College Context",
		name: collegeName,
		description:
			description ??
			"All data, permissions, and dashboard actions in this workspace are scoped to the selected college.",
	};
}

export function createStudentDashboardContent(
	options?: {
		collegeSlug?: string;
	},
): DashboardContentBundle {
	const tenantContext = options?.collegeSlug
		? createCollegeTenantContext(
				options.collegeSlug,
				"Student access is restricted to this college only, including applications, payments, and notices.",
			)
		: undefined;
	const admissionPath = options?.collegeSlug
		? `/college/${options.collegeSlug}/student/admission`
		: "/";

	return {
		badge: "Student Dashboard",
		title: tenantContext ? "College student dashboard" : "Student dashboard",
		subtitle:
			"Track your application progress, payments, profile readiness, and student-facing notices from one guided portal.",
		roleLabel: tenantContext ? "College Student" : "Student / Applicant",
		tenantContext,
		stats: [
			{
				label: "Application Status",
				value: "In review",
				change: "Screening updated this week",
			},
			{
				label: "Payment Status",
				value: "Paid",
				change: "Application fee verified",
			},
			{
				label: "Profile Score",
				value: "92%",
				change: "Only supporting details left",
			},
			{
				label: "Unread Notices",
				value: "06",
				change: "2 new updates today",
			},
		],
		highlights: [
			{
				title: "Application progress",
				meta: "Guided next steps",
				description:
					"Follow the admission journey from biodata completion to payment confirmation and final decision readiness.",
			},
			{
				title: "Payment activity",
				meta: "Receipts and status",
				description:
					"Review verified payments, admission charges, and receipt history without leaving the dashboard.",
			},
			{
				title: "Student notices",
				meta: "Important updates",
				description:
					"Stay current on deadlines, portal changes, and departmental updates relevant to your application.",
			},
			{
				title: "Support and help",
				meta: "Contact pathways",
				description:
					"Know the next action required and reach the correct office quickly when you need help.",
			},
		],
		activity: [
			{
				label: "Current stage",
				value: "Programme review",
				note: "Your programme selection is awaiting final admissions screening.",
			},
			{
				label: "Last payment event",
				value: "Today",
				note: "Paystack verification completed successfully for the application fee.",
			},
			{
				label: "Profile completion",
				value: "4 of 5",
				note: "Add the remaining record details to fully complete your profile.",
			},
		],
		quickLinks: [
			{
				label: "Continue admission profile",
				href: admissionPath,
				description:
					"Return to the admission flow and continue your application details.",
			},
			{
				label: "Student sign in",
				href: "/signin",
				description:
					"Use the student portal entry path again from the public access screen.",
			},
			{
				label: "Reset password",
				href: "/forgot-password",
				description:
					"Recover access if you cannot remember your student portal credentials.",
			},
		],
	};
}

export function createStaffDashboardContent(
	options?: {
		collegeSlug?: string;
	},
): DashboardContentBundle {
	const tenantContext = options?.collegeSlug
		? createCollegeTenantContext(
				options.collegeSlug,
				"Staff members share one operational shell, but every queue, approval, and report remains scoped to this college.",
			)
		: undefined;

	return {
		badge: "Staff Dashboard",
		title: tenantContext ? "College staff dashboard" : "Staff dashboard",
		subtitle:
			"Shared operational workspace for internal staff, with modules and review tools tailored by the role assigned by superadmin.",
		roleLabel: tenantContext ? "College Staff Role" : "Dynamic staff role",
		tenantContext,
		stats: [
			{
				label: "Assigned Tasks",
				value: "18",
				change: "6 due this week",
			},
			{
				label: "Pending Approvals",
				value: "09",
				change: "Admissions queue still active",
			},
			{
				label: "Internal Notices",
				value: "11",
				change: "3 high-priority updates",
			},
			{
				label: "Resolved Today",
				value: "14",
				change: "Operational throughput steady",
			},
		],
		highlights: [
			{
				title: "Role-based workspace",
				meta: "One shell, many roles",
				description:
					"Lecturers, clerks, bursary officers, and admissions staff share one dashboard shell with role-specific tools.",
			},
			{
				title: "Approvals and queues",
				meta: "Operational flow",
				description:
					"Monitor pending actions, internal review queues, and cross-department work in one operating space.",
			},
			{
				title: "Academic and admin tools",
				meta: "Practical modules",
				description:
					"Surface the right modules for records, finance, admissions, and internal approvals based on the assigned role.",
			},
			{
				title: "Internal notices",
				meta: "Shared awareness",
				description:
					"Keep staff aligned on internal changes, deadlines, and management communication across the institution.",
			},
		],
		activity: [
			{
				label: "Current queue",
				value: "Admissions",
				note: "Application screening is the highest-volume work queue in the current session.",
			},
			{
				label: "Response target",
				value: "24 hrs",
				note: "Internal service target for unresolved review items and status updates.",
			},
			{
				label: "Operational focus",
				value: "Cutoff review",
				note: "Programme thresholds and transfer decisions are still being finalized.",
			},
		],
		quickLinks: [
			{
				label: "Staff sign in",
				href: "/staff/signin",
				description: "Return to the internal sign-in path for role-based access.",
			},
			{
				label: "Staff forgot password",
				href: "/staff/forgot-password",
				description:
					"Recover access to the internal portal without going through the student flow.",
			},
			{
				label: "Student portal access",
				href: "/signin",
				description:
					"Switch back to the student-facing access route when reviewing that journey.",
			},
		],
	};
}

export function createCollegeAdminDashboardContent(
	collegeSlug: string,
): DashboardContentBundle {
	const staffDashboardPath = `/college/${collegeSlug}/staff/dashboard`;
	const studentDashboardPath = `/college/${collegeSlug}/student/dashboard`;

	return {
		badge: "College Admin Dashboard",
		title: "College admin dashboard",
		subtitle:
			"Manage one college’s staff, students, notices, and operational reporting from an admin-level workspace.",
		roleLabel: "College Admin",
		tenantContext: createCollegeTenantContext(
			collegeSlug,
			"This admin view is scoped to one college and is responsible for staff, student, and operational governance within that college.",
		),
		stats: [
			{
				label: "Active Students",
				value: "3.2k",
				change: "Current college enrollment",
			},
			{
				label: "Staff Members",
				value: "124",
				change: "Across academic and admin teams",
			},
			{
				label: "Open Issues",
				value: "17",
				change: "Student and staff items awaiting action",
			},
			{
				label: "Notice Reach",
				value: "94%",
				change: "Recent internal notices delivered",
			},
		],
		highlights: [
			{
				title: "College user management",
				meta: "Students and staff",
				description:
					"Manage student records, staff accounts, and college-specific operational access from one control space.",
			},
			{
				title: "College operations",
				meta: "Approvals and oversight",
				description:
					"Review pending actions, notices, escalations, and day-to-day administrative operations within the college.",
			},
			{
				title: "Internal reporting",
				meta: "College-only analytics",
				description:
					"Track admissions movement, payment activity, and staff performance for this college only.",
			},
			{
				title: "Governance controls",
				meta: "Scoped administration",
				description:
					"Maintain college settings, local announcements, and role assignments without crossing tenant boundaries.",
			},
		],
		activity: [
			{
				label: "Top concern",
				value: "Staff coverage",
				note: "Two departments currently have open staff assignment requests awaiting approval.",
			},
			{
				label: "Daily focus",
				value: "Student onboarding",
				note: "College-level onboarding completion remains the main operational priority today.",
			},
			{
				label: "Admin health",
				value: "Stable",
				note: "No unresolved college-wide escalation is currently blocking operational flow.",
			},
		],
		quickLinks: [
			{
				label: "Review college staff",
				href: staffDashboardPath,
				description:
					"Inspect the shared staff workspace and operational queues under the same college scope.",
			},
			{
				label: "Review college student portal",
				href: studentDashboardPath,
				description:
					"Compare the student-facing experience against the college admin perspective.",
			},
			{
				label: "Platform overview",
				href: "/superadmin/dashboard",
				description:
					"Return to the superadmin view when reviewing multi-college oversight.",
			},
		],
		reportPanel: {
			badge: "College Operations",
			title: "Department readiness snapshot",
			description:
				"Operational view of department-level onboarding, staff coverage, and student support readiness for this college.",
			summary: "Department view",
			variant: "line",
			points: [
				{ label: "Science", value: 72, amount: "84% ready" },
				{ label: "Business", value: 58, amount: "71% ready" },
				{ label: "Arts", value: 46, amount: "63% ready" },
				{ label: "Engineering", value: 82, amount: "91% ready" },
			],
		},
	};
}

export function createSuperadminDashboardContent(): DashboardContentBundle {
	return {
		badge: "Superadmin Dashboard",
		title: "Superadmin dashboard",
		subtitle:
			"Executive reporting, staff governance, role controls, and institution-wide oversight for principal and superadmin access.",
		roleLabel: "Principal / Superadmin",
		stats: [
			{
				label: "Active Students",
				value: "12.4k",
				change: "Admissions trend up 8%",
			},
			{
				label: "Staff Accounts",
				value: "486",
				change: "12 new assignments this term",
			},
			{
				label: "Total Revenue",
				value: "NGN 84.6M",
				change: "Collections updated today",
			},
			{
				label: "Audit Events",
				value: "1.2k",
				change: "System activity fully tracked",
			},
		],
		highlights: [
			{
				title: "Executive reporting",
				meta: "Institution-wide view",
				description:
					"Review admissions, payments, staff usage, and operational performance from one institutional dashboard.",
			},
			{
				title: "Role and permission control",
				meta: "Governance",
				description:
					"Create staff roles, assign permissions, and manage access across internal operational modules.",
			},
			{
				title: "Staff creation and oversight",
				meta: "Provisioning",
				description:
					"Provision new internal users, assign their role path, and manage dashboard access centrally.",
			},
			{
				title: "Audit and compliance",
				meta: "Accountability",
				description:
					"Track critical system actions and maintain institution-level accountability across workflows.",
			},
		],
		activity: [
			{
				label: "Priority watch",
				value: "Admissions revenue",
				note: "Executive revenue reporting is driving this week's operational decisions.",
			},
			{
				label: "Provisioning requests",
				value: "07",
				note: "Seven staff role assignment requests are pending approval by superadmin.",
			},
			{
				label: "Audit health",
				value: "Stable",
				note: "No unresolved compliance alerts are open in the current reporting window.",
			},
		],
		quickLinks: [
			{
				label: "Superadmin entry",
				href: "/staff/signin",
				description:
					"Use the internal sign-in path and role redirect to reach the admin domain.",
			},
			{
				label: "Review staff portal",
				href: DEFAULT_STAFF_DASHBOARD_PATH,
				description:
					"Check the staff operating workspace and role-driven internal modules.",
			},
			{
				label: "Review student portal",
				href: DEFAULT_STUDENT_DASHBOARD_PATH,
				description:
					"Compare the student-facing journey against the operational admin view.",
			},
		],
		reportPanel: {
			badge: "Executive Report",
			title: "Collections and enrollment trend",
			description:
				"Quick monthly view of admissions-related collections and enrollment movement for executive review.",
			summary: "Last 4 months",
			variant: "bar",
			points: [
				{ label: "Jan", value: 48, amount: "NGN 14.2M" },
				{ label: "Feb", value: 62, amount: "NGN 18.6M" },
				{ label: "Mar", value: 74, amount: "NGN 22.1M" },
				{ label: "Apr", value: 88, amount: "NGN 26.4M" },
			],
		},
	};
}
