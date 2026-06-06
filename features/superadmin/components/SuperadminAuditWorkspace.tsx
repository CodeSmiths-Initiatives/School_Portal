"use client";

import {
	Activity,
	CalendarDays,
	Download,
	FileText,
	Filter,
	RefreshCcw,
	Search,
	ShieldCheck,
	Trash2,
	UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ProvisionedCollege } from "@/lib/services/superadmin-college.service";
import type { SuperadminAuditData } from "@/lib/services/superadmin-audit.service";
import { toast } from "@/lib/toast";

type AuditEventType =
	| "created"
	| "updated"
	| "deleted"
	| "login"
	| "exported"
	| "settings"
	| "payment";

type AuditEvent = {
	id: string;
	collegeSlug: string;
	collegeName: string;
	actor: string;
	role: string;
	activity: string;
	target: string;
	eventType: AuditEventType;
	when: string;
	ipAddress: string;
	summary: string;
};

type SuperadminAuditWorkspaceProps = {
	colleges: ProvisionedCollege[];
	auditData?: SuperadminAuditData | null;
};

const fallbackColleges: ProvisionedCollege[] = [
	{
		id: "kwara-applied-sciences",
		name: "Kwara Applied Sciences",
		code: "KAS",
		slug: "kwara-applied-sciences",
		status: "active",
	},
	{
		id: "kwara-business-health",
		name: "Kwara Business and Health",
		code: "KBH",
		slug: "kwara-business-health",
		status: "active",
	},
];

const eventMeta = {
	created: {
		label: "Created",
		className: "border-emerald-200 bg-emerald-50 text-emerald-700",
		Icon: ShieldCheck,
	},
	updated: {
		label: "Modified",
		className: "border-blue-200 bg-blue-50 text-blue-700",
		Icon: FileText,
	},
	deleted: {
		label: "Deleted",
		className: "border-red-200 bg-red-50 text-red-700",
		Icon: Trash2,
	},
	login: {
		label: "Login",
		className: "border-amber-200 bg-amber-50 text-amber-700",
		Icon: UserRound,
	},
	exported: {
		label: "Exported",
		className: "border-slate-200 bg-slate-50 text-slate-700",
		Icon: Download,
	},
	settings: {
		label: "Settings",
		className: "border-violet-200 bg-violet-50 text-violet-700",
		Icon: ShieldCheck,
	},
	payment: {
		label: "Payment",
		className: "border-emerald-200 bg-emerald-50 text-emerald-700",
		Icon: FileText,
	},
} satisfies Record<
	AuditEventType,
	{
		label: string;
		className: string;
		Icon: typeof Activity;
	}
>;

function dateOnly(value: Date) {
	return value.toISOString().slice(0, 10);
}

function daysAgo(days: number) {
	const date = new Date();
	date.setDate(date.getDate() - days);
	return date;
}

function createAuditEvents(colleges: ProvisionedCollege[]): AuditEvent[] {
	const source = colleges.length > 0 ? colleges : fallbackColleges;
	const [primary, secondary = source[0]] = source;

	const definitions: Array<Omit<AuditEvent, "collegeSlug" | "collegeName"> & { collegeIndex: number }> = [
		{
			id: "AUD-1001",
			collegeIndex: 0,
			actor: "principal.superadmin",
			role: "Superadmin",
			activity: "College status changed",
			target: "College access",
			eventType: "updated",
			when: daysAgo(0).toISOString(),
			ipAddress: "102.88.42.11",
			summary: `${primary?.name ?? "College"} was reviewed and kept active for admission access.`,
		},
		{
			id: "AUD-1002",
			collegeIndex: 0,
			actor: "admin.kwara",
			role: "College Admin",
			activity: "Admission record modified",
			target: "Application ADM-1780638288525-LJASI1",
			eventType: "updated",
			when: daysAgo(1).toISOString(),
			ipAddress: "197.210.77.44",
			summary: "Programme selection and application review status were updated.",
		},
		{
			id: "AUD-1003",
			collegeIndex: 1,
			actor: "bursary.clerk",
			role: "Staff",
			activity: "Payment receipt exported",
			target: "Invoice INV-ADM-1780638288913-LJASI1",
			eventType: "exported",
			when: daysAgo(1).toISOString(),
			ipAddress: "105.112.18.91",
			summary: "Payment invoice was exported for reconciliation review.",
		},
		{
			id: "AUD-1004",
			collegeIndex: 0,
			actor: "student.kwara",
			role: "Student",
			activity: "Student login successful",
			target: "Student dashboard",
			eventType: "login",
			when: daysAgo(2).toISOString(),
			ipAddress: "41.190.2.34",
			summary: "Student accessed the college-scoped dashboard successfully.",
		},
		{
			id: "AUD-1005",
			collegeIndex: 1,
			actor: "principal.superadmin",
			role: "Superadmin",
			activity: "Role permission modified",
			target: "platform-college-admin",
			eventType: "updated",
			when: daysAgo(3).toISOString(),
			ipAddress: "102.88.42.11",
			summary: "Global College Admin permission template was updated.",
		},
		{
			id: "AUD-1006",
			collegeIndex: 0,
			actor: "registry.admin",
			role: "College Admin",
			activity: "Student document deleted",
			target: "Duplicate document upload",
			eventType: "deleted",
			when: daysAgo(4).toISOString(),
			ipAddress: "154.113.9.21",
			summary: "A duplicate admission document was removed from the student file.",
		},
		{
			id: "AUD-1007",
			collegeIndex: 1,
			actor: "principal.superadmin",
			role: "Superadmin",
			activity: "College admin created",
			target: secondary?.admin?.email ?? "college admin account",
			eventType: "created",
			when: daysAgo(5).toISOString(),
			ipAddress: "102.88.42.11",
			summary: "Primary college admin account was provisioned and linked to the tenant.",
		},
	];

	return definitions.map(({ collegeIndex, ...event }) => {
		const college = source[collegeIndex] ?? source[0];

		return {
			...event,
			collegeSlug: college.slug,
			collegeName: college.name,
		};
	});
}

function toCsvValue(value: string) {
	return `"${value.replace(/"/g, '""')}"`;
}

function formatDateTime(value: string) {
	return new Intl.DateTimeFormat("en-NG", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

export function SuperadminAuditWorkspace({
	colleges,
	auditData,
}: SuperadminAuditWorkspaceProps) {
	const [collegeSlug, setCollegeSlug] = useState("all");
	const [eventType, setEventType] = useState<"all" | AuditEventType>("all");
	const [query, setQuery] = useState("");
	const [fromDate, setFromDate] = useState(dateOnly(daysAgo(7)));
	const [toDate, setToDate] = useState(dateOnly(new Date()));

	const collegeOptions = colleges.length > 0 ? colleges : fallbackColleges;
	const auditEvents = useMemo(
		() =>
			auditData?.events.length
				? auditData.events.map((event) => ({
						...event,
						eventType: event.eventType as AuditEventType,
					}))
				: createAuditEvents(collegeOptions),
		[auditData, collegeOptions],
	);

	const filteredEvents = useMemo(() => {
		const search = query.trim().toLowerCase();
		const fromTime = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : 0;
		const toTime = toDate ? new Date(`${toDate}T23:59:59`).getTime() : Number.MAX_SAFE_INTEGER;

		return auditEvents.filter((event) => {
			const eventTime = new Date(event.when).getTime();
			const matchesCollege =
				collegeSlug === "all" || event.collegeSlug === collegeSlug;
			const matchesType = eventType === "all" || event.eventType === eventType;
			const matchesDate = eventTime >= fromTime && eventTime <= toTime;
			const matchesSearch =
				!search ||
				[
					event.actor,
					event.role,
					event.activity,
					event.target,
					event.summary,
					event.collegeName,
				].some((value) => value.toLowerCase().includes(search));

			return matchesCollege && matchesType && matchesDate && matchesSearch;
		});
	}, [auditEvents, collegeSlug, eventType, fromDate, query, toDate]);

	const deletedCount = filteredEvents.filter(
		(event) => event.eventType === "deleted",
	).length;
	const modifiedCount = filteredEvents.filter(
		(event) => event.eventType === "updated",
	).length;
	const recentEvents = filteredEvents.slice(0, 4);

	function handleExport() {
		if (filteredEvents.length === 0) {
			toast.info({
				title: "No audit rows",
				description: "Adjust the filters before exporting.",
			});
			return;
		}

		const headers = [
			"Audit ID",
			"College",
			"Actor",
			"Role",
			"Activity",
			"Target",
			"Event Type",
			"When",
			"IP Address",
			"Summary",
		];
		const rows = filteredEvents.map((event) => [
			event.id,
			event.collegeName,
			event.actor,
			event.role,
			event.activity,
			event.target,
			eventMeta[event.eventType].label,
			formatDateTime(event.when),
			event.ipAddress,
			event.summary,
		]);
		const csv = [headers, ...rows]
			.map((row) => row.map(toCsvValue).join(","))
			.join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `superadmin-audit-${collegeSlug}-${fromDate}-to-${toDate}.csv`;
		link.click();
		URL.revokeObjectURL(url);

		toast.success({
			title: "Audit exported",
			description: `${filteredEvents.length} audit event${
				filteredEvents.length === 1 ? "" : "s"
			} exported as CSV.`,
		});
	}

	function resetFilters() {
		setCollegeSlug("all");
		setEventType("all");
		setQuery("");
		setFromDate(dateOnly(daysAgo(7)));
		setToDate(dateOnly(new Date()));
	}

	return (
		<div className="space-y-6">
			<section className="grid gap-4 lg:grid-cols-4">
				<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-sm">
					<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8395AF]">
						Visible Events
					</p>
					<p className="mt-3 text-3xl font-black text-[#0D2B55]">
						{filteredEvents.length}
					</p>
					<p className="mt-2 text-sm font-semibold text-[#60728f]">
						Filtered by college, date, and activity.
					</p>
				</div>
				<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-sm">
					<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8395AF]">
						Modified
					</p>
					<p className="mt-3 text-3xl font-black text-[#0D2B55]">
						{modifiedCount}
					</p>
					<p className="mt-2 text-sm font-semibold text-[#60728f]">
						Who modified what is tracked.
					</p>
				</div>
				<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-sm">
					<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8395AF]">
						Deleted
					</p>
					<p className="mt-3 text-3xl font-black text-[#0D2B55]">
						{deletedCount}
					</p>
					<p className="mt-2 text-sm font-semibold text-[#60728f]">
						Deletion actions stay visible.
					</p>
				</div>
				<div className="rounded-3xl border border-[#d7e2f0] bg-[#0D2B55] p-5 text-white shadow-sm">
					<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
						Export Ready
					</p>
					<p className="mt-3 text-3xl font-black">CSV</p>
					<p className="mt-2 text-sm font-semibold text-[#b8c7dc]">
						Export the current audit view.
					</p>
				</div>
			</section>

			<section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
				<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
								Audit Trail
							</p>
							<h2 className="mt-2 text-2xl font-black text-[#06183A]">
								Who did what, and when
							</h2>
							<p className="mt-2 max-w-2xl text-sm leading-7 text-[#556987]">
								Review sensitive activity by college, actor, date range, and
								action type. This workspace is ready to connect to Strapi audit
								log rows when the backend writer is enabled.
							</p>
						</div>
						<button
							type="button"
							onClick={handleExport}
							className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_14px_26px_rgba(13,43,85,0.2)] transition hover:bg-[#123a73]"
						>
							<Download className="size-4" />
							Export CSV
						</button>
					</div>

					<div className="mt-6 grid gap-3 rounded-3xl border border-[#dbe5f1] bg-[#f8fbff] p-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
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
								<Activity className="size-3.5" />
								Activity
							</span>
							<select
								value={eventType}
								onChange={(event) =>
									setEventType(event.target.value as "all" | AuditEventType)
								}
								className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-white px-4 text-sm font-bold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
							>
								<option value="all">All activities</option>
								{Object.entries(eventMeta).map(([key, meta]) => (
									<option key={key} value={key}>
										{meta.label}
									</option>
								))}
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

					<label className="mt-4 flex h-12 items-center gap-3 rounded-2xl border border-[#dbe5f1] bg-white px-4 text-sm font-semibold text-[#60728f]">
						<Search className="size-4 text-[#8395AF]" />
						<input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search by user, activity, target, or college"
							className="min-w-0 flex-1 bg-transparent text-[#0D2B55] outline-none placeholder:text-[#8ca0bb]"
						/>
					</label>

					<div className="mt-5 overflow-hidden rounded-3xl border border-[#dbe5f1]">
						<div className="hidden grid-cols-[1.2fr_1.3fr_1fr_1.1fr_9rem] gap-4 bg-[#f8fbff] px-5 py-4 text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF] lg:grid">
							<span>Actor</span>
							<span>Activity</span>
							<span>College</span>
							<span>When</span>
							<span>Type</span>
						</div>
						<div className="divide-y divide-[#e2eaf4]">
							{filteredEvents.map((event) => {
								const meta = eventMeta[event.eventType];
								const Icon = meta.Icon;

								return (
									<article
										key={event.id}
										className="grid gap-4 bg-white px-5 py-5 transition hover:bg-[#fbfdff] lg:grid-cols-[1.2fr_1.3fr_1fr_1.1fr_9rem] lg:items-center"
									>
										<div>
											<p className="font-black text-[#06183A]">{event.actor}</p>
											<p className="mt-1 text-xs font-bold text-[#6b7f9c]">
												{event.role} - {event.ipAddress}
											</p>
										</div>
										<div>
											<p className="font-black text-[#0D2B55]">
												{event.activity}
											</p>
											<p className="mt-1 text-sm leading-6 text-[#60728f]">
												{event.target}
											</p>
										</div>
										<p className="text-sm font-bold text-[#405879]">
											{event.collegeName}
										</p>
										<p className="text-sm font-bold text-[#405879]">
											{formatDateTime(event.when)}
										</p>
										<span
											className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${meta.className}`}
										>
											<Icon className="size-3.5" />
											{meta.label}
										</span>
										<p className="lg:col-span-5 rounded-2xl border border-[#e5edf6] bg-[#fbfdff] px-4 py-3 text-sm leading-6 text-[#60728f]">
											{event.summary}
										</p>
									</article>
								);
							})}
							{filteredEvents.length === 0 ? (
								<div className="bg-white px-5 py-10 text-center">
									<p className="text-base font-black text-[#0D2B55]">
										No audit activity found
									</p>
									<p className="mt-2 text-sm font-semibold text-[#60728f]">
										Change the college, date range, or activity filter.
									</p>
								</div>
							) : null}
						</div>
					</div>
				</div>

				<aside className="space-y-5">
					<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							Recent Activity
						</p>
						<h3 className="mt-2 text-xl font-black text-[#06183A]">
							Latest platform movement
						</h3>
						<div className="mt-5 space-y-3">
							{recentEvents.map((event) => {
								const meta = eventMeta[event.eventType];
								const Icon = meta.Icon;

								return (
									<div
										key={`${event.id}-recent`}
										className="rounded-2xl border border-[#e2eaf4] bg-[#fbfdff] p-4"
									>
										<div className="flex items-start gap-3">
											<div
												className={`flex size-10 shrink-0 items-center justify-center rounded-full border ${meta.className}`}
											>
												<Icon className="size-4" />
											</div>
											<div>
												<p className="text-sm font-black text-[#0D2B55]">
													{event.activity}
												</p>
												<p className="mt-1 text-xs font-bold text-[#6b7f9c]">
													{event.actor} - {event.collegeName}
												</p>
											</div>
										</div>
										<p className="mt-3 text-xs font-semibold leading-5 text-[#60728f]">
											{event.summary}
										</p>
									</div>
								);
							})}
						</div>
					</div>

					<div className="rounded-3xl border border-[#d7e2f0] bg-[#0D2B55] p-5 text-white shadow-[0_18px_45px_rgba(13,43,85,0.14)]">
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#E4A11B]">
							Compliance Scope
						</p>
						<h3 className="mt-2 text-xl font-black">Audit rules</h3>
						<div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-[#c8d6e8]">
							<p>Every sensitive action should persist actor, role, college, target, IP address, and timestamp.</p>
							<p>Deletes are never removed from audit history; only the business record changes.</p>
							<p>Superadmin can export filtered audit evidence per college and date range.</p>
						</div>
					</div>
				</aside>
			</section>
		</div>
	);
}
