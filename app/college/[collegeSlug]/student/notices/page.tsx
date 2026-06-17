import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import { createStudentDashboardContent } from "@/features/dashboard/config/dashboardContent";
import { NoticeCenterWorkspace } from "@/features/notifications";
import { requirePaidStudentAccess } from "@/lib/auth/student-access";
import {
	getDefaultPermissionsForDomain,
	type UserPermissionKey,
} from "@/lib/rbac";

export const metadata = {
	title: "Notices | Student",
	description: "Review student-facing in-app notifications.",
};

export default async function CollegeStudentNoticesPage({
	params,
}: {
	params: Promise<{ collegeSlug: string }>;
}) {
	const { collegeSlug } = await params;
	const { session } = await requirePaidStudentAccess(collegeSlug);
	const dashboard = createStudentDashboardContent({ collegeSlug });
	const permissions = (session.user.permissions?.length
		? session.user.permissions
		: getDefaultPermissionsForDomain("student")) as UserPermissionKey[];

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title="Student notices"
			subtitle="Review college and platform notifications assigned to your student account."
			domain="student"
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
				title="Student notices"
				subtitle="Track admission, schedule, deadline, and college announcements from one responsive notice center."
			/>
		</RoleDashboardShell>
	);
}
