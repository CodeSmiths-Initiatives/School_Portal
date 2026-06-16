"use client";

import {
	Activity,
	CalendarDays,
	Download,
	Eye,
	FileText,
	Filter,
	Pencil,
	RefreshCcw,
	Save,
	Search,
	ShieldCheck,
	Trash2,
	UserRound,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { RowActionMenu } from "@/components/ui/row-action-menu";
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
	actorEmail?: string;
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

type ModalMode = "view" | "edit";
type ReviewDraft = {
	status: "unreviewed" | "reviewed" | "flagged";
	note: string;
};

const PAGE_SIZE = 20;
const DEFAULT_FROM_DATE = "2026-06-09";
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

function daysAgo(days: number) {
	const date = new Date();
	date.setDate(date.getDate() - days);
	return date;
}

function createAuditEvents(colleges: ProvisionedCollege[]): AuditEvent[] {
	const source = colleges.length > 0 ? colleges : fallbackColleges;
	const [primary, secondary = source[0]] = source;

	const definitions: Array<
		Omit<AuditEvent, "collegeSlug" | "collegeName"> & { collegeIndex: number }
	> = [
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

function emptyReviewDraft(): ReviewDraft {
	return {
		status: "unreviewed",
		note: "",
	};
}

function AuditModal({
	event,
	mode,
	draft,
	onClose,
	onDraftChange,
	onSave,
}: {
	event: AuditEvent | null;
	mode: ModalMode | null;
	draft: ReviewDraft;
	onClose: () => void;
	onDraftChange: (draft: ReviewDraft) => void;
	onSave: () => void;
}) {
	if (!event || !mode) {
		return null;
	}

	const meta = eventMeta[event.eventType];
	const Icon = meta.Icon;
	const isEdit = mode === "edit";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
				<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
					<div className="flex items-start gap-4">
						<div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border ${meta.className}`}>
							<Icon className="size-5" />
						</div>
						<div>
							<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
								{isEdit ? "Edit Audit Review" : "Audit Details"}
							</p>
							<h2 className="mt-2 text-xl font-black sm:text-2xl">
								{event.activity}
							</h2>
							<p className="mt-1 text-sm font-semibold text-[#c5d4e8]">
								{event.id} - {event.collegeName} - {formatDateTime(event.when)}
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#0D2B55]"
						aria-label="Close audit details"
					>
						<X className="size-5" />
					</button>
				</div>

				<div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-5 sm:p-6">
					<div className="grid gap-3 md:grid-cols-3">
						{[
							["Actor", event.actor],
							["Role", event.role],
							["IP Address", event.ipAddress],
							["Target", event.target],
							["College", event.collegeName],
							["Type", meta.label],
						].map(([label, value]) => (
							<div
								key={label}
								className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4"
							>
								<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
									{label}
								</p>
								<p className="mt-2 break-words text-sm font-black text-[#0D2B55]">
									{value}
								</p>
							</div>
						))}
					</div>

					<div className="mt-5 rounded-3xl border border-[#dbe5f1] bg-white p-5">
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
							Summary
						</p>
						<p className="mt-3 text-sm font-semibold leading-7 text-[#60728f]">
							{event.summary}
						</p>
					</div>

					<div className="mt-5 rounded-3xl border border-[#dbe5f1] bg-white">
						<div className="border-b border-[#dbe5f1] bg-[#fbfdff] px-5 py-4">
							<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
								Review
							</p>
							<p className="mt-1 text-sm font-semibold text-[#60728f]">
								Review notes are UI-only for this slice; the audit event itself remains immutable.
							</p>
						</div>
						<div className="grid gap-3 p-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
							<select
								value={draft.status}
								disabled={!isEdit}
								onChange={(event) =>
									onDraftChange({
										...draft,
										status: event.target.value as ReviewDraft["status"],
									})
								}
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1] disabled:opacity-70"
							>
								<option value="unreviewed">Unreviewed</option>
								<option value="reviewed">Reviewed</option>
								<option value="flagged">Flagged</option>
							</select>
							<textarea
								value={draft.note}
								disabled={!isEdit}
								onChange={(event) =>
									onDraftChange({ ...draft, note: event.target.value })
								}
								placeholder="Add an internal review note"
								className="min-h-28 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-[#0D2B55] outline-none focus:border-[#2E86C1] disabled:opacity-70"
							/>
						</div>
					</div>

					<div className="sticky bottom-0 mt-5 flex flex-col gap-3 border-t border-[#dbe5f1] bg-white/95 pt-4 backdrop-blur sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={onClose}
							className="inline-flex items-center justify-center rounded-2xl border border-[#dbe5f1] px-5 py-3 text-sm font-black text-[#0D2B55] transition hover:border-[#0D2B55]"
						>
							Close
						</button>
						{isEdit ? (
							<button
								type="button"
								onClick={onSave}
								className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866]"
							>
								<Save className="size-4" />
								Save review
							</button>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}

export function SuperadminAuditWorkspace({
	colleges,
	auditData,
}: SuperadminAuditWorkspaceProps) {
	const defaultFromDate = daysBeforeIso(auditData?.generatedAt, 7, DEFAULT_FROM_DATE);
	const defaultToDate = dateOnlyFromIso(auditData?.generatedAt, DEFAULT_TO_DATE);
	const [collegeSlug, setCollegeSlug] = useState("all");
	const [eventType, setEventType] = useState<"all" | AuditEventType>("all");
	const [query, setQuery] = useState("");
	const [fromDate, setFromDate] = useState(defaultFromDate);
	const [toDate, setToDate] = useState(defaultToDate);
	const [currentPage, setCurrentPage] = useState(1);
	const [openActionsId, setOpenActionsId] = useState<string | null>(null);
	const [modalEvent, setModalEvent] = useState<AuditEvent | null>(null);
	const [modalMode, setModalMode] = useState<ModalMode | null>(null);
	const [reviewsByEvent, setReviewsByEvent] = useState<Record<string, ReviewDraft>>({});
	const [reviewDraft, setReviewDraft] = useState<ReviewDraft>(emptyReviewDraft());

	const collegeOptions = colleges.length > 0 ? colleges : fallbackColleges;
	const auditEvents = useMemo(
		() =>
			auditData
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
		const toTime = toDate
			? new Date(`${toDate}T23:59:59`).getTime()
			: Number.MAX_SAFE_INTEGER;

		return auditEvents.filter((event) => {
			const eventTime = new Date(event.when).getTime();
			const matchesCollege =
				collegeSlug === "all" || event.collegeSlug === collegeSlug;
			const matchesType = eventType === "all" || event.eventType === eventType;
			const matchesDate = eventTime >= fromTime && eventTime <= toTime;
			const matchesSearch =
				!search ||
				[
					event.id,
					event.actor,
					event.actorEmail,
					event.role,
					event.activity,
					event.target,
					event.summary,
					event.collegeName,
					event.ipAddress,
				]
					.filter(Boolean)
					.some((value) => String(value).toLowerCase().includes(search));

			return matchesCollege && matchesType && matchesDate && matchesSearch;
		});
	}, [auditEvents, collegeSlug, eventType, fromDate, query, toDate]);
	const stats = useMemo(
		() => ({
			visible: filteredEvents.length,
			modified: filteredEvents.filter((event) => event.eventType === "updated").length,
			deleted: filteredEvents.filter((event) => event.eventType === "deleted").length,
			reviewed: filteredEvents.filter(
				(event) => reviewsByEvent[event.id]?.status === "reviewed",
			).length,
		}),
		[filteredEvents, reviewsByEvent],
	);
	const pageCount = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
	const safePage = Math.min(currentPage, pageCount);
	const paginatedEvents = filteredEvents.slice(
		(safePage - 1) * PAGE_SIZE,
		safePage * PAGE_SIZE,
	);

	function updateFilter<T>(setter: (value: T) => void, value: T) {
		setter(value);
		setCurrentPage(1);
	}

	function resetFilters() {
		setCollegeSlug("all");
		setEventType("all");
		setQuery("");
		setFromDate(defaultFromDate);
		setToDate(defaultToDate);
		setCurrentPage(1);
	}

	function openEvent(event: AuditEvent, mode: ModalMode) {
		setModalEvent(event);
		setModalMode(mode);
		setReviewDraft(reviewsByEvent[event.id] ?? emptyReviewDraft());
		setOpenActionsId(null);
	}

	function closeModal() {
		setModalEvent(null);
		setModalMode(null);
	}

	function saveReview() {
		if (!modalEvent) {
			return;
		}

		setReviewsByEvent((current) => ({
			...current,
			[modalEvent.id]: reviewDraft,
		}));
		toast.success({
			title: "Review saved",
			description: `${modalEvent.id} review status is now ${reviewDraft.status}.`,
		});
		closeModal();
	}

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
			"Review Status",
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
			reviewsByEvent[event.id]?.status ?? "unreviewed",
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

	return (
		<section className="space-y-5">
			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							Audit Trail
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							Platform audit table
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#556987]">
							Review who did what, when it happened, which tenant was affected,
							and whether the event has been reviewed.
						</p>
					</div>
					<button
						type="button"
						onClick={handleExport}
						disabled={filteredEvents.length === 0}
						className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_14px_26px_rgba(13,43,85,0.2)] transition hover:bg-[#123a73] disabled:cursor-not-allowed disabled:opacity-50"
					>
						<Download className="size-4" />
						Export CSV
					</button>
				</div>

				<div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{[
						["Visible Events", stats.visible],
						["Modified", stats.modified],
						["Deleted", stats.deleted],
						["Reviewed", stats.reviewed],
					].map(([label, value]) => (
						<div
							key={label}
							className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4"
						>
							<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
								{label}
							</p>
							<p className="mt-2 text-3xl font-black text-[#0D2B55]">{value}</p>
						</div>
					))}
				</div>
			</div>

			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-4 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
						<Filter className="size-4" />
						Filters
					</div>
					<button
						type="button"
						onClick={resetFilters}
						className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[#d3dfed] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
					>
						<RefreshCcw className="size-3.5" />
						Reset filters
					</button>
				</div>
				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_14rem_14rem_12rem_12rem]">
					<label className="relative">
						<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
						<input
							value={query}
							onChange={(event) => updateFilter(setQuery, event.target.value)}
							placeholder="Search by actor, target, college, or IP"
							className="h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] pl-11 pr-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>
					<select
						value={collegeSlug}
						onChange={(event) => updateFilter(setCollegeSlug, event.target.value)}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="all">All colleges</option>
						{collegeOptions.map((college) => (
							<option key={college.slug} value={college.slug}>
								{college.name}
							</option>
						))}
					</select>
					<select
						value={eventType}
						onChange={(event) =>
							updateFilter(setEventType, event.target.value as "all" | AuditEventType)
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="all">All activities</option>
						{Object.entries(eventMeta).map(([key, meta]) => (
							<option key={key} value={key}>
								{meta.label}
							</option>
						))}
					</select>
					<label className="relative">
						<CalendarDays className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
						<input
							type="date"
							value={fromDate}
							onChange={(event) => updateFilter(setFromDate, event.target.value)}
							className="h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] pl-11 pr-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
						/>
					</label>
					<label className="relative">
						<CalendarDays className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
						<input
							type="date"
							value={toDate}
							onChange={(event) => updateFilter(setToDate, event.target.value)}
							className="h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] pl-11 pr-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
						/>
					</label>
				</div>
			</div>

			<div className="overflow-hidden rounded-3xl border border-[#d7e2f0] bg-white shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe5f1] px-4 py-4 sm:px-5">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
							Audit Table
						</p>
						<p className="mt-1 text-sm font-semibold text-[#60728f]">
							Showing {paginatedEvents.length} of {filteredEvents.length} events
						</p>
					</div>
					<div className="flex items-center gap-2 rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-4 py-2 text-xs font-black text-[#0D2B55]">
						Page {safePage} of {pageCount}
					</div>
				</div>

				{filteredEvents.length === 0 ? (
					<div className="p-8 text-center">
						<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eef4fb] text-[#2E86C1]">
							<Activity className="size-6" />
						</div>
						<h3 className="mt-4 text-lg font-black text-[#06183A]">
							No audit activity found
						</h3>
						<p className="mt-2 text-sm text-[#60728f]">
							Change the college, date range, or activity filter.
						</p>
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className="min-w-[1120px] w-full border-collapse text-left">
								<thead className="bg-[#f8fbff]">
									<tr className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
										<th className="px-5 py-4">Actor</th>
										<th className="px-5 py-4">Activity</th>
										<th className="px-5 py-4">College</th>
										<th className="px-5 py-4">When</th>
										<th className="px-5 py-4">Type</th>
										<th className="px-5 py-4">Review</th>
										<th className="px-5 py-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[#dbe5f1]">
									{paginatedEvents.map((event) => {
										const meta = eventMeta[event.eventType];
										const Icon = meta.Icon;
										const review = reviewsByEvent[event.id] ?? emptyReviewDraft();

										return (
											<tr
												key={event.id}
												className="bg-white transition hover:bg-[#f8fbff]"
											>
												<td className="px-5 py-4">
													<p className="font-black text-[#06183A]">{event.actor}</p>
													<p className="mt-1 text-xs font-bold text-[#6b7f9c]">
														{event.role} - {event.ipAddress}
													</p>
												</td>
												<td className="px-5 py-4">
													<p className="font-black text-[#0D2B55]">
														{event.activity}
													</p>
													<p className="mt-1 max-w-[20rem] truncate text-sm font-semibold text-[#60728f]">
														{event.target}
													</p>
												</td>
												<td className="px-5 py-4">
													<p className="text-sm font-black text-[#405879]">
														{event.collegeName}
													</p>
												</td>
												<td className="px-5 py-4">
													<p className="text-sm font-bold text-[#60728f]">
														{formatDateTime(event.when)}
													</p>
												</td>
												<td className="px-5 py-4">
													<span
														className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${meta.className}`}
													>
														<Icon className="size-3.5" />
														{meta.label}
													</span>
												</td>
												<td className="px-5 py-4">
													<span className="rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#0D2B55]">
														{review.status}
													</span>
												</td>
												<td className="px-5 py-4">
													<RowActionMenu
														label={`Open actions for ${event.id}`}
														open={openActionsId === event.id}
														onOpenChange={(open) =>
															setOpenActionsId(open ? event.id : null)
														}
														items={[
															{
																label: "View",
																icon: <Eye className="size-4" />,
																onSelect: () => openEvent(event, "view"),
															},
															{
																label: "Edit review",
																icon: <Pencil className="size-4" />,
																className: "text-[#0D2B55] hover:bg-[#eef4fb]",
																onSelect: () => openEvent(event, "edit"),
															},
														]}
													/>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>

						<div className="flex flex-col gap-3 border-t border-[#dbe5f1] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
							<p className="text-sm font-semibold text-[#60728f]">
								Rows per page: {PAGE_SIZE}
							</p>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
									disabled={safePage === 1}
									className="h-10 rounded-2xl border border-[#d3dfed] bg-white px-4 text-sm font-black text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D] disabled:cursor-not-allowed disabled:opacity-40"
								>
									Previous
								</button>
								<button
									type="button"
									onClick={() =>
										setCurrentPage((page) => Math.min(pageCount, page + 1))
									}
									disabled={safePage === pageCount}
									className="h-10 rounded-2xl bg-[#0D2B55] px-4 text-sm font-black text-white transition hover:bg-[#123866] disabled:cursor-not-allowed disabled:opacity-40"
								>
									Next
								</button>
							</div>
						</div>
					</>
				)}
			</div>

			<AuditModal
				event={modalEvent}
				mode={modalMode}
				draft={reviewDraft}
				onClose={closeModal}
				onDraftChange={setReviewDraft}
				onSave={saveReview}
			/>
		</section>
	);
}
