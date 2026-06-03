import { createSuperadminDashboardContent } from "@/features/dashboard/config/dashboardContent";
import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import { getCurrentRoleLabel } from "@/lib/auth/server-session";

export default async function PlatformDashboardPage() {
	const dashboard = createSuperadminDashboardContent();
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
