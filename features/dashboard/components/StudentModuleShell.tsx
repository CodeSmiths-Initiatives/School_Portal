import RoleDashboardShell from "./RoleDashboardShell";
import StudentModulePlaceholder from "./StudentModulePlaceholder";
import { createStudentDashboardContent } from "@/features/dashboard/config/dashboardContent";
import type { LucideIcon } from "lucide-react";

type StudentModuleShellProps = {
	activeMenuKey: "profile";
	badge: string;
	title: string;
	description: string;
	icon: LucideIcon;
	items: string[];
	collegeSlug?: string;
};

export default function StudentModuleShell({
	activeMenuKey,
	badge,
	title,
	description,
	icon,
	items,
	collegeSlug,
}: StudentModuleShellProps) {
	const dashboard = createStudentDashboardContent({ collegeSlug });

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title={dashboard.title}
			subtitle={dashboard.subtitle}
			domain="student"
			roleLabel={dashboard.roleLabel}
			tenantSlug={collegeSlug}
			activeMenuKey={activeMenuKey}
			stats={dashboard.stats}
			highlights={dashboard.highlights}
			activity={dashboard.activity}
			quickLinks={dashboard.quickLinks}
			tenantContext={dashboard.tenantContext}
			showOverviewContent={false}
		>
			<StudentModulePlaceholder
				badge={badge}
				title={title}
				description={description}
				icon={icon}
				items={items}
			/>
		</RoleDashboardShell>
	);
}
