import { createSuperadminDashboardContent } from "@/features/dashboard/config/dashboardContent";
import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import {
	getCurrentAuthSession,
	getCurrentRoleLabel,
} from "@/lib/auth/server-session";
import { getProvisionedColleges } from "@/lib/services/superadmin-college.service";
import { getSuperadminReportData } from "@/lib/services/superadmin-report.service";
import { redirect } from "next/navigation";

export default async function SuperadminDashboardPage() {
	const session = await getCurrentAuthSession();

	if (session?.user.domain !== "superadmin") {
		redirect("/staff/signin");
	}

	const [colleges, reportData] = await Promise.all([
		getProvisionedColleges().catch(() => []),
		getSuperadminReportData().catch(() => null),
	]);
	const dashboard = createSuperadminDashboardContent({
		colleges,
		reportData,
	});
	const roleLabel = await getCurrentRoleLabel(dashboard.roleLabel);

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title={dashboard.title}
			subtitle={dashboard.subtitle}
			domain="superadmin"
			roleLabel={roleLabel}
			stats={dashboard.stats}
			highlights={dashboard.highlights}
			activity={dashboard.activity}
			quickLinks={dashboard.quickLinks}
			reportPanel={dashboard.reportPanel}
			tenantContext={dashboard.tenantContext}
		/>
	);
}
