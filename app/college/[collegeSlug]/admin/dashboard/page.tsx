import { createCollegeAdminDashboardContent } from "@/features/dashboard/config/dashboardContent";
import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import { getCurrentRoleLabel } from "@/lib/auth/server-session";

export default async function CollegeAdminDashboardPage({
	params,
}: {
	params: Promise<{ collegeSlug: string }>;
}) {
	const { collegeSlug } = await params;
	const dashboard = createCollegeAdminDashboardContent(collegeSlug);
	const roleLabel = await getCurrentRoleLabel(dashboard.roleLabel);

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title={dashboard.title}
			subtitle={dashboard.subtitle}
			domain="admin"
			roleLabel={roleLabel}
			tenantSlug={collegeSlug}
			stats={dashboard.stats}
			highlights={dashboard.highlights}
			activity={dashboard.activity}
			quickLinks={dashboard.quickLinks}
			reportPanel={dashboard.reportPanel}
			tenantContext={dashboard.tenantContext}
		/>
	);
}
