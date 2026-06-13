import { createStudentDashboardContent } from "@/features/dashboard/config/dashboardContent";
import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import StudentDashboardWorkspace from "@/features/dashboard/components/StudentDashboardWorkspace";
import { requirePaidStudentAccess } from "@/lib/auth/student-access";
import {
	getDefaultPermissionsForDomain,
	type UserPermissionKey,
} from "@/lib/rbac";
import { getStudentDashboardData } from "@/lib/services/student-dashboard.service";

export default async function CollegeStudentDashboardPage({
	params,
}: {
	params: Promise<{ collegeSlug: string }>;
}) {
	const { collegeSlug } = await params;
	const { session, application } = await requirePaidStudentAccess(collegeSlug);
	const dashboard = createStudentDashboardContent({ collegeSlug });
	const permissions = (session.user.permissions?.length
		? session.user.permissions
		: getDefaultPermissionsForDomain("student")) as UserPermissionKey[];
	const dashboardData = await getStudentDashboardData({
		collegeSlug,
		session,
		application,
	});

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title={dashboard.title}
			subtitle={dashboard.subtitle}
			domain="student"
			roleLabel={session.user.roleLabel ?? dashboard.roleLabel}
			tenantSlug={collegeSlug}
			permissions={permissions}
			stats={dashboard.stats}
			highlights={dashboard.highlights}
			activity={dashboard.activity}
			quickLinks={dashboard.quickLinks}
			tenantContext={dashboard.tenantContext}
			showOverviewContent={false}
		>
			<StudentDashboardWorkspace
				collegeSlug={collegeSlug}
				data={dashboardData}
			/>
		</RoleDashboardShell>
	);
}
