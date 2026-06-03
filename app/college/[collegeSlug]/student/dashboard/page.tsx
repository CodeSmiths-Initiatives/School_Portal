import { createStudentDashboardContent } from "@/features/dashboard/config/dashboardContent";
import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import { getCurrentRoleLabel } from "@/lib/auth/server-session";

export default async function CollegeStudentDashboardPage({
	params,
}: {
	params: Promise<{ collegeSlug: string }>;
}) {
	const { collegeSlug } = await params;
	const dashboard = createStudentDashboardContent({ collegeSlug });
	const roleLabel = await getCurrentRoleLabel(dashboard.roleLabel);

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title={dashboard.title}
			subtitle={dashboard.subtitle}
			domain="student"
			roleLabel={roleLabel}
			tenantSlug={collegeSlug}
			stats={dashboard.stats}
			highlights={dashboard.highlights}
			activity={dashboard.activity}
			quickLinks={dashboard.quickLinks}
			tenantContext={dashboard.tenantContext}
		/>
	);
}
