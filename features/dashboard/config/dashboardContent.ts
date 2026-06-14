import type {
	DashboardActivity,
	DashboardReportFilter,
	DashboardHighlight,
	DashboardPaymentReport,
	DashboardQuickLink,
	DashboardReportPanel,
	DashboardStat,
	DashboardTenantContext,
} from "@/features/dashboard/components/RoleDashboardShell";
import type { CollegeAdminReportPayload } from "@/lib/services/college-admin.service";
import type { ProvisionedCollege } from "@/lib/services/superadmin-college.service";
import type {
	SuperadminReportData,
	SuperadminReportRow,
} from "@/lib/services/superadmin-report.service";

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
	paymentReports?: DashboardPaymentReport[];
	tenantContext?: DashboardTenantContext;
};

type ReportFilterInput = {
	filters?: DashboardReportFilter[];
	activeFilterSummary?: string;
};

function formatNumber(value: number) {
	return new Intl.NumberFormat("en-NG").format(value);
}

function formatCurrency(value: number) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		maximumFractionDigits: 0,
	}).format(value);
}

function percent(value: number, total: number) {
	return total > 0 ? Math.round((value / total) * 100) : 0;
}

function sumSuperadminRows(rows: SuperadminReportRow[]): SuperadminReportRow {
	return rows.reduce<SuperadminReportRow>(
		(total, row) => ({
			collegeSlug: "all",
			collegeCode: "ALL",
			collegeName: "All Colleges",
			onboardedStudents: total.onboardedStudents + row.onboardedStudents,
			staffAccounts: total.staffAccounts + row.staffAccounts,
			adminAccounts: total.adminAccounts + row.adminAccounts,
			admissionDone: total.admissionDone + row.admissionDone,
			admissionDraft: total.admissionDraft + row.admissionDraft,
			admissionPending: total.admissionPending + row.admissionPending,
			paymentPaid: total.paymentPaid + row.paymentPaid,
			paymentUnpaid: total.paymentUnpaid + row.paymentUnpaid,
			revenue: total.revenue + row.revenue,
			trend: total.trend.map((value, index) => value + (row.trend[index] ?? 0)),
		}),
		{
			collegeSlug: "all",
			collegeCode: "ALL",
			collegeName: "All Colleges",
			onboardedStudents: 0,
			staffAccounts: 0,
			adminAccounts: 0,
			admissionDone: 0,
			admissionDraft: 0,
			admissionPending: 0,
			paymentPaid: 0,
			paymentUnpaid: 0,
			revenue: 0,
			trend: [0, 0, 0, 0, 0, 0],
		},
	);
}

function scalePoints<T extends { value: number }>(points: T[]) {
	const max = Math.max(1, ...points.map((point) => point.value));

	return points.map((point) => ({
		...point,
		value: Math.max(8, Math.round((point.value / max) * 100)),
	}));
}

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
	report?: CollegeAdminReportPayload | null,
	options?: ReportFilterInput,
): DashboardContentBundle {
	const staffDashboardPath = `/college/${collegeSlug}/staff/dashboard`;
	const summary = report?.summary;
	const totalPaid = summary?.totalPaid ?? 0;
	const totalPending = summary?.totalPending ?? 0;
	const paymentTotal = totalPaid + totalPending;
	const paidPercent = percent(totalPaid, paymentTotal);
	const submittedPercent = percent(
		summary?.submittedApplications ?? 0,
		summary?.totalApplications ?? 0,
	);
	const monthlyPayments = report?.charts.monthlyPayments ?? [];
	const monthlyPaymentPoints = scalePoints(monthlyPayments.slice(-6)).map(
		(point) => ({
			label: point.label,
			value: point.value,
			amount: formatCurrency(
				monthlyPayments.find((source) => source.label === point.label)?.value ?? 0,
			),
		}),
	);

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
				value: formatNumber(summary?.totalStudents ?? 0),
				change: `${formatNumber(summary?.totalApplications ?? 0)} admission application records`,
			},
			{
				label: "Payment Paid",
				value: formatCurrency(totalPaid),
				change: `${paidPercent}% of tracked payment value collected`,
			},
			{
				label: "Payment Pending",
				value: formatCurrency(totalPending),
				change: `${formatNumber(summary?.totalInvoices ?? 0)} invoices in the college ledger view`,
			},
			{
				label: "Active Staff",
				value: formatNumber(summary?.activeStaff ?? 0),
				change: "College-scoped staff and admin accounts",
			},
		],
		highlights: [
			{
				title: "Student population",
				meta: `${formatNumber(summary?.totalStudents ?? 0)} records`,
				description:
					"Monitor the college's student base alongside application and admission movement without crossing tenant scope.",
			},
			{
				title: "Application movement",
				meta: `${submittedPercent}% submitted`,
				description:
					`${formatNumber(summary?.submittedApplications ?? 0)} submitted and ${formatNumber(summary?.draftApplications ?? 0)} draft applications need clear admin oversight.`,
			},
			{
				title: "Payment position",
				meta: `${paidPercent}% paid`,
				description:
					"Track collected and pending payment value with college-only invoice totals and month-by-month activity.",
			},
			{
				title: "Staff coverage",
				meta: `${formatNumber(summary?.activeStaff ?? 0)} active`,
				description:
					"Keep operational staffing visible beside admissions, reports, and student support workload.",
			},
		],
		activity: [
			{
				label: "Application queue",
				value: formatNumber(summary?.totalApplications ?? 0),
				note: `${formatNumber(summary?.submittedApplications ?? 0)} submitted and ${formatNumber(summary?.draftApplications ?? 0)} still in draft.`,
			},
			{
				label: "Payment completion",
				value: `${paidPercent}%`,
				note: `${formatCurrency(totalPaid)} collected against ${formatCurrency(totalPending)} pending.`,
			},
			{
				label: "Report freshness",
				value: report?.generatedAt
					? new Intl.DateTimeFormat("en-NG", {
							month: "short",
							day: "numeric",
						}).format(new Date(report.generatedAt))
					: "Live",
				note: "Overview is generated from the same college-scoped reporting service used by reports.",
			},
		],
		quickLinks: [
			{
				label: "Open student records",
				href: `/college/${collegeSlug}/admin/students`,
				description:
					"Review students, admission details, print views, and export-ready records.",
			},
			{
				label: "Open college reports",
				href: `/college/${collegeSlug}/admin/reports`,
				description:
					"Inspect payment, student, application, and staff analytics for this college.",
			},
			{
				label: "Review staff workspace",
				href: staffDashboardPath,
				description:
					"Inspect the shared staff workspace and operational queues under the same college scope.",
			},
		],
		reportPanel: {
			badge: "College Payments",
			title: "Collections by selected period",
			description:
				"Filtered collection movement for this college, paired with pending payment value and invoice volume.",
			summary: options?.activeFilterSummary ?? `${formatNumber(summary?.totalInvoices ?? 0)} invoices`,
			variant: "bar",
			filters: options?.filters,
			points:
				monthlyPaymentPoints.length > 0
					? monthlyPaymentPoints
					: [{ label: "Current", value: 8, amount: formatCurrency(totalPaid) }],
		},
		paymentReports: [
			{
				title: "Collections by month",
				description:
					"Area trend for paid value, pending value, and invoice count so bursary can spot slow collection periods.",
				filters: ["Date range", "Status", "Module"],
			},
			{
				title: "Outstanding invoices",
				description:
					"Age unpaid invoices by programme, student level, and payment category for follow-up queues.",
				filters: ["Programme", "Level", "Age band"],
			},
			{
				title: "Verification activity",
				description:
					"Show verified, failed, and pending transactions with gateway reference and cashier action history.",
				filters: ["Gateway", "Verifier", "Reference"],
			},
		],
	};
}

export function createSuperadminDashboardContent(input?: {
	reportData?: SuperadminReportData | null;
	colleges?: ProvisionedCollege[];
	filters?: DashboardReportFilter[];
	activeFilterSummary?: string;
}): DashboardContentBundle {
	const rows = input?.reportData?.rows ?? [];
	const totals = sumSuperadminRows(rows);
	const collegeCount = input?.colleges?.length ?? rows.length;
	const activeCollegeCount =
		input?.colleges?.filter((college) => college.status === "active").length ??
		rows.filter((row) => row.collegeStatus === "active").length;
	const paymentCount = totals.paymentPaid + totals.paymentUnpaid;
	const paidPercent = percent(totals.paymentPaid, paymentCount);
	const admissionCount =
		totals.admissionDone + totals.admissionDraft + totals.admissionPending;
	const topRevenueRows = [...rows]
		.sort((left, right) => right.revenue - left.revenue)
		.slice(0, 4);
	const revenuePoints = scalePoints(
		topRevenueRows.map((row) => ({ ...row, value: row.revenue })),
	).map((row) => ({
		label: row.collegeCode || row.collegeName,
		value: row.value,
		amount: formatCurrency(row.revenue),
	}));

	return {
		badge: "Superadmin Dashboard",
		title: "Superadmin dashboard",
		subtitle:
			"Executive reporting, college health, payment movement, student growth, staff governance, and institution-wide oversight.",
		roleLabel: "Principal / Superadmin",
		stats: [
			{
				label: "Active Colleges",
				value: formatNumber(activeCollegeCount),
				change: `${formatNumber(collegeCount)} total college workspace${collegeCount === 1 ? "" : "s"}`,
			},
			{
				label: "Students",
				value: formatNumber(totals.onboardedStudents),
				change: `${formatNumber(admissionCount)} admission records across colleges`,
			},
			{
				label: "Total Revenue",
				value: formatCurrency(totals.revenue),
				change: `${paidPercent}% payment completion from live reports`,
			},
			{
				label: "Staff/Admins",
				value: formatNumber(totals.staffAccounts + totals.adminAccounts),
				change: `${formatNumber(totals.adminAccounts)} college admin account${totals.adminAccounts === 1 ? "" : "s"}`,
			},
		],
		highlights: [
			{
				title: "College coverage",
				meta: `${formatNumber(activeCollegeCount)} active`,
				description:
					"Track every provisioned college from one platform view with status, student, payment, and staff signals together.",
			},
			{
				title: "Admission movement",
				meta: `${formatNumber(totals.admissionDone)} completed`,
				description:
					`${formatNumber(totals.admissionDraft)} draft and ${formatNumber(totals.admissionPending)} pending applications remain visible for leadership attention.`,
			},
			{
				title: "Payment oversight",
				meta: `${paidPercent}% paid`,
				description:
					`${formatNumber(totals.paymentPaid)} paid records and ${formatNumber(totals.paymentUnpaid)} unpaid records shape the platform payment picture.`,
			},
			{
				title: "Staff governance",
				meta: `${formatNumber(totals.staffAccounts)} staff`,
				description:
					"Keep staff and college admin account coverage close to the executive metrics that drive platform decisions.",
			},
		],
		activity: [
			{
				label: "Platform scope",
				value: formatNumber(collegeCount),
				note: `${formatNumber(activeCollegeCount)} active college workspaces are included in this overview.`,
			},
			{
				label: "Payment completion",
				value: `${paidPercent}%`,
				note: `${formatCurrency(totals.revenue)} confirmed from live college report rows.`,
			},
			{
				label: "Report freshness",
				value: input?.reportData?.generatedAt
					? new Intl.DateTimeFormat("en-NG", {
							month: "short",
							day: "numeric",
						}).format(new Date(input.reportData.generatedAt))
					: "Live",
				note: "Overview is generated from the live superadmin report service.",
			},
		],
		quickLinks: [
			{
				label: "Manage colleges",
				href: "/superadmin/colleges",
				description:
					"Open college provisioning, status, and tenant setup controls.",
			},
			{
				label: "Open reports",
				href: "/superadmin/reports",
				description:
					"Review college-wise admissions, payments, students, and revenue analytics.",
			},
			{
				label: "Role governance",
				href: "/superadmin/roles",
				description:
					"Manage platform roles, college admin access, and permission templates.",
			},
		],
		reportPanel: {
			badge: "Executive Report",
			title: "Revenue by selected colleges",
			description:
				"Filtered college comparison for revenue concentration, student payment activity, and executive follow-up.",
			summary:
				input?.activeFilterSummary ??
				`${formatNumber(rows.length)} college row${rows.length === 1 ? "" : "s"}`,
			variant: "bar",
			filters: input?.filters,
			points:
				revenuePoints.length > 0
					? revenuePoints
					: [{ label: "Live", value: 8, amount: formatCurrency(totals.revenue) }],
		},
		paymentReports: [
			{
				title: "College revenue ranking",
				description:
					"Rank colleges by collected revenue, unpaid value, completion rate, and transaction volume.",
				filters: ["College", "Date range", "Status"],
			},
			{
				title: "Payment completion mix",
				description:
					"Compare paid versus unpaid records across colleges to identify campuses needing intervention.",
				filters: ["College status", "Module", "Payment state"],
			},
			{
				title: "Reconciliation exceptions",
				description:
					"List gateway successes without matching ledger entries, duplicate references, and stale pending invoices.",
				filters: ["Gateway", "Exception", "Age band"],
			},
		],
	};
}
