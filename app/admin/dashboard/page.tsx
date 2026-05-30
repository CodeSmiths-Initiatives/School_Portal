import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";

export default function AdminDashboardPage() {
	return (
		<RoleDashboardShell
			badge="Superadmin Dashboard"
			title="Superadmin dashboard"
			subtitle="Executive reporting, staff governance, role controls, and institution-wide oversight for principal and superadmin access."
			domain="superadmin"
			roleLabel="Principal / Superadmin"
			stats={[
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
			]}
			highlights={[
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
			]}
			activity={[
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
			]}
			quickLinks={[
				{
					label: "Superadmin entry",
					href: "/staff/signin",
					description: "Use the internal sign-in path and role redirect to reach the admin domain.",
				},
				{
					label: "Review staff portal",
					href: "/staff/dashboard",
					description: "Check the staff operating workspace and role-driven internal modules.",
				},
				{
					label: "Review student portal",
					href: "/student/dashboard",
					description: "Compare the student-facing journey against the operational admin view.",
				},
			]}
			reportPanel={{
				badge: "Executive Report",
				title: "Collections and enrollment trend",
				description:
					"Quick monthly view of admissions-related collections and enrollment movement for executive review.",
				summary: "Last 4 months",
				points: [
					{ label: "Jan", value: 48, amount: "NGN 14.2M" },
					{ label: "Feb", value: 62, amount: "NGN 18.6M" },
					{ label: "Mar", value: 74, amount: "NGN 22.1M" },
					{ label: "Apr", value: 88, amount: "NGN 26.4M" },
				],
			}}
		/>
	);
}
