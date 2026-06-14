import { createCollegeAdminDashboardContent } from "@/features/dashboard/config/dashboardContent";
import RoleDashboardShell from "@/features/dashboard/components/RoleDashboardShell";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	getDefaultPermissionsForDomain,
	type UserPermissionKey,
} from "@/lib/rbac";
import { getCollegeAdminReports } from "@/lib/services/college-admin.service";
import { redirect } from "next/navigation";

type DashboardSearchParams = Promise<{
	month?: string | string[];
	days?: string | string[];
}>;

function firstParam(value?: string | string[]) {
	return Array.isArray(value) ? value[0] : value;
}

function dateKey(date: Date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
		date.getDate(),
	).padStart(2, "0")}`;
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

function daysRange(days: number) {
	const today = new Date();
	const fromDate = new Date(today);
	fromDate.setDate(today.getDate() - days + 1);

	return {
		from: dateKey(fromDate),
		to: dateKey(today),
	};
}

function dashboardHref(collegeSlug: string, params: { month?: string; days?: string }) {
	const query = new URLSearchParams();

	if (params.month) {
		query.set("month", params.month);
	}
	if (params.days) {
		query.set("days", params.days);
	}

	const queryString = query.toString();
	return `/college/${collegeSlug}/admin/dashboard${queryString ? `?${queryString}` : ""}`;
}

export default async function CollegeAdminDashboardPage({
	params,
	searchParams,
}: {
	params: Promise<{ collegeSlug: string }>;
	searchParams: DashboardSearchParams;
}) {
	const { collegeSlug } = await params;
	const session = await getCurrentAuthSession();

	if (!session) {
		redirect("/staff/signin");
	}

	if (!["admin", "staff"].includes(session.user.domain)) {
		redirect(session.destination.path);
	}

	if (session.user.collegeSlug !== collegeSlug) {
		redirect(session.destination.path);
	}

	const permissions = (session.user.permissions?.length
		? session.user.permissions
		: getDefaultPermissionsForDomain(session.user.domain)) as UserPermissionKey[];
	const query = await searchParams;
	const today = new Date();
	const currentMonth = monthKey(today);
	const previousMonth = monthKey(new Date(today.getFullYear(), today.getMonth() - 1, 1));
	const selectedMonth = firstParam(query.month);
	const safeMonth = /^\d{4}-\d{2}$/.test(selectedMonth ?? "")
		? selectedMonth
		: undefined;
	const selectedDays = Number(firstParam(query.days));
	const safeDays = [7, 30, 90].includes(selectedDays) ? selectedDays : 30;
	const range = safeMonth ? monthRange(safeMonth) : daysRange(safeDays);
	const report = await getCollegeAdminReports({ collegeSlug, ...range }).catch(() => null);
	const dashboard = createCollegeAdminDashboardContent(collegeSlug, report, {
		activeFilterSummary: safeMonth
			? monthLabel(safeMonth)
			: `Last ${safeDays} days`,
		filters: [
			{
				label: "Month",
				options: [
					{
						label: monthLabel(currentMonth),
						href: dashboardHref(collegeSlug, { month: currentMonth }),
						isActive: safeMonth === currentMonth,
					},
					{
						label: monthLabel(previousMonth),
						href: dashboardHref(collegeSlug, { month: previousMonth }),
						isActive: safeMonth === previousMonth,
					},
				],
			},
			{
				label: "Days",
				options: [7, 30, 90].map((days) => ({
					label: `${days} days`,
					href: dashboardHref(collegeSlug, { days: String(days) }),
					isActive: !safeMonth && safeDays === days,
				})),
			},
		],
	});

	return (
		<RoleDashboardShell
			badge={dashboard.badge}
			title={dashboard.title}
			subtitle="Manage one college's students, payments, staff, applications, and operating signals from an admin-level workspace."
			domain={session.user.domain}
			roleLabel={session.user.roleLabel ?? dashboard.roleLabel}
			tenantSlug={collegeSlug}
			permissions={permissions}
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
