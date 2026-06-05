import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import { createSuperadminDashboardContent } from "@/features/dashboard/config/dashboardContent";
import { GlobalRolePermissionWorkspace } from "@/features/superadmin/components/GlobalRolePermissionWorkspace";
import { getCurrentAuthSession, getCurrentRoleLabel } from "@/lib/auth/server-session";
import { getGlobalRoleManagement } from "@/lib/services/superadmin-role.service";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Roles | Superadmin",
	description: "Manage global student and college admin role permissions.",
};

export default async function SuperadminRolesPage() {
	const session = await getCurrentAuthSession();

	if (session?.user.domain !== "superadmin") {
		redirect("/staff/signin");
	}

	const dashboard = createSuperadminDashboardContent();
	const roleLabel = await getCurrentRoleLabel(dashboard.roleLabel);
	const roleData = await getGlobalRoleManagement().catch(() => ({
		roles: [],
		permissions: [],
	}));

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title="Role permissions"
			subtitle="Manage the global Student and College Admin role templates used across every college tenant."
			domain="superadmin"
			roleLabel={roleLabel}
			activeMenuKey="roles"
			stats={dashboard.stats}
			highlights={dashboard.highlights}
			activity={dashboard.activity}
			quickLinks={dashboard.quickLinks}
			reportPanel={dashboard.reportPanel}
			tenantContext={dashboard.tenantContext}
			showOverviewContent={false}
			contentWidth="wide"
		>
			<GlobalRolePermissionWorkspace initialData={roleData} />
		</RoleDashboardShell>
	);
}
