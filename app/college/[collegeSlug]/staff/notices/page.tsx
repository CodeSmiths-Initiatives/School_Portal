import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import { createStaffDashboardContent } from "@/features/dashboard/config/dashboardContent";
import { NoticeCenterWorkspace } from "@/features/notifications";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	getDefaultPermissionsForDomain,
	type UserPermissionKey,
} from "@/lib/rbac";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Notices | Staff",
	description: "Review staff-facing in-app notifications.",
};

export default async function CollegeStaffNoticesPage({
	params,
}: {
	params: Promise<{ collegeSlug: string }>;
}) {
	const { collegeSlug } = await params;
	const session = await getCurrentAuthSession();

	if (!session) {
		redirect("/staff/signin");
	}

	if (session.user.domain !== "staff" || session.user.collegeSlug !== collegeSlug) {
		redirect(session.destination.path);
	}

	const dashboard = createStaffDashboardContent({ collegeSlug });
	const permissions = (session.user.permissions?.length
		? session.user.permissions
		: getDefaultPermissionsForDomain("staff")) as UserPermissionKey[];

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title="Staff notices"
			subtitle="Review college and platform notifications assigned to your staff role."
			domain="staff"
			roleLabel={session.user.roleLabel ?? dashboard.roleLabel}
			tenantSlug={collegeSlug}
			activeMenuKey="notices"
			permissions={permissions}
			stats={dashboard.stats}
			highlights={dashboard.highlights}
			activity={dashboard.activity}
			quickLinks={dashboard.quickLinks}
			tenantContext={dashboard.tenantContext}
			showOverviewContent={false}
			contentWidth="wide"
		>
			<NoticeCenterWorkspace
				title="Staff notices"
				subtitle="Track operational, academic, and college announcements from one responsive notice center."
			/>
		</RoleDashboardShell>
	);
}
