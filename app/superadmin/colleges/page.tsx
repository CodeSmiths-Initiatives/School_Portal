import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import { createSuperadminDashboardContent } from "@/features/dashboard/config/dashboardContent";
import { CollegeProvisioningWorkspace } from "@/features/superadmin/components/CollegeProvisioningWorkspace";
import { getCurrentAuthSession, getCurrentRoleLabel } from "@/lib/auth/server-session";
import { getProvisionedColleges } from "@/lib/services/superadmin-college.service";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Colleges | Superadmin",
	description: "Create and manage college tenants and primary college admins.",
};

export default async function SuperadminCollegesPage() {
	const session = await getCurrentAuthSession();

	if (session?.user.domain !== "superadmin") {
		redirect("/staff/signin");
	}

	const dashboard = createSuperadminDashboardContent();
	const roleLabel = await getCurrentRoleLabel(dashboard.roleLabel);
	const colleges = await getProvisionedColleges().catch(() => []);

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title="College management"
			subtitle="Provision college tenants, create the primary college admin, and keep admission entry points tenant-aware."
			domain="superadmin"
			roleLabel={roleLabel}
			activeMenuKey="colleges"
			stats={dashboard.stats}
			highlights={dashboard.highlights}
			activity={dashboard.activity}
			quickLinks={dashboard.quickLinks}
			reportPanel={dashboard.reportPanel}
			tenantContext={dashboard.tenantContext}
			showOverviewContent={false}
			contentWidth="wide"
		>
			<CollegeProvisioningWorkspace initialColleges={colleges} />
		</RoleDashboardShell>
	);
}
