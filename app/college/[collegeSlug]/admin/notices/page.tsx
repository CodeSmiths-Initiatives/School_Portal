import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import { createCollegeAdminDashboardContent } from "@/features/dashboard/config/dashboardContent";
import { NoticeCenterWorkspace } from "@/features/notifications";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	getDefaultPermissionsForDomain,
	type UserPermissionKey,
} from "@/lib/rbac";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Notices | College Admin",
	description: "Review college admin in-app notifications.",
};

export default async function CollegeAdminNoticesPage({
	params,
}: {
	params: Promise<{ collegeSlug: string }>;
}) {
	const { collegeSlug } = await params;
	const session = await getCurrentAuthSession();

	if (!session) {
		redirect("/staff/signin");
	}

	if (session.user.domain !== "admin" || session.user.collegeSlug !== collegeSlug) {
		redirect(session.destination.path);
	}

	const dashboard = createCollegeAdminDashboardContent(collegeSlug);
	const permissions = (session.user.permissions?.length
		? session.user.permissions
		: getDefaultPermissionsForDomain("admin")) as UserPermissionKey[];

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title="College admin notices"
			subtitle="Review platform and college notifications assigned to college administrators."
			domain="admin"
			roleLabel={session.user.roleLabel ?? dashboard.roleLabel}
			tenantSlug={collegeSlug}
			activeMenuKey="notices"
			permissions={permissions}
			stats={dashboard.stats}
			highlights={dashboard.highlights}
			activity={dashboard.activity}
			quickLinks={dashboard.quickLinks}
			reportPanel={dashboard.reportPanel}
			paymentReports={dashboard.paymentReports}
			tenantContext={dashboard.tenantContext}
			showOverviewContent={false}
			contentWidth="wide"
		>
			<NoticeCenterWorkspace
				title="College admin notices"
				subtitle="Track college-wide, platform, and administrator announcements from one responsive notice center."
			/>
		</RoleDashboardShell>
	);
}
