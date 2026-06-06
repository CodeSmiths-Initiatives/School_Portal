import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import { createSuperadminDashboardContent } from "@/features/dashboard/config/dashboardContent";
import { SuperadminAuditWorkspace } from "@/features/superadmin/components/SuperadminAuditWorkspace";
import {
	getCurrentAuthSession,
	getCurrentRoleLabel,
} from "@/lib/auth/server-session";
import { getSuperadminAuditData } from "@/lib/services/superadmin-audit.service";
import { getProvisionedColleges } from "@/lib/services/superadmin-college.service";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Audit | Superadmin",
	description:
		"Review platform-wide audit activity by college, actor, date range, and event type.",
};

export default async function SuperadminAuditPage() {
	const session = await getCurrentAuthSession();

	if (session?.user.domain !== "superadmin") {
		redirect("/staff/signin");
	}

	const dashboard = createSuperadminDashboardContent();
	const roleLabel = await getCurrentRoleLabel(dashboard.roleLabel);
	const [colleges, auditData] = await Promise.all([
		getProvisionedColleges().catch(() => []),
		getSuperadminAuditData().catch(() => null),
	]);

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title="Platform audit"
			subtitle="Review who did what, when it happened, what changed, and which college tenant was affected."
			domain="superadmin"
			roleLabel={roleLabel}
			activeMenuKey="audit"
			stats={dashboard.stats}
			highlights={dashboard.highlights}
			activity={dashboard.activity}
			quickLinks={dashboard.quickLinks}
			reportPanel={dashboard.reportPanel}
			tenantContext={dashboard.tenantContext}
			showOverviewContent={false}
			contentWidth="wide"
		>
			<SuperadminAuditWorkspace colleges={colleges} auditData={auditData} />
		</RoleDashboardShell>
	);
}
