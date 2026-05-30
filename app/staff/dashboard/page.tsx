import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import StaffOperationsWorkspace from "@/features/dashboard/components/StaffOperationsWorkspace";

export default function StaffDashboardPage() {
	return (
		<RoleDashboardShell
			badge="Staff Dashboard"
			title="Staff dashboard"
			subtitle="Shared operational workspace for internal staff, with modules and review tools tailored by the role assigned by superadmin."
			domain="staff"
			roleLabel="Dynamic staff role"
			stats={[
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
			]}
			highlights={[
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
			]}
			activity={[
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
			]}
			quickLinks={[
				{
					label: "Staff sign in",
					href: "/staff/signin",
					description: "Return to the internal sign-in path for role-based access.",
				},
				{
					label: "Staff forgot password",
					href: "/staff/forgot-password",
					description: "Recover access to the internal portal without going through the student flow.",
				},
				{
					label: "Student portal access",
					href: "/signin",
					description: "Switch back to the student-facing access route when reviewing that journey.",
				},
			]}
		>
			<StaffOperationsWorkspace />
		</RoleDashboardShell>
	);
}
