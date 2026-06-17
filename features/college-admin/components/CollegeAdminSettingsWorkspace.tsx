"use client";

import {
	Archive,
	BellRing,
	CalendarClock,
	CheckCircle2,
	Copy,
	Eye,
	Filter,
	Megaphone,
	Plus,
	Search,
	Send,
	ShieldCheck,
	X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RowActionMenu } from "@/components/ui/row-action-menu";
import type {
	AppNotification,
	AppNotificationListPayload,
} from "@/lib/services/notification.service";
import { toast } from "@/lib/toast";

type NoticeAudience = "all" | "students" | "staff";
type NoticeSeverity = "info" | "success" | "warning" | "critical";
type NoticeStatus = "draft" | "scheduled" | "active" | "expired";

type AdminNotice = {
	id: string;
	title: string;
	message: string;
	audience: NoticeAudience;
	severity: NoticeSeverity;
	status: NoticeStatus;
	startAt: string;
	endAt: string;
	createdBy: string;
	updatedAt: string;
};

type NoticeForm = {
	title: string;
	message: string;
	audience: NoticeAudience;
	severity: NoticeSeverity;
	status: NoticeStatus;
	startAt: string;
	endAt: string;
};

type CollegeAdminSettingsWorkspaceProps = {
	collegeName: string;
	collegeSlug: string;
	actorName: string;
	canCreateNotice: boolean;
	canUpdateSettings: boolean;
};

const STATUS_LABELS: Record<NoticeStatus, string> = {
	draft: "Draft",
	scheduled: "Scheduled",
	active: "Active",
	expired: "Expired",
};

const AUDIENCE_LABELS: Record<NoticeAudience, string> = {
	all: "All users",
	students: "Students",
	staff: "Staff",
};

const SEVERITY_LABELS: Record<NoticeSeverity, string> = {
	info: "Info",
	success: "Success",
	warning: "Warning",
	critical: "Critical",
};

const statusStyles = {
	draft: "border-slate-200 bg-slate-50 text-slate-700",
	scheduled: "border-blue-200 bg-blue-50 text-blue-700",
	active: "border-emerald-200 bg-emerald-50 text-emerald-700",
	expired: "border-slate-200 bg-slate-50 text-slate-500",
} satisfies Record<NoticeStatus, string>;

const severityStyles = {
	info: "border-blue-200 bg-blue-50 text-blue-700",
	success: "border-emerald-200 bg-emerald-50 text-emerald-700",
	warning: "border-amber-200 bg-amber-50 text-amber-700",
	critical: "border-red-200 bg-red-50 text-red-700",
} satisfies Record<NoticeSeverity, string>;

function dateTimeLocal(daysOffset = 0) {
	const date = new Date();
	date.setDate(date.getDate() + daysOffset);
	date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
	return date.toISOString().slice(0, 16);
}

function formatDateTime(value: string) {
	return new Intl.DateTimeFormat("en-NG", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

function emptyNoticeForm(): NoticeForm {
	return {
		title: "",
		message: "",
		audience: "students",
		severity: "info",
		status: "draft",
		startAt: dateTimeLocal(),
		endAt: dateTimeLocal(7),
	};
}

function mapNotificationToAdminNotice(
	notification: AppNotification,
	fallbackActor: string,
): AdminNotice {
	return {
		id: notification.id,
		title: notification.title,
		message: notification.message,
		audience:
			notification.audience === "college-admins" ||
			notification.audience === "specific-admin" ||
			notification.audience === "specific-user"
				? "all"
				: notification.audience,
		severity: notification.severity,
		status: notification.status === "archived" ? "expired" : notification.status,
		startAt: notification.startAt ?? "",
		endAt: notification.endAt ?? "",
		createdBy:
			notification.createdBy?.username ||
			notification.createdBy?.email ||
			fallbackActor,
		updatedAt: notification.updatedAt ?? notification.createdAt ?? "",
	};
}

function createIdempotencyKey(collegeSlug: string, form: NoticeForm) {
	return [
		"college-notice",
		collegeSlug,
		form.title.trim().toLowerCase(),
		form.audience,
		form.status,
		form.startAt,
		form.endAt,
	]
		.join(":")
		.replace(/[^a-z0-9:.-]+/g, "-")
		.slice(0, 150);
}

function Badge({
	children,
	className,
}: {
	children: React.ReactNode;
	className: string;
}) {
	return (
		<span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${className}`}>
			{children}
		</span>
	);
}

function FieldLabel({
	children,
	label,
}: {
	children: React.ReactNode;
	label: string;
}) {
	return (
		<label className="block">
			<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
				{label}
			</span>
			{children}
		</label>
	);
}

function inputClassName() {
	return "mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]";
}

function textareaClassName() {
	return "mt-2 min-h-28 w-full resize-none rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 py-3 text-sm font-semibold leading-6 text-[#0D2B55] outline-none transition focus:border-[#2E86C1]";
}

export default function CollegeAdminSettingsWorkspace({
	collegeName,
	collegeSlug,
	actorName,
	canCreateNotice,
	canUpdateSettings,
}: CollegeAdminSettingsWorkspaceProps) {
	const [notices, setNotices] = useState<AdminNotice[]>([]);
	const [form, setForm] = useState<NoticeForm>(() => emptyNoticeForm());
	const [showCreatePanel, setShowCreatePanel] = useState(false);
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<NoticeStatus | "all">("all");
	const [audience, setAudience] = useState<NoticeAudience | "all">("all");
	const [severity, setSeverity] = useState<NoticeSeverity | "all">("all");
	const [viewNotice, setViewNotice] = useState<AdminNotice | null>(null);
	const [openActionsId, setOpenActionsId] = useState<string | null>(null);
	const [isLoadingNotices, setIsLoadingNotices] = useState(false);
	const [isSavingNotice, setIsSavingNotice] = useState(false);

	const loadNotices = useCallback(async () => {
		setIsLoadingNotices(true);

		try {
			const response = await fetch(
				"/api/notifications?manage=true&status=all&pageSize=50",
				{ cache: "no-store" },
			);
			const payload = (await response.json().catch(() => null)) as
				| AppNotificationListPayload
				| { error?: string }
				| null;

			if (!response.ok) {
				throw new Error(
					(payload as { error?: string } | null)?.error ??
						"Unable to load college notices.",
				);
			}

			setNotices(
				(payload as AppNotificationListPayload).notifications.map((notification) =>
					mapNotificationToAdminNotice(notification, actorName),
				),
			);
		} catch (error) {
			toast.error({
				title: "Notice load failed",
				description:
					error instanceof Error
						? error.message
						: "Unable to load persisted college notices.",
			});
		} finally {
			setIsLoadingNotices(false);
		}
	}, [actorName]);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			void loadNotices();
		}, 0);

		return () => window.clearTimeout(timeoutId);
	}, [loadNotices]);

	const filteredNotices = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return notices.filter((notice) => {
			const haystack = `${notice.title} ${notice.message} ${notice.createdBy}`.toLowerCase();

			return (
				(!normalizedSearch || haystack.includes(normalizedSearch)) &&
				(status === "all" || notice.status === status) &&
				(audience === "all" || notice.audience === audience) &&
				(severity === "all" || notice.severity === severity)
			);
		});
	}, [audience, notices, search, severity, status]);

	const recentNotices = useMemo(
		() =>
			[...notices]
				.filter((notice) => notice.createdBy === actorName)
				.sort(
					(left, right) =>
						new Date(right.updatedAt).getTime() -
						new Date(left.updatedAt).getTime(),
				)
				.slice(0, 3),
		[actorName, notices],
	);

	const analytics = useMemo(
		() => ({
			total: notices.length,
			active: notices.filter((notice) => notice.status === "active").length,
			scheduled: notices.filter((notice) => notice.status === "scheduled").length,
			createdByYou: notices.filter((notice) => notice.createdBy === actorName).length,
		}),
		[actorName, notices],
	);
	const statCards = [
		{ label: "Total Notices", value: analytics.total, icon: Megaphone },
		{ label: "Active", value: analytics.active, icon: CheckCircle2 },
		{ label: "Scheduled", value: analytics.scheduled, icon: CalendarClock },
		{ label: "Created By You", value: analytics.createdByYou, icon: ShieldCheck },
	] satisfies Array<{ label: string; value: number; icon: LucideIcon }>;

	function updateForm<Key extends keyof NoticeForm>(key: Key, value: NoticeForm[Key]) {
		setForm((current) => ({ ...current, [key]: value }));
	}

	function clearFilters() {
		setSearch("");
		setStatus("all");
		setAudience("all");
		setSeverity("all");
	}

	async function createNotice() {
		if (!canCreateNotice) {
			toast.error("You do not have permission to create notices.");
			return;
		}

		if (form.title.trim().length < 3 || form.message.trim().length < 10) {
			toast.error({
				title: "Notice needs more detail",
				description: "Add a title and a message before saving the notice.",
			});
			return;
		}

		setIsSavingNotice(true);

		try {
			const response = await fetch("/api/notifications", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					scope: "college",
					collegeSlug,
					title: form.title.trim(),
					message: form.message.trim(),
					audience: form.audience,
					severity: form.severity,
					status: form.status,
					startAt: form.startAt,
					endAt: form.endAt,
					idempotencyKey: createIdempotencyKey(collegeSlug, form),
				}),
			});
			const payload = (await response.json().catch(() => null)) as
				| { error?: string; notification?: AppNotification }
				| null;

			if (!response.ok) {
				throw new Error(payload?.error ?? "Unable to save notice.");
			}

			const notice = payload?.notification
				? mapNotificationToAdminNotice(payload.notification, actorName)
				: ({
						...form,
						id: createIdempotencyKey(collegeSlug, form),
						title: form.title.trim(),
						message: form.message.trim(),
						createdBy: actorName,
						updatedAt: new Date().toISOString(),
					} satisfies AdminNotice);

			setNotices((current) => [notice, ...current]);
			setForm(emptyNoticeForm());
			setShowCreatePanel(false);
			toast.success("In-app notice saved.");
		} catch (error) {
			toast.error({
				title: "Notice save failed",
				description:
					error instanceof Error
						? error.message
						: "Check the notice details and try again.",
			});
		} finally {
			setIsSavingNotice(false);
		}
	}

	async function patchNotice(
		noticeId: string,
		patch: Partial<AdminNotice>,
		message: string,
	) {
		if (!canUpdateSettings) {
			toast.error("You do not have permission to update notices.");
			return;
		}

		try {
			const response = await fetch(`/api/notifications/${encodeURIComponent(noticeId)}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...patch,
					status: patch.status === "expired" ? "archived" : patch.status,
				}),
			});
			const payload = (await response.json().catch(() => null)) as
				| { error?: string; notification?: AppNotification }
				| null;

			if (!response.ok) {
				throw new Error(payload?.error ?? "Unable to update notice.");
			}

			const updatedNotice = payload?.notification
				? mapNotificationToAdminNotice(payload.notification, actorName)
				: null;

			setNotices((current) =>
				current.map((notice) =>
					notice.id === noticeId
						? (updatedNotice ?? {
								...notice,
								...patch,
								updatedAt: new Date().toISOString(),
							})
						: notice,
				),
			);
			toast.success(message);
		} catch (error) {
			toast.error({
				title: "Notice update failed",
				description:
					error instanceof Error
						? error.message
						: "Unable to update this notice.",
			});
		}
	}

	async function duplicateNotice(notice: AdminNotice) {
		if (!canCreateNotice) {
			toast.error("You do not have permission to duplicate notices.");
			return;
		}

		const duplicateForm: NoticeForm = {
			title: `${notice.title} copy`,
			message: notice.message,
			audience: notice.audience,
			severity: notice.severity,
			status: "draft",
			startAt: notice.startAt,
			endAt: notice.endAt,
		};

		try {
			const response = await fetch("/api/notifications", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					scope: "college",
					collegeSlug,
					...duplicateForm,
				}),
			});
			const payload = (await response.json().catch(() => null)) as
				| { error?: string; notification?: AppNotification }
				| null;

			if (!response.ok) {
				throw new Error(payload?.error ?? "Unable to duplicate notice.");
			}

			if (payload?.notification) {
				setNotices((current) => [
					mapNotificationToAdminNotice(payload.notification!, actorName),
					...current,
				]);
			}
			toast.success("Notice duplicated as draft.");
		} catch (error) {
			toast.error({
				title: "Duplicate failed",
				description:
					error instanceof Error
						? error.message
						: "Unable to duplicate this notice.",
			});
		}
	}

	return (
		<section className="space-y-5">
			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							Notice Analytics
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							{collegeName} in-app notifications
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#556987]">
							Manage persisted tenant notices for students and staff. This
							screen is scoped to this college.
						</p>
					</div>
					<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef4fb] text-[#2E86C1]">
						<BellRing className="size-5" />
					</div>
				</div>

				<div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{statCards.map(({ label, value, icon: StatIcon }) => {
						return (
							<div
								key={label}
								className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4"
							>
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
											{label}
										</p>
										<p className="mt-2 text-3xl font-black text-[#0D2B55]">
											{value}
										</p>
									</div>
									<div className="flex size-10 items-center justify-center rounded-2xl bg-white text-[#2E86C1]">
										<StatIcon className="size-4" />
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-4 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
						<Filter className="size-4" />
						Filters
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={clearFilters}
							className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#d3dfed] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
						>
							Reset filters
						</button>
						<button
							type="button"
							onClick={() => setShowCreatePanel((current) => !current)}
							disabled={!canCreateNotice}
							className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-4 text-xs font-black uppercase tracking-[0.12em] text-white shadow-[0_12px_24px_rgba(13,43,85,0.16)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<Plus className="size-4" />
							Create notice
						</button>
					</div>
				</div>

				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
					<label className="relative xl:col-span-2">
						<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
						<input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search title, message, creator"
							className="h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] pl-11 pr-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>
					<select value={status} onChange={(event) => setStatus(event.target.value as NoticeStatus | "all")} className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]">
						<option value="all">All status</option>
						{Object.entries(STATUS_LABELS).map(([value, label]) => (
							<option key={value} value={value}>{label}</option>
						))}
					</select>
					<select value={audience} onChange={(event) => setAudience(event.target.value as NoticeAudience | "all")} className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]">
						<option value="all">All audience</option>
						{Object.entries(AUDIENCE_LABELS).map(([value, label]) => (
							<option key={value} value={value}>{label}</option>
						))}
					</select>
					<select value={severity} onChange={(event) => setSeverity(event.target.value as NoticeSeverity | "all")} className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]">
						<option value="all">All severity</option>
						{Object.entries(SEVERITY_LABELS).map(([value, label]) => (
							<option key={value} value={value}>{label}</option>
						))}
					</select>
				</div>
			</div>

			{showCreatePanel ? (
				<div className="fixed inset-0 z-50 flex items-end justify-center bg-[#06172f]/60 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-6">
					<div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-[#d7e2f0] bg-white shadow-[0_26px_70px_rgba(6,24,58,0.28)]">
						<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#f8fbff] px-4 py-4 sm:px-6">
							<div>
								<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
									Create App Notification
								</p>
								<h2 className="mt-2 text-xl font-black text-[#06183A] sm:text-2xl">
									New in-app notice
								</h2>
							</div>
							<button
								type="button"
								onClick={() => setShowCreatePanel(false)}
								className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#d3dfed] bg-white text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
								aria-label="Close create notice modal"
							>
								<X className="size-4" />
							</button>
						</div>
						<div className="max-h-[calc(92vh-8rem)] overflow-y-auto px-4 py-5 sm:px-6">
							<div className="grid gap-4 xl:grid-cols-2">
								<FieldLabel label="Title">
									<input
										value={form.title}
										onChange={(event) => updateForm("title", event.target.value)}
										placeholder="Portal notice title"
										className={inputClassName()}
									/>
								</FieldLabel>
								<div className="grid gap-4 sm:grid-cols-3">
									<FieldLabel label="Audience">
										<select value={form.audience} onChange={(event) => updateForm("audience", event.target.value as NoticeAudience)} className={inputClassName()}>
											{Object.entries(AUDIENCE_LABELS).map(([value, label]) => (
												<option key={value} value={value}>{label}</option>
											))}
										</select>
									</FieldLabel>
									<FieldLabel label="Severity">
										<select value={form.severity} onChange={(event) => updateForm("severity", event.target.value as NoticeSeverity)} className={inputClassName()}>
											{Object.entries(SEVERITY_LABELS).map(([value, label]) => (
												<option key={value} value={value}>{label}</option>
											))}
										</select>
									</FieldLabel>
									<FieldLabel label="Status">
										<select value={form.status} onChange={(event) => updateForm("status", event.target.value as NoticeStatus)} className={inputClassName()}>
											{Object.entries(STATUS_LABELS).map(([value, label]) => (
												<option key={value} value={value}>{label}</option>
											))}
										</select>
									</FieldLabel>
								</div>
								<FieldLabel label="Message">
									<textarea
										value={form.message}
										onChange={(event) => updateForm("message", event.target.value)}
										placeholder="Write the notice students or staff will see in-app."
										className={textareaClassName()}
									/>
								</FieldLabel>
								<div className="grid gap-4 sm:grid-cols-2">
									<FieldLabel label="Start">
										<input type="datetime-local" value={form.startAt} onChange={(event) => updateForm("startAt", event.target.value)} className={inputClassName()} />
									</FieldLabel>
									<FieldLabel label="End">
										<input type="datetime-local" value={form.endAt} onChange={(event) => updateForm("endAt", event.target.value)} className={inputClassName()} />
									</FieldLabel>
								</div>
							</div>
						</div>
						<div className="flex justify-end border-t border-[#dbe5f1] bg-white px-4 py-4 sm:px-6">
							<button
								type="button"
								onClick={createNotice}
								disabled={isSavingNotice}
								className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
							>
								<Send className="size-4" />
								{isSavingNotice ? "Saving notice..." : "Save notice"}
							</button>
						</div>
					</div>
				</div>
			) : null}

			<div className="grid gap-5 xl:grid-cols-[22rem_minmax(0,1fr)]">
				<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
					<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
						Recent Notices
					</p>
					<h2 className="mt-2 text-xl font-black text-[#06183A]">
						Created by you
					</h2>
					<div className="mt-4 space-y-3">
						{recentNotices.length ? (
							recentNotices.map((notice) => (
								<button
									key={notice.id}
									type="button"
									onClick={() => setViewNotice(notice)}
									className="block w-full rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4 text-left transition hover:border-[#B7770D] hover:bg-white"
								>
									<div className="flex items-start justify-between gap-3">
										<p className="text-sm font-black text-[#0D2B55]">
											{notice.title}
										</p>
										<Badge className={statusStyles[notice.status]}>
											{STATUS_LABELS[notice.status]}
										</Badge>
									</div>
									<p className="mt-2 line-clamp-2 text-sm leading-6 text-[#60728f]">
										{notice.message}
									</p>
								</button>
							))
						) : (
							<p className="rounded-2xl border border-dashed border-[#dbe5f1] p-4 text-sm font-semibold text-[#60728f]">
								No notices created by this admin yet.
							</p>
						)}
					</div>
				</div>

				<div className="overflow-hidden rounded-3xl border border-[#d7e2f0] bg-white shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe5f1] px-4 py-4 sm:px-5">
						<div>
							<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
								Notice Center
							</p>
							<p className="mt-1 text-sm font-semibold text-[#60728f]">
								{isLoadingNotices
									? "Loading notices"
									: `Showing ${filteredNotices.length} of ${notices.length} notices`}
							</p>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[900px] border-collapse text-left">
							<thead className="bg-[#f8fbff]">
								<tr className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
									<th className="px-5 py-4">Notice</th>
									<th className="px-5 py-4">Audience</th>
									<th className="px-5 py-4">Severity</th>
									<th className="px-5 py-4">Status</th>
									<th className="px-5 py-4">Schedule</th>
									<th className="px-5 py-4 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-[#dbe5f1]">
								{filteredNotices.map((notice) => (
									<tr key={notice.id} className="bg-white transition hover:bg-[#f8fbff]">
										<td className="px-5 py-4">
											<p className="max-w-[20rem] font-black text-[#06183A]">
												{notice.title}
											</p>
											<p className="mt-1 max-w-[24rem] line-clamp-2 text-sm leading-6 text-[#60728f]">
												{notice.message}
											</p>
											<p className="mt-2 text-xs font-bold text-[#8395AF]">
												By {notice.createdBy}
											</p>
										</td>
										<td className="px-5 py-4 text-sm font-black text-[#0D2B55]">
											{AUDIENCE_LABELS[notice.audience]}
										</td>
										<td className="px-5 py-4">
											<Badge className={severityStyles[notice.severity]}>
												{SEVERITY_LABELS[notice.severity]}
											</Badge>
										</td>
										<td className="px-5 py-4">
											<Badge className={statusStyles[notice.status]}>
												{STATUS_LABELS[notice.status]}
											</Badge>
										</td>
										<td className="px-5 py-4">
											<p className="text-sm font-bold text-[#0D2B55]">
												{formatDateTime(notice.startAt)}
											</p>
											<p className="mt-1 text-xs font-semibold text-[#60728f]">
												to {formatDateTime(notice.endAt)}
											</p>
										</td>
										<td className="px-5 py-4">
											<RowActionMenu
												label={`Open actions for ${notice.title}`}
												open={openActionsId === notice.id}
												onOpenChange={(open) =>
													setOpenActionsId(open ? notice.id : null)
												}
												items={[
													{
														label: "View",
														icon: <Eye className="size-4" />,
														onSelect: () => setViewNotice(notice),
													},
													{
														label: "Publish",
														icon: <Send className="size-4" />,
														disabled: notice.status === "active" || !canUpdateSettings,
														onSelect: () =>
															patchNotice(
																notice.id,
																{ status: "active" },
																"Notice published.",
															),
													},
													{
														label: "Duplicate",
														icon: <Copy className="size-4" />,
														disabled: !canCreateNotice,
														onSelect: () => duplicateNotice(notice),
													},
													{
														label: "Archive",
														icon: <Archive className="size-4" />,
														disabled: notice.status === "expired" || !canUpdateSettings,
														className: "text-red-700 hover:bg-red-50",
														onSelect: () =>
															patchNotice(
																notice.id,
																{ status: "expired" },
																"Notice archived.",
															),
													},
												]}
											/>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{filteredNotices.length === 0 ? (
						<div className="border-t border-[#dbe5f1] p-8 text-center">
							<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eef4fb] text-[#2E86C1]">
								<BellRing className="size-6" />
							</div>
							<h3 className="mt-4 text-lg font-black text-[#06183A]">
								{isLoadingNotices ? "Loading notices" : "No notices found"}
							</h3>
							<p className="mt-2 text-sm text-[#60728f]">
								{isLoadingNotices
									? "Fetching persisted in-app notifications for this college."
									: "Adjust filters or create a new in-app notice for this college."}
							</p>
						</div>
					) : null}
				</div>
			</div>

			{viewNotice ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
					<div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
						<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
							<div>
								<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
									Notice Preview
								</p>
								<h2 className="mt-2 text-xl font-black sm:text-2xl">
									{viewNotice.title}
								</h2>
								<p className="mt-1 text-sm font-semibold text-[#c5d4e8]">
									{AUDIENCE_LABELS[viewNotice.audience]} - {collegeName}
								</p>
							</div>
							<button
								type="button"
								onClick={() => setViewNotice(null)}
								className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#0D2B55]"
								aria-label="Close notice preview"
							>
								<X className="size-5" />
							</button>
						</div>
						<div className="p-5 sm:p-6">
							<div className="flex flex-wrap gap-2">
								<Badge className={statusStyles[viewNotice.status]}>
									{STATUS_LABELS[viewNotice.status]}
								</Badge>
								<Badge className={severityStyles[viewNotice.severity]}>
									{SEVERITY_LABELS[viewNotice.severity]}
								</Badge>
							</div>
							<p className="mt-5 text-base leading-8 text-[#0D2B55]">
								{viewNotice.message}
							</p>
							<div className="mt-5 grid gap-3 sm:grid-cols-2">
								<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
									<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
										Start
									</p>
									<p className="mt-2 text-sm font-black text-[#0D2B55]">
										{formatDateTime(viewNotice.startAt)}
									</p>
								</div>
								<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
									<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
										End
									</p>
									<p className="mt-2 text-sm font-black text-[#0D2B55]">
										{formatDateTime(viewNotice.endAt)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			) : null}
		</section>
	);
}
