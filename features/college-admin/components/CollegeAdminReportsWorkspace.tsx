"use client";

import {
	Activity,
	BarChart3,
	CalendarDays,
	CircleDollarSign,
	Download,
	LoaderCircle,
	LineChart,
	PieChart,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { CollegeAdminReportPayload } from "@/lib/services/college-admin.service";
import { formatNaira } from "@/lib/services/paystack.service";

type CollegeAdminReportsWorkspaceProps = {
	initialReport: CollegeAdminReportPayload;
	collegeSlug: string;
	collegeName: string;
};

function maxValue(points: Array<{ value: number }>) {
	return Math.max(1, ...points.map((point) => point.value));
}

function titleCase(value: string) {
	return value
		.split("_")
		.join(" ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
	const headers = Object.keys(rows[0] ?? {});
	const csv = [
		headers.map((header) => `"${header}"`).join(","),
		...rows.map((row) =>
			headers
				.map((header) => `"${String(row[header] ?? "").replaceAll("\"", "\"\"")}"`)
				.join(","),
		),
	].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");

	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

function StatCard({
	label,
	value,
	icon: Icon,
}: {
	label: string;
	value: string;
	icon: typeof Users;
}) {
	return (
		<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8395AF]">
						{label}
					</p>
					<p className="mt-3 text-3xl font-black text-[#0D2B55]">{value}</p>
				</div>
				<div className="flex size-12 items-center justify-center rounded-2xl bg-[#eef4fb] text-[#2E86C1]">
					<Icon className="size-5" />
				</div>
			</div>
		</div>
	);
}

function BarPanel({
	title,
	points,
	valueFormatter = String,
}: {
	title: string;
	points: Array<{ label: string; value: number }>;
	valueFormatter?: (value: number) => string;
}) {
	const max = maxValue(points);

	return (
		<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
			<div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
				<BarChart3 className="size-4" />
				{title}
			</div>
			<div className="mt-5 space-y-4">
				{points.length ? (
					points.map((point) => (
						<div key={point.label}>
							<div className="mb-2 flex justify-between gap-3 text-sm font-black text-[#0D2B55]">
								<span>{titleCase(point.label)}</span>
								<span>{valueFormatter(point.value)}</span>
							</div>
							<div className="h-3 overflow-hidden rounded-full bg-[#e6eef8]">
								<div
									className="h-full rounded-full bg-[linear-gradient(90deg,#B7770D,#2E86C1)]"
									style={{ width: `${Math.max(8, (point.value / max) * 100)}%` }}
								/>
							</div>
						</div>
					))
				) : (
					<p className="text-sm font-semibold text-[#60728f]">No report data yet.</p>
				)}
			</div>
		</div>
	);
}

function LinePanel({
	title,
	points,
	valueFormatter = String,
}: {
	title: string;
	points: Array<{ label: string; value: number }>;
	valueFormatter?: (value: number) => string;
}) {
	const max = maxValue(points);
	const svgPoints = points
		.map((point, index) => {
			const x = points.length === 1 ? 150 : (index / (points.length - 1)) * 300;
			const y = 130 - (point.value / max) * 105;
			return `${x},${y}`;
		})
		.join(" ");

	return (
		<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
			<div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
				<LineChart className="size-4" />
				{title}
			</div>
			<div className="mt-5 overflow-hidden rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4">
				<svg viewBox="0 0 300 140" className="h-52 w-full" preserveAspectRatio="none">
					<polyline
						points={svgPoints}
						fill="none"
						stroke="#0D2B55"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="5"
					/>
					{points.map((point, index) => {
						const x = points.length === 1 ? 150 : (index / (points.length - 1)) * 300;
						const y = 130 - (point.value / max) * 105;

						return (
							<circle
								key={point.label}
								cx={x}
								cy={y}
								r="6"
								fill="#B7770D"
								stroke="white"
								strokeWidth="3"
							/>
						);
					})}
				</svg>
				<div className="grid gap-2 sm:grid-cols-4">
					{points.map((point) => (
						<div key={point.label} className="rounded-xl bg-white p-3 text-center">
							<p className="text-sm font-black text-[#0D2B55]">
								{valueFormatter(point.value)}
							</p>
							<p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#8395AF]">
								{point.label}
							</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default function CollegeAdminReportsWorkspace({
	initialReport,
	collegeSlug,
	collegeName,
}: CollegeAdminReportsWorkspaceProps) {
	const [reportState, setReportState] = useState(initialReport);
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const filteredHint = useMemo(
		() => (from || to ? `${from || "start"} to ${to || "today"}` : "All time"),
		[from, to],
	);

	function exportReport() {
		downloadCsv(`${collegeSlug}-college-report.csv`, [
			{
				college: collegeName,
				range: filteredHint,
				...reportState.summary,
			},
		]);
	}

	async function refreshReport() {
		setIsLoading(true);
		setError("");

		try {
			const params = new URLSearchParams({ collegeSlug });
			if (from) params.set("from", from);
			if (to) params.set("to", to);

			const response = await fetch(`/api/college-admin/reports?${params.toString()}`, {
				cache: "no-store",
			});
			const payload = (await response.json()) as {
				report?: CollegeAdminReportPayload;
				error?: string;
			};

			if (!response.ok || !payload.report) {
				throw new Error(payload.error ?? "Unable to refresh report.");
			}

			setReportState(payload.report);
		} catch (refreshError) {
			setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh report.");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<section className="space-y-5">
			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							College Reports
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							{collegeName} analytics
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#60728f]">
							Live tenant report for admissions, students, payments, and staff
							activity. Superadmin sees all colleges; this view stays scoped to
							one college.
						</p>
					</div>
					<button
						type="button"
						onClick={exportReport}
						className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)]"
					>
						<Download className="size-4" />
						Export Summary
					</button>
				</div>
				<div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
					<label className="flex h-12 items-center gap-2 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4">
						<CalendarDays className="size-4 text-[#B7770D]" />
						<input
							type="date"
							value={from}
							onChange={(event) => setFrom(event.target.value)}
							className="w-full bg-transparent text-sm font-bold text-[#0D2B55] outline-none"
						/>
					</label>
					<label className="flex h-12 items-center gap-2 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4">
						<CalendarDays className="size-4 text-[#B7770D]" />
						<input
							type="date"
							value={to}
							onChange={(event) => setTo(event.target.value)}
							className="w-full bg-transparent text-sm font-bold text-[#0D2B55] outline-none"
						/>
					</label>
					<div className="flex h-12 items-center rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-black text-[#0D2B55]">
						{filteredHint}
					</div>
					<button
						type="button"
						onClick={refreshReport}
						disabled={isLoading}
						className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#0D2B55] bg-white px-5 text-sm font-black text-[#0D2B55] transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-60"
					>
						{isLoading ? <LoaderCircle className="size-4 animate-spin" /> : null}
						Apply
					</button>
				</div>
				{error ? (
					<div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
						{error}
					</div>
				) : null}
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Students"
					value={String(reportState.summary.totalStudents)}
					icon={Users}
				/>
				<StatCard
					label="Applications"
					value={String(reportState.summary.totalApplications)}
					icon={Activity}
				/>
				<StatCard
					label="Paid"
					value={formatNaira(reportState.summary.totalPaid)}
					icon={CircleDollarSign}
				/>
				<StatCard
					label="Pending"
					value={formatNaira(reportState.summary.totalPending)}
					icon={PieChart}
				/>
			</div>

			<div className="grid gap-5 xl:grid-cols-2">
				<BarPanel title="Admission status" points={reportState.charts.admissionStatus} />
				<BarPanel title="Payment status" points={reportState.charts.paymentStatus} />
				<LinePanel title="Monthly admissions" points={reportState.charts.monthlyAdmissions} />
				<LinePanel
					title="Monthly collections"
					points={reportState.charts.monthlyPayments}
					valueFormatter={formatNaira}
				/>
			</div>
		</section>
	);
}
