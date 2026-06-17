import { redirect } from "next/navigation";
import { CollegeAdminSettingsWorkspace } from "@/features/college-admin";
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

export const metadata = {
	title: "Settings | College Admin",
	description: "Manage college-scoped notices and in-app notifications.",
};

export default async function CollegeAdminSettingsPage({
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

	if (!hasPermissions(permissions, ["settings.view"], { mode: "any" })) {
		redirect(session.destination.path);
	}

	const dashboard = createCollegeAdminDashboardContent(collegeSlug);
	const collegeName = session.user.collegeName ?? formatCollegeName(collegeSlug);
	const actorName =
		session.user.name ?? session.user.username ?? session.user.email ?? "College Admin";

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title={dashboard.title}
			subtitle="Manage college-scoped in-app notices, notification drafts, and recent admin communication."
			domain={session.user.domain}
			roleLabel={session.user.roleLabel ?? dashboard.roleLabel}
			tenantSlug={collegeSlug}
			activeMenuKey="settings"
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
			<CollegeAdminSettingsWorkspace
				collegeName={collegeName}
				collegeSlug={collegeSlug}
				actorName={actorName}
				canCreateNotice={hasPermissions(permissions, ["notices.create"], {
					mode: "any",
				})}
				canUpdateSettings={hasPermissions(
					permissions,
					["settings.update", "notices.update", "notices.publish"],
					{ mode: "any" },
				)}
			/>
		</RoleDashboardShell>
	);
}
