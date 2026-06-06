import { redirect } from "next/navigation";
import { CollegeStudentsWorkspace } from "@/features/college-students";
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
import { listAdmissionApplicationRecords } from "@/lib/services/admission-application.service";

export const metadata = {
	title: "Students | College Admin",
	description: "Review admission-backed student records for the selected college.",
};

export default async function CollegeAdminStudentsPage({
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

	if (
		session.user.collegeSlug &&
		session.user.collegeSlug !== collegeSlug
	) {
		redirect(session.destination.path);
	}

	const permissions = (session.user.permissions?.length
		? session.user.permissions
		: getDefaultPermissionsForDomain(session.user.domain)) as UserPermissionKey[];

	if (!hasPermissions(permissions, ["students.view"], { mode: "any" })) {
		redirect(session.destination.path);
	}

	const dashboard = createCollegeAdminDashboardContent(collegeSlug);
	const collegeName =
		session.user.collegeName ?? formatCollegeName(collegeSlug);
	const applications = await listAdmissionApplicationRecords({
		collegeSlug,
		limit: 500,
	});

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title={dashboard.title}
			subtitle="Review admission-backed student records, filter application progress, and export or print student information."
			domain={session.user.domain}
			roleLabel={session.user.roleLabel ?? dashboard.roleLabel}
			tenantSlug={collegeSlug}
			activeMenuKey="students"
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
			<CollegeStudentsWorkspace
				applications={applications}
				collegeName={collegeName}
				collegeSlug={collegeSlug}
			/>
		</RoleDashboardShell>
	);
}
