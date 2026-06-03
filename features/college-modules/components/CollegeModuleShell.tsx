import { redirect } from "next/navigation";
import {
	createCollegeAdminDashboardContent,
	createStaffDashboardContent,
	createStudentDashboardContent,
	formatCollegeName,
} from "@/features/dashboard/config/dashboardContent";
import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import {
	getCollegeModuleConfig,
	type CollegeModuleKey,
} from "@/features/college-modules/config/collegeModuleConfig";
import CollegeModuleWorkspace from "./CollegeModuleWorkspace";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import type { DashboardDomain } from "@/lib/auth";
import {
	getDefaultPermissionsForDomain,
	type UserPermissionKey,
} from "@/lib/rbac";

type CollegeModuleShellProps = {
	collegeSlug: string;
	moduleKey: CollegeModuleKey;
};

function getDashboardContent(domain: DashboardDomain, collegeSlug: string) {
	if (domain === "student") {
		return createStudentDashboardContent({ collegeSlug });
	}

	if (domain === "admin") {
		return createCollegeAdminDashboardContent(collegeSlug);
	}

	return createStaffDashboardContent({ collegeSlug });
}

export default async function CollegeModuleShell({
	collegeSlug,
	moduleKey,
}: CollegeModuleShellProps) {
	const session = await getCurrentAuthSession();

	if (!session) {
		redirect("/signin");
	}

	const module = getCollegeModuleConfig(moduleKey);
	const domain =
		session.user.domain === "superadmin" ? "admin" : session.user.domain;
	const dashboard = getDashboardContent(domain, collegeSlug);
	const permissions = (session.user.permissions?.length
		? session.user.permissions
		: getDefaultPermissionsForDomain(domain)) as UserPermissionKey[];

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title={dashboard.title}
			subtitle={dashboard.subtitle}
			domain={domain}
			roleLabel={session.user.roleLabel ?? dashboard.roleLabel}
			tenantSlug={collegeSlug}
			activeMenuKey={module.activeMenuKey}
			permissions={permissions}
			stats={dashboard.stats}
			highlights={dashboard.highlights}
			activity={dashboard.activity}
			quickLinks={dashboard.quickLinks}
			reportPanel={dashboard.reportPanel}
			tenantContext={dashboard.tenantContext}
			showOverviewContent={false}
		>
			<CollegeModuleWorkspace
				module={module}
				permissions={permissions}
				collegeName={session.user.collegeName ?? formatCollegeName(collegeSlug)}
			/>
		</RoleDashboardShell>
	);
}
