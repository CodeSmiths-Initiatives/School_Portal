import { createStaffDashboardContent } from "@/features/dashboard/config/dashboardContent";
import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import StaffOperationsWorkspace from "@/features/dashboard/components/StaffOperationsWorkspace";

export default function StaffDashboardPage() {
	const dashboard = createStaffDashboardContent();

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title={dashboard.title}
			subtitle={dashboard.subtitle}
			domain="staff"
			roleLabel={dashboard.roleLabel}
			stats={dashboard.stats}
			highlights={dashboard.highlights}
			activity={dashboard.activity}
			quickLinks={dashboard.quickLinks}
			tenantContext={dashboard.tenantContext}
		>
			<StaffOperationsWorkspace />
		</RoleDashboardShell>
	);
}
