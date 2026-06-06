import { redirect } from "next/navigation";
import { CollegeAdminRolesWorkspace } from "@/features/college-admin";
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
import { getCollegeAdminRoles } from "@/lib/services/college-admin.service";

export const metadata = {
	title: "Roles | College Admin",
	description: "Create and manage college-scoped staff roles and permissions.",
};

export default async function CollegeAdminRolesPage({
	params,
}: {
	params: Promise<{ collegeSlug: string }>;
}) {
	const { collegeSlug } = await params;
	const session = await getCurrentAuthSession();

	if (!session) {
		redirect("/staff/signin");
	}

	if (session.user.domain !== "admin") {
		redirect(session.destination.path);
	}

	if (session.user.collegeSlug !== collegeSlug) {
		redirect(session.destination.path);
	}

	const permissions = (session.user.permissions?.length
		? session.user.permissions
		: getDefaultPermissionsForDomain(session.user.domain)) as UserPermissionKey[];

	if (!hasPermissions(permissions, ["roles.view"], { mode: "any" })) {
		redirect(session.destination.path);
	}

	const dashboard = createCollegeAdminDashboardContent(collegeSlug);
	const collegeName = session.user.collegeName ?? formatCollegeName(collegeSlug);
	const payload = await getCollegeAdminRoles(collegeSlug);

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title={dashboard.title}
			subtitle="Create college-specific staff roles and assign menu/action permissions for this tenant only."
			domain={session.user.domain}
			roleLabel={session.user.roleLabel ?? dashboard.roleLabel}
			tenantSlug={collegeSlug}
			activeMenuKey="roles"
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
			<CollegeAdminRolesWorkspace
				collegeSlug={collegeSlug}
				collegeName={collegeName}
				initialRoles={payload.roles}
				permissions={payload.permissions}
				canCreate={hasPermissions(permissions, ["roles.create"], { mode: "any" })}
				canUpdate={hasPermissions(
					permissions,
					["roles.update", "roles.assign_permissions"],
					{ mode: "any" },
				)}
			/>
		</RoleDashboardShell>
	);
}
