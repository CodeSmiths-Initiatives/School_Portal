import { createSuperadminDashboardContent } from "@/features/dashboard/config/dashboardContent";
import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import {
	getCurrentAuthSession,
	getCurrentRoleLabel,
} from "@/lib/auth/server-session";
import { getProvisionedColleges } from "@/lib/services/superadmin-college.service";
import { getSuperadminReportData } from "@/lib/services/superadmin-report.service";
import { redirect } from "next/navigation";

type DashboardSearchParams = Promise<{
	month?: string | string[];
	college?: string | string[];
}>;

function firstParam(value?: string | string[]) {
	return Array.isArray(value) ? value[0] : value;
}

function monthKey(date: Date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string) {
	const [year, monthIndex] = month.split("-").map(Number);

	return new Intl.DateTimeFormat("en-NG", {
		month: "short",
		year: "numeric",
	}).format(new Date(year, monthIndex - 1, 1));
}

function monthRange(month?: string) {
	if (!month || !/^\d{4}-\d{2}$/.test(month)) {
		return {};
	}

	const [year, monthIndex] = month.split("-").map(Number);
	const lastDay = new Date(year, monthIndex, 0).getDate();

	return {
		from: `${month}-01`,
		to: `${month}-${String(lastDay).padStart(2, "0")}`,
	};
}

function dashboardHref(params: { month?: string; college?: string }) {
	const query = new URLSearchParams();

	if (params.month && params.month !== "all") {
		query.set("month", params.month);
	}
	if (params.college && params.college !== "all") {
		query.set("college", params.college);
	}

	const queryString = query.toString();
	return `/superadmin/dashboard${queryString ? `?${queryString}` : ""}`;
}

export default async function SuperadminDashboardPage({
	searchParams,
}: {
	searchParams: DashboardSearchParams;
}) {
	const session = await getCurrentAuthSession();

	if (session?.user.domain !== "superadmin") {
		redirect("/staff/signin");
	}

	const query = await searchParams;
	const today = new Date();
	const currentMonth = monthKey(today);
	const previousMonth = monthKey(new Date(today.getFullYear(), today.getMonth() - 1, 1));
	const selectedMonth = firstParam(query.month);
	const safeMonth =
		selectedMonth === "all" || /^\d{4}-\d{2}$/.test(selectedMonth ?? "")
			? selectedMonth
			: undefined;
	const { from, to } = monthRange(safeMonth);
	const colleges = await getProvisionedColleges().catch(() => []);
	const selectedCollege = firstParam(query.college);
	const safeCollege = selectedCollege && colleges.some((college) => college.slug === selectedCollege)
		? selectedCollege
		: "all";
	const reportData = await getSuperadminReportData({
		collegeSlug: safeCollege,
		from,
		to,
	}).catch(() => null);
	const monthSummary = safeMonth && safeMonth !== "all" ? monthLabel(safeMonth) : "All months";
	const collegeSummary =
		safeCollege !== "all"
			? (colleges.find((college) => college.slug === safeCollege)?.code ??
				colleges.find((college) => college.slug === safeCollege)?.name ??
				"Selected college")
			: "All colleges";
	const dashboard = createSuperadminDashboardContent({
		colleges,
		reportData,
		activeFilterSummary: `${monthSummary} | ${collegeSummary}`,
		filters: [
			{
				label: "Month",
				options: [
					{
						label: "All",
						href: dashboardHref({ month: "all", college: safeCollege }),
						isActive: !safeMonth || safeMonth === "all",
					},
					{
						label: monthLabel(currentMonth),
						href: dashboardHref({ month: currentMonth, college: safeCollege }),
						isActive: safeMonth === currentMonth,
					},
					{
						label: monthLabel(previousMonth),
						href: dashboardHref({ month: previousMonth, college: safeCollege }),
						isActive: safeMonth === previousMonth,
					},
				],
			},
			{
				label: "College",
				options: [
					{
						label: "All",
						href: dashboardHref({ month: safeMonth, college: "all" }),
						isActive: safeCollege === "all",
					},
					...colleges.slice(0, 5).map((college) => ({
						label: college.code || college.name,
						href: dashboardHref({ month: safeMonth, college: college.slug }),
						isActive: safeCollege === college.slug,
					})),
				],
			},
		],
	});
	const roleLabel = await getCurrentRoleLabel(dashboard.roleLabel);

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title={dashboard.title}
			subtitle={dashboard.subtitle}
			domain="superadmin"
			roleLabel={roleLabel}
			stats={dashboard.stats}
			highlights={dashboard.highlights}
			activity={dashboard.activity}
			quickLinks={dashboard.quickLinks}
			reportPanel={dashboard.reportPanel}
			paymentReports={dashboard.paymentReports}
			tenantContext={dashboard.tenantContext}
		/>
	);
}
