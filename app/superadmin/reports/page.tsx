import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import { createSuperadminDashboardContent } from "@/features/dashboard/config/dashboardContent";
import { SuperadminReportWorkspace } from "@/features/superadmin/components/SuperadminReportWorkspace";
import {
	getCurrentAuthSession,
	getCurrentRoleLabel,
} from "@/lib/auth/server-session";
import { getProvisionedColleges } from "@/lib/services/superadmin-college.service";
import { getSuperadminReportData } from "@/lib/services/superadmin-report.service";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Reports | Superadmin",
	description:
		"Review college-wise admissions, payments, students, and performance reports.",
};

export default async function SuperadminReportsPage() {
	const session = await getCurrentAuthSession();

	if (session?.user.domain !== "superadmin") {
		redirect("/staff/signin");
	}

	const dashboard = createSuperadminDashboardContent();
	const roleLabel = await getCurrentRoleLabel(dashboard.roleLabel);
	const [colleges, reportData] = await Promise.all([
		getProvisionedColleges().catch(() => []),
		getSuperadminReportData().catch(() => null),
	]);
	const activeColleges = colleges.filter((college) => college.status === "active");

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title="Platform reports"
			subtitle="Review college-wise admissions, student onboarding, payment status, unpaid balances, and revenue analytics."
			domain="superadmin"
			roleLabel={roleLabel}
			activeMenuKey="reports"
			stats={dashboard.stats}
			highlights={dashboard.highlights}
			activity={dashboard.activity}
			quickLinks={dashboard.quickLinks}
			reportPanel={dashboard.reportPanel}
			tenantContext={dashboard.tenantContext}
			showOverviewContent={false}
			contentWidth="wide"
		>
			<SuperadminReportWorkspace
				colleges={activeColleges}
				reportData={reportData}
			/>
		</RoleDashboardShell>
	);
}
