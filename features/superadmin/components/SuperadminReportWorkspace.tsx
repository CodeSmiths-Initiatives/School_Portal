"use client";

import {
	BarChart3,
	CalendarDays,
	CircleDollarSign,
	Download,
	Filter,
	GraduationCap,
	PieChart,
	RefreshCcw,
	TrendingUp,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ProvisionedCollege } from "@/lib/services/superadmin-college.service";
import type { SuperadminReportData } from "@/lib/services/superadmin-report.service";
import { toast } from "@/lib/toast";

type ReportFocus = "all" | "admissions" | "payments" | "students";

type CollegeReport = {
	collegeSlug: string;
	collegeCode: string;
	collegeName: string;
	collegeStatus?: string;
	onboardedStudents: number;
	staffAccounts?: number;
	adminAccounts?: number;
	admissionDone: number;
	admissionDraft: number;
	admissionPending: number;
	paymentPaid: number;
	paymentUnpaid: number;
	revenue: number;
	trend: number[];
};

type SuperadminReportWorkspaceProps = {
	colleges: ProvisionedCollege[];
	reportData?: SuperadminReportData | null;
};

const fallbackColleges: ProvisionedCollege[] = [
	{ id: "kas", name: "Kwara Applied Sciences", slug: "kwara-applied-sciences", code: "KAS", status: "active" },
	{ id: "kbh", name: "Kwara Business and Health", slug: "kwara-business-health", code: "KBH", status: "active" },
	{ id: "kce", name: "Kwara College of Education", slug: "kwara-college-education", code: "KCE", status: "active" },
	{ id: "kpi", name: "Kwara Polytechnic Institute", slug: "kwara-polytechnic-institute", code: "KPI", status: "active" },
];

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const DEFAULT_FROM_DATE = "2026-05-17";
const DEFAULT_TO_DATE = "2026-06-16";

function dateOnlyFromIso(value: string | undefined, fallback: string) {
	if (!value) {
		return fallback;
	}

	const timestamp = Date.parse(value);

	if (Number.isNaN(timestamp)) {
		return fallback;
	}

	return new Date(timestamp).toISOString().slice(0, 10);
}

function daysBeforeIso(value: string | undefined, days: number, fallback: string) {
	if (!value) {
		return fallback;
	}

	const timestamp = Date.parse(value);

	if (Number.isNaN(timestamp)) {
		return fallback;
	}

	const date = new Date(timestamp);
	date.setUTCDate(date.getUTCDate() - days);
	return date.toISOString().slice(0, 10);
}

function formatCurrency(value: number) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		maximumFractionDigits: 0,
	}).format(value);
}

function formatNumber(value: number) {
	return new Intl.NumberFormat("en-NG").format(value);
}

function createReportRows(colleges: ProvisionedCollege[]): CollegeReport[] {
	const source = colleges.length > 0 ? colleges : fallbackColleges;

	return source.map((college, index) => {
		const base = 72 + index * 17;
		const admissionDone = base + 120 + index * 9;
		const admissionDraft = 24 + index * 8;
		const admissionPending = 39 + index * 11;
		const paymentPaid = admissionDone - (18 + index * 4);
		const paymentUnpaid = admissionDraft + admissionPending + 10 + index * 3;

		return {
			collegeSlug: college.slug,
			collegeCode: college.code,
			collegeName: college.name,
			onboardedStudents: 780 + index * 214,
			admissionDone,
			admissionDraft,
			admissionPending,
			paymentPaid,
			paymentUnpaid,
			revenue: paymentPaid * 16500,
			trend: [
				base - 18,
				base + 4,
				base + 16,
				base + 11,
				base + 29,
				base + 42,
			],
		};
	});
}

function sumReports(reports: CollegeReport[]): CollegeReport {
	return reports.reduce<CollegeReport>(
		(total, report) => ({
			collegeSlug: "all",
			collegeCode: "ALL",
			collegeName: "All Colleges",
			onboardedStudents: total.onboardedStudents + report.onboardedStudents,
			admissionDone: total.admissionDone + report.admissionDone,
			admissionDraft: total.admissionDraft + report.admissionDraft,
			admissionPending: total.admissionPending + report.admissionPending,
			paymentPaid: total.paymentPaid + report.paymentPaid,
			paymentUnpaid: total.paymentUnpaid + report.paymentUnpaid,
			revenue: total.revenue + report.revenue,
			trend: total.trend.map((value, index) => value + report.trend[index]),
		}),
		{
			collegeSlug: "all",
			collegeCode: "ALL",
			collegeName: "All Colleges",
			onboardedStudents: 0,
			admissionDone: 0,
			admissionDraft: 0,
			admissionPending: 0,
			paymentPaid: 0,
			paymentUnpaid: 0,
			revenue: 0,
			trend: [0, 0, 0, 0, 0, 0],
		},
	);
}

function admissionTotal(report: CollegeReport) {
	return report.admissionDone + report.admissionDraft + report.admissionPending;
}

function paymentTotal(report: CollegeReport) {
	return report.paymentPaid + report.paymentUnpaid;
}

function percent(value: number, total: number) {
	return total > 0 ? Math.round((value / total) * 100) : 0;
}

function toCsvValue(value: string) {
	return `"${value.replace(/"/g, '""')}"`;
}

function LineChart({ values }: { values: number[] }) {
	const max = Math.max(...values, 1);
	const points = values.map((value, index) => {
		const x = values.length === 1 ? 150 : (index / (values.length - 1)) * 300;
		const y = 140 - (value / max) * 105;
		return `${x},${y}`;
	});

	return (
		<div className="rounded-3xl border border-[#dbe5f1] bg-[#fbfdff] p-4">
			<div className="relative h-56 overflow-hidden rounded-2xl border border-[#e2eaf4] bg-white">
				<div className="absolute inset-x-0 top-1/4 border-t border-dashed border-[#dbe5f1]" />
				<div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[#dbe5f1]" />
				<div className="absolute inset-x-0 top-3/4 border-t border-dashed border-[#dbe5f1]" />
				<svg
					viewBox="0 0 300 140"
					className="absolute inset-0 h-full w-full"
					role="img"
					aria-label="Monthly onboarding line chart"
					preserveAspectRatio="none"
				>
					<defs>
						<linearGradient id="superadmin-report-line-fill" x1="0" x2="0" y1="0" y2="1">
							<stop offset="0%" stopColor="#2E86C1" stopOpacity="0.24" />
							<stop offset="100%" stopColor="#2E86C1" stopOpacity="0.03" />
						</linearGradient>
					</defs>
					<polygon points={`0,140 ${points.join(" ")} 300,140`} fill="url(#superadmin-report-line-fill)" />
					<polyline
						points={points.join(" ")}
						fill="none"
						stroke="#0D2B55"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="4"
					/>
					{points.map((point, index) => {
						const [x, y] = point.split(",");
						return (
							<circle
								key={`${point}-${index}`}
								cx={x}
								cy={y}
								r="5"
								fill="#B7770D"
								stroke="white"
								strokeWidth="3"
							/>
						);
					})}
				</svg>
			</div>
			<div className="mt-3 grid grid-cols-6 gap-2 text-center">
				{monthLabels.map((month, index) => (
					<div key={month}>
						<p className="text-sm font-black text-[#0D2B55]">{formatNumber(values[index])}</p>
						<p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
							{month}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}

export function SuperadminReportWorkspace({
	colleges,
	reportData,
}: SuperadminReportWorkspaceProps) {
	const defaultFromDate = daysBeforeIso(reportData?.generatedAt, 30, DEFAULT_FROM_DATE);
	const defaultToDate = dateOnlyFromIso(reportData?.generatedAt, DEFAULT_TO_DATE);
	const [collegeSlug, setCollegeSlug] = useState("all");
	const [focus, setFocus] = useState<ReportFocus>("all");
	const [fromDate, setFromDate] = useState(defaultFromDate);
	const [toDate, setToDate] = useState(defaultToDate);

	const collegeOptions = useMemo(
		() => (colleges.length > 0 ? colleges : fallbackColleges),
		[colleges],
	);
	const reportRows = useMemo(
		() =>
			reportData?.rows.length
				? reportData.rows.map((row) => ({
						...row,
						trend:
							row.trend.length === 6
								? row.trend
								: [...row.trend, 0, 0, 0, 0, 0, 0].slice(0, 6),
					}))
				: createReportRows(collegeOptions),
		[collegeOptions, reportData],
	);
	const visibleRows = useMemo(
		() =>
			collegeSlug === "all"
				? reportRows
				: reportRows.filter((row) => row.collegeSlug === collegeSlug),
		[collegeSlug, reportRows],
	);
	const selectedReport = useMemo(() => sumReports(visibleRows), [visibleRows]);
	const admissions = admissionTotal(selectedReport);
	const payments = paymentTotal(selectedReport);
	const paidPercent = percent(selectedReport.paymentPaid, payments);
	const admissionDonePercent = percent(selectedReport.admissionDone, admissions);
	const draftPercent = percent(selectedReport.admissionDraft, admissions);
	const pendingPercent = percent(selectedReport.admissionPending, admissions);
	const maxRevenue = Math.max(...reportRows.map((row) => row.revenue), 1);

	function resetFilters() {
		setCollegeSlug("all");
		setFocus("all");
		setFromDate(defaultFromDate);
		setToDate(defaultToDate);
	}

	function exportReport() {
		const headers = [
			"College",
			"Code",
			"Onboarded Students",
			"Admission Done",
			"Admission Draft",
			"Admission Pending",
			"Payment Paid",
			"Payment Unpaid",
			"Revenue",
		];
		const rows = visibleRows.map((row) => [
			row.collegeName,
			row.collegeCode,
			String(row.onboardedStudents),
			String(row.admissionDone),
			String(row.admissionDraft),
			String(row.admissionPending),
			String(row.paymentPaid),
			String(row.paymentUnpaid),
			String(row.revenue),
		]);
		const csv = [headers, ...rows]
			.map((row) => row.map(toCsvValue).join(","))
			.join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `superadmin-reports-${collegeSlug}-${fromDate}-to-${toDate}.csv`;
		link.click();
		URL.revokeObjectURL(url);

		toast.success({
			title: "Report exported",
			description: `${visibleRows.length} college report row${
				visibleRows.length === 1 ? "" : "s"
			} exported.`,
		});
	}

	return (
		<div className="space-y-6">
			<section className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							College-Wise Reports
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							Admissions, payments, and student analytics
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#556987]">
							Filter by college and date range first, then review graphical
							representations for onboarding, admission movement, payment
							status, revenue, and pending work.
						</p>
					</div>
					<button
						type="button"
						onClick={exportReport}
						className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_14px_26px_rgba(13,43,85,0.2)] transition hover:bg-[#123a73]"
					>
						<Download className="size-4" />
						Export Report
					</button>
				</div>

				<div className="mt-6 grid gap-3 rounded-3xl border border-[#dbe5f1] bg-[#f8fbff] p-4 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
					<label className="block">
						<span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
							<Filter className="size-3.5" />
							College
						</span>
						<select
							value={collegeSlug}
							onChange={(event) => setCollegeSlug(event.target.value)}
							className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-white px-4 text-sm font-bold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						>
							<option value="all">All colleges</option>
							{collegeOptions.map((college) => (
								<option key={college.slug} value={college.slug}>
									{college.name}
								</option>
							))}
						</select>
					</label>
					<label className="block">
						<span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
							<BarChart3 className="size-3.5" />
							Focus
						</span>
						<select
							value={focus}
							onChange={(event) => setFocus(event.target.value as ReportFocus)}
							className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-white px-4 text-sm font-bold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						>
							<option value="all">All metrics</option>
							<option value="admissions">Admissions</option>
							<option value="payments">Payments</option>
							<option value="students">Students</option>
						</select>
					</label>
					<label className="block">
						<span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
							<CalendarDays className="size-3.5" />
							From
						</span>
						<input
							type="date"
							value={fromDate}
							onChange={(event) => setFromDate(event.target.value)}
							className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-white px-4 text-sm font-bold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>
					<label className="block">
						<span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
							<CalendarDays className="size-3.5" />
							To
						</span>
						<input
							type="date"
							value={toDate}
							onChange={(event) => setToDate(event.target.value)}
							className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-white px-4 text-sm font-bold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>
					<button
						type="button"
						onClick={resetFilters}
						className="mt-5 flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#cbd9ec] bg-white px-4 text-sm font-black text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D] lg:mt-auto"
					>
						<RefreshCcw className="size-4" />
						Reset
					</button>
				</div>
			</section>

			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{[
					{
						label: "Onboarded Students",
						value: formatNumber(selectedReport.onboardedStudents),
						note: `${visibleRows.length} college scope`,
						Icon: Users,
					},
					{
						label: "Admission Done",
						value: formatNumber(selectedReport.admissionDone),
						note: `${admissionDonePercent}% of admission records`,
						Icon: GraduationCap,
					},
					{
						label: "Payment Paid",
						value: formatNumber(selectedReport.paymentPaid),
						note: `${paidPercent}% payment completion`,
						Icon: CircleDollarSign,
					},
					{
						label: "Revenue",
						value: formatCurrency(selectedReport.revenue),
						note: "Application and student payments",
						Icon: TrendingUp,
					},
				].map((stat) => (
					<div
						key={stat.label}
						className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-sm"
					>
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
									{stat.label}
								</p>
								<p className="mt-3 text-2xl font-black text-[#0D2B55]">
									{stat.value}
								</p>
							</div>
							<div className="flex size-12 items-center justify-center rounded-full bg-[#eef4fb] text-[#2E86C1]">
								<stat.Icon className="size-5" />
							</div>
						</div>
						<p className="mt-3 text-sm font-semibold text-[#60728f]">
							{stat.note}
						</p>
					</div>
				))}
			</section>

			<section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_26rem]">
				<div className="space-y-5">
					{focus === "all" || focus === "students" ? (
						<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-sm sm:p-6">
							<div className="flex items-center justify-between gap-4">
								<div>
									<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
										Line Chart
									</p>
									<h3 className="mt-2 text-xl font-black text-[#06183A]">
										Student onboarding trend
									</h3>
								</div>
								<TrendingUp className="size-6 text-[#2E86C1]" />
							</div>
							<div className="mt-5">
								<LineChart values={selectedReport.trend} />
							</div>
						</div>
					) : null}

					{focus === "all" || focus === "admissions" ? (
						<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-sm sm:p-6">
							<div className="flex flex-wrap items-start justify-between gap-4">
								<div>
									<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
										Bar Chart
									</p>
									<h3 className="mt-2 text-xl font-black text-[#06183A]">
										Admission status breakdown
									</h3>
								</div>
								<p className="rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-4 py-2 text-xs font-black text-[#0D2B55]">
									{formatNumber(admissions)} total records
								</p>
							</div>
							<div className="mt-6 space-y-5">
								{[
									{ label: "Admission Done", value: selectedReport.admissionDone, ratio: admissionDonePercent, color: "#0D2B55" },
									{ label: "Admission Draft", value: selectedReport.admissionDraft, ratio: draftPercent, color: "#2E86C1" },
									{ label: "Admission Pending", value: selectedReport.admissionPending, ratio: pendingPercent, color: "#B7770D" },
								].map((item) => (
									<div key={item.label}>
										<div className="flex items-center justify-between gap-3">
											<p className="text-sm font-black text-[#0D2B55]">{item.label}</p>
											<p className="text-sm font-black text-[#0D2B55]">
												{formatNumber(item.value)} - {item.ratio}%
											</p>
										</div>
										<div className="mt-2 h-4 overflow-hidden rounded-full bg-[#e8eef7]">
											<div
												className="h-full rounded-full transition-all"
												style={{
													width: `${item.ratio}%`,
													backgroundColor: item.color,
												}}
											/>
										</div>
									</div>
								))}
							</div>
						</div>
					) : null}
				</div>

				<aside className="space-y-5">
					{focus === "all" || focus === "payments" ? (
						<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-sm">
							<div className="flex items-center justify-between gap-4">
								<div>
									<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
										Pie Chart
									</p>
									<h3 className="mt-2 text-xl font-black text-[#06183A]">
										Payment status
									</h3>
								</div>
								<PieChart className="size-6 text-[#2E86C1]" />
							</div>
							<div className="mt-6 flex flex-col items-center">
								<div
									className="flex size-52 items-center justify-center rounded-full"
									style={{
										background: `conic-gradient(#0D2B55 0 ${paidPercent}%, #B7770D ${paidPercent}% 100%)`,
									}}
								>
									<div className="flex size-32 flex-col items-center justify-center rounded-full bg-white shadow-inner">
										<p className="text-3xl font-black text-[#0D2B55]">
											{paidPercent}%
										</p>
										<p className="text-xs font-black uppercase tracking-[0.2em] text-[#8395AF]">
											Paid
										</p>
									</div>
								</div>
								<div className="mt-6 grid w-full gap-3">
									<div className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4">
										<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
											Payment Done
										</p>
										<p className="mt-2 text-xl font-black text-[#0D2B55]">
											{formatNumber(selectedReport.paymentPaid)}
										</p>
									</div>
									<div className="rounded-2xl border border-[#f0d49d] bg-[#fff9ed] p-4">
										<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#B7770D]">
											Payment Unpaid
										</p>
										<p className="mt-2 text-xl font-black text-[#0D2B55]">
											{formatNumber(selectedReport.paymentUnpaid)}
										</p>
									</div>
								</div>
							</div>
						</div>
					) : null}

					<div className="rounded-3xl border border-[#d7e2f0] bg-[#0D2B55] p-5 text-white shadow-sm">
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#E4A11B]">
							Report Scope
						</p>
						<h3 className="mt-2 text-xl font-black">
							{selectedReport.collegeName}
						</h3>
						<p className="mt-3 text-sm font-semibold leading-7 text-[#c8d6e8]">
							Superadmin can compare all colleges together or isolate one
							college. College Admin reports should use this same reporting
							model later, but locked to their own college only.
						</p>
					</div>
				</aside>
			</section>

			<section className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-sm sm:p-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							College Comparison
						</p>
						<h3 className="mt-2 text-xl font-black text-[#06183A]">
							Revenue and admission performance
						</h3>
					</div>
					<BarChart3 className="size-6 text-[#2E86C1]" />
				</div>
				<div className="mt-6 grid gap-4 lg:grid-cols-2">
					{visibleRows.map((row) => {
						const revenuePercent = Math.max(8, Math.round((row.revenue / maxRevenue) * 100));
						const completion = percent(row.admissionDone, admissionTotal(row));

						return (
							<article
								key={row.collegeSlug}
								className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4"
							>
								<div className="flex items-start justify-between gap-3">
									<div>
										<p className="text-base font-black text-[#0D2B55]">
											{row.collegeName}
										</p>
										<p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
											{row.collegeCode}
										</p>
									</div>
									<p className="text-sm font-black text-[#B7770D]">
										{formatCurrency(row.revenue)}
									</p>
								</div>
								<div className="mt-4 h-4 overflow-hidden rounded-full bg-[#e8eef7]">
									<div
										className="h-full rounded-full bg-linear-to-r from-[#2E86C1] to-[#0D2B55]"
										style={{ width: `${revenuePercent}%` }}
									/>
								</div>
								<div className="mt-4 grid grid-cols-3 gap-3 text-sm">
									<div>
										<p className="font-black text-[#0D2B55]">{formatNumber(row.onboardedStudents)}</p>
										<p className="text-xs font-semibold text-[#60728f]">Students</p>
									</div>
									<div>
										<p className="font-black text-[#0D2B55]">{completion}%</p>
										<p className="text-xs font-semibold text-[#60728f]">Admission done</p>
									</div>
									<div>
										<p className="font-black text-[#0D2B55]">{formatNumber(row.paymentUnpaid)}</p>
										<p className="text-xs font-semibold text-[#60728f]">Unpaid</p>
									</div>
								</div>
							</article>
						);
					})}
				</div>
			</section>
		</div>
	);
}
