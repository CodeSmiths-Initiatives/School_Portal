import { redirect } from "next/navigation";
import { CollegeAdminReportsWorkspace } from "@/features/college-admin";
import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import {
	createCollegeAdminDashboardContent,
	formatCollegeName,
} from "@/features/dashboard/config/dashboardContent";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	getDefaultPermissionsForDomain,
	hasPermissions,
	type UserPermissionKey,
} from "@/lib/rbac";
import { getCollegeAdminReports } from "@/lib/services/college-admin.service";

export const metadata = {
	title: "Reports | College Admin",
	description: "College-scoped admission, payment, student, and staff reports.",
};

export default async function CollegeAdminReportsPage({
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

	if (!hasPermissions(permissions, ["reports.view"], { mode: "any" })) {
		redirect(session.destination.path);
	}

	const dashboard = createCollegeAdminDashboardContent(collegeSlug);
	const collegeName = session.user.collegeName ?? formatCollegeName(collegeSlug);
	const report = await getCollegeAdminReports({ collegeSlug });

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title={dashboard.title}
			subtitle="Review college-only admissions, payments, students, staff, and operational trends."
			domain={session.user.domain}
			roleLabel={session.user.roleLabel ?? dashboard.roleLabel}
			tenantSlug={collegeSlug}
			activeMenuKey="reports"
			permissions={permissions}
			stats={dashboard.stats}
			highlights={dashboard.highlights}
			activity={dashboard.activity}
			quickLinks={dashboard.quickLinks}
			reportPanel={dashboard.reportPanel}
			tenantContext={dashboard.tenantContext}
			showOverviewContent={false}
			contentWidth="wide"
		>
			<CollegeAdminReportsWorkspace
				initialReport={report}
				collegeSlug={collegeSlug}
				collegeName={collegeName}
			/>
		</RoleDashboardShell>
	);
}
