import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import { createSuperadminDashboardContent } from "@/features/dashboard/config/dashboardContent";
import { SuperadminSettingsWorkspace } from "@/features/superadmin/components/SuperadminSettingsWorkspace";
import {
	getCurrentAuthSession,
	getCurrentRoleLabel,
} from "@/lib/auth/server-session";
import { createDefaultPlatformSettings } from "@/lib/services/superadmin-settings.service";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Settings | Superadmin",
	description:
		"Manage Superadmin security, platform notifications, and maintenance windows.",
};

export default async function SuperadminSettingsPage() {
	const session = await getCurrentAuthSession();

	if (session?.user.domain !== "superadmin") {
		redirect("/staff/signin");
	}

	const dashboard = createSuperadminDashboardContent();
	const roleLabel = await getCurrentRoleLabel(dashboard.roleLabel);
	const settings = createDefaultPlatformSettings();

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title="Platform settings"
			subtitle="Manage account security, platform-wide notifications, and maintenance messaging from one Superadmin control room."
			domain="superadmin"
			roleLabel={roleLabel}
			activeMenuKey="settings"
			stats={dashboard.stats}
			highlights={dashboard.highlights}
			activity={dashboard.activity}
			quickLinks={dashboard.quickLinks}
			reportPanel={dashboard.reportPanel}
			tenantContext={dashboard.tenantContext}
			showOverviewContent={false}
			contentWidth="wide"
		>
			<SuperadminSettingsWorkspace
				initialSettings={settings}
				actorName={session.user.name ?? session.user.username ?? "Superadmin"}
			/>
		</RoleDashboardShell>
	);
}
