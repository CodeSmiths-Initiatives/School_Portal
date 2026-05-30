import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";

export default function StudentDashboardPage() {
	return (
		<RoleDashboardShell
			badge="Student Dashboard"
			title="Student dashboard"
			subtitle="Track your application progress, payments, profile readiness, and student-facing notices from one guided portal."
			domain="student"
			roleLabel="Student / Applicant"
			stats={[
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
			]}
			highlights={[
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
			]}
			activity={[
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
			]}
			quickLinks={[
				{
					label: "Continue admission profile",
					href: "/",
					description: "Return to the admission flow and continue your application details.",
				},
				{
					label: "Student sign in",
					href: "/signin",
					description: "Use the student portal entry path again from the public access screen.",
				},
				{
					label: "Reset password",
					href: "/forgot-password",
					description: "Recover access if you cannot remember your student portal credentials.",
				},
			]}
		/>
	);
}
