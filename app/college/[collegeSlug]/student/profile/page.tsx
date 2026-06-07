import { redirect } from "next/navigation";
import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import {
	createStudentDashboardContent,
	formatCollegeName,
} from "@/features/dashboard/config/dashboardContent";
import { StudentProfileWorkspace } from "@/features/student-profile";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	getDefaultPermissionsForDomain,
	type UserPermissionKey,
} from "@/lib/rbac";
import { getStudentAdmissionProfile } from "@/lib/services/student-admission-profile.service";

export default async function CollegeStudentProfilePage({
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
	const admissionProfile = await getStudentAdmissionProfile(collegeSlug).catch(
		() => ({ application: null }),
	);

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title={dashboard.title}
			subtitle={dashboard.subtitle}
			domain="student"
			roleLabel={session.user.roleLabel ?? dashboard.roleLabel}
			tenantSlug={collegeSlug}
			activeMenuKey="profile"
			permissions={permissions}
			stats={dashboard.stats}
			highlights={dashboard.highlights}
			activity={dashboard.activity}
			quickLinks={dashboard.quickLinks}
			tenantContext={dashboard.tenantContext}
			showOverviewContent={false}
		>
			<StudentProfileWorkspace
				studentName={session.user.name}
				email={session.user.email}
				collegeName={collegeName}
				collegeSlug={collegeSlug}
				application={admissionProfile.application}
			/>
		</RoleDashboardShell>
	);
}
