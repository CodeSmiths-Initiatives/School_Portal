import { redirect } from "next/navigation";
import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import { createCollegeAdminDashboardContent } from "@/features/dashboard/config/dashboardContent";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import { getDefaultPermissionsForDomain, type UserPermissionKey } from "@/lib/rbac";
import ResultsView from "@/features/results/components/ResultsView";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ collegeSlug: string }>;
}) {
  const { collegeSlug } = await params;
  const session = await getCurrentAuthSession();

  if (!session) redirect("/staff/signin");
  if (!["admin", "staff"].includes(session.user.domain)) redirect(session.destination.path);
  if (session.user.collegeSlug !== collegeSlug) redirect(session.destination.path);

  const permissions = (session.user.permissions?.length
    ? session.user.permissions
    : getDefaultPermissionsForDomain(session.user.domain)) as UserPermissionKey[];

  const dashboard = createCollegeAdminDashboardContent(collegeSlug);

  return (
    <RoleDashboardShell
      badge={dashboard.badge}
      title={dashboard.title}
      subtitle="Manage and publish admission results for this college."
      domain={session.user.domain}
      roleLabel={session.user.roleLabel ?? dashboard.roleLabel}
      tenantSlug={collegeSlug}
      activeMenuKey="results"
      permissions={permissions}
      stats={dashboard.stats}
      highlights={dashboard.highlights}
      activity={dashboard.activity}
      quickLinks={dashboard.quickLinks}
      tenantContext={dashboard.tenantContext}
      showOverviewContent={false}
      contentWidth="wide"
    >
      <ResultsView collegeSlug={collegeSlug} />
    </RoleDashboardShell>
  );
}