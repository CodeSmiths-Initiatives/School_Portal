import { createCollegeAdminDashboardContent } from "@/features/dashboard/config/dashboardContent";
import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	getDefaultPermissionsForDomain,
	type UserPermissionKey,
} from "@/lib/rbac";
import { getCollegeAdminReports } from "@/lib/services/college-admin.service";
import { redirect } from "next/navigation";

export default async function CollegeAdminDashboardPage({
	params,
}: {
	params: Promise<{ collegeSlug: string }>;
}) {
	const { collegeSlug } = await params;
	const session = await getCurrentAuthSession();

	if (!session) {
		redirect("/staff/signin");
	}

	if (!["admin", "staff"].includes(session.user.domain)) {
		redirect(session.destination.path);
	}

	if (session.user.collegeSlug !== collegeSlug) {
		redirect(session.destination.path);
	}

	const permissions = (session.user.permissions?.length
		? session.user.permissions
		: getDefaultPermissionsForDomain(session.user.domain)) as UserPermissionKey[];
	const report = await getCollegeAdminReports({ collegeSlug }).catch(() => null);
	const dashboard = createCollegeAdminDashboardContent(collegeSlug, report);

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title={dashboard.title}
			subtitle="Manage one college's students, payments, staff, applications, and operating signals from an admin-level workspace."
			domain={session.user.domain}
			roleLabel={session.user.roleLabel ?? dashboard.roleLabel}
			tenantSlug={collegeSlug}
			permissions={permissions}
			stats={dashboard.stats}
			highlights={dashboard.highlights}
			activity={dashboard.activity}
			quickLinks={dashboard.quickLinks}
			reportPanel={dashboard.reportPanel}
			paymentReports={dashboard.paymentReports}
			tenantContext={dashboard.tenantContext}
		/>
	);
}
