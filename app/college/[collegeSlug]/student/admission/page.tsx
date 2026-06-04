import { redirect } from "next/navigation";
import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import {
	createStudentDashboardContent,
	formatCollegeName,
} from "@/features/dashboard/config/dashboardContent";
import { StudentAdmissionForm } from "@/features/student-admission";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	getDefaultPermissionsForDomain,
	type UserPermissionKey,
} from "@/lib/rbac";

export default async function CollegeStudentAdmissionPage({
	params,
}: {
	params: Promise<{ collegeSlug: string }>;
}) {
	const { collegeSlug } = await params;
	const session = await getCurrentAuthSession();

	if (!session) {
		redirect("/signin");
	}

	if (session.user.domain !== "student") {
		redirect(session.destination.path);
	}

	const dashboard = createStudentDashboardContent({ collegeSlug });
	const permissions = (session.user.permissions?.length
		? session.user.permissions
		: getDefaultPermissionsForDomain("student")) as UserPermissionKey[];
	const collegeName =
		session.user.collegeName ?? formatCollegeName(collegeSlug);

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title={dashboard.title}
			subtitle={dashboard.subtitle}
			domain="student"
			roleLabel={session.user.roleLabel ?? dashboard.roleLabel}
			tenantSlug={collegeSlug}
			activeMenuKey="admissions"
			permissions={permissions}
			stats={dashboard.stats}
			highlights={dashboard.highlights}
			activity={dashboard.activity}
			quickLinks={dashboard.quickLinks}
			tenantContext={dashboard.tenantContext}
			showOverviewContent={false}
		>
			<StudentAdmissionForm
				studentName={session.user.name}
				email={session.user.email}
				collegeName={collegeName}
			/>
		</RoleDashboardShell>
	);
}
