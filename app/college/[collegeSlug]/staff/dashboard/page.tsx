import { createStaffDashboardContent } from "@/features/dashboard/config/dashboardContent";
import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import StaffOperationsWorkspace from "@/features/dashboard/components/StaffOperationsWorkspace";

export default async function CollegeStaffDashboardPage({
	params,
}: {
	params: Promise<{ collegeSlug: string }>;
}) {
	const { collegeSlug } = await params;
	const dashboard = createStaffDashboardContent({ collegeSlug });

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title={dashboard.title}
			subtitle={dashboard.subtitle}
			domain="staff"
			roleLabel={dashboard.roleLabel}
			tenantSlug={collegeSlug}
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
