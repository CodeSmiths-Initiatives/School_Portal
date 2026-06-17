"use client";

import {
	Bell,
	CheckCheck,
	Filter,
	Loader2,
	Search,
	ShieldAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
	AppNotification,
	AppNotificationListPayload,
	AppNotificationSeverity,
} from "@/lib/services/notification.service";

type NoticeCenterWorkspaceProps = {
	title: string;
	subtitle: string;
};

type ReadFilter = "all" | "unread" | "read";
type SeverityFilter = AppNotificationSeverity | "all";

const severityStyles = {
	info: "border-blue-200 bg-blue-50 text-blue-700",
	success: "border-emerald-200 bg-emerald-50 text-emerald-700",
	warning: "border-amber-200 bg-amber-50 text-amber-700",
	critical: "border-red-200 bg-red-50 text-red-700",
} satisfies Record<AppNotificationSeverity, string>;

function formatDate(value: string | null) {
	if (!value) return "Not scheduled";

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Not scheduled";

	return new Intl.DateTimeFormat("en-NG", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(date);
}

function Badge({
	children,
	className,
}: {
	children: React.ReactNode;
	className: string;
}) {
	return (
		<span
			className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${className}`}
		>
			{children}
		</span>
	);
}

export function NoticeCenterWorkspace({
	title,
	subtitle,
}: NoticeCenterWorkspaceProps) {
	const [payload, setPayload] = useState<AppNotificationListPayload>({
		notifications: [],
		meta: {
			page: 1,
			pageSize: 12,
			pageCount: 1,
			total: 0,
			unread: 0,
			critical: 0,
			generatedAt: new Date().toISOString(),
		},
	});
	const [isLoading, setIsLoading] = useState(false);
	const [isMarkingAll, setIsMarkingAll] = useState(false);
	const [error, setError] = useState("");
	const [query, setQuery] = useState("");
	const [severity, setSeverity] = useState<SeverityFilter>("all");
	const [readFilter, setReadFilter] = useState<ReadFilter>("all");
	const [page, setPage] = useState(1);
	const pageSize = 12;

	const loadNotices = useCallback(async () => {
		setIsLoading(true);
		setError("");

		try {
			const params = new URLSearchParams({
				page: String(page),
				pageSize: String(pageSize),
			});

			if (query.trim()) params.set("q", query.trim());
			if (severity !== "all") params.set("severity", severity);
			if (readFilter !== "all") params.set("readState", readFilter);

			const response = await fetch(`/api/notifications?${params.toString()}`, {
				cache: "no-store",
			});
			const nextPayload = (await response.json().catch(() => null)) as
				| AppNotificationListPayload
				| { error?: string }
				| null;

			if (!response.ok) {
				throw new Error(
					(nextPayload as { error?: string } | null)?.error ??
						"Unable to load notices.",
				);
			}

			const typedPayload = nextPayload as AppNotificationListPayload;
			setPayload(typedPayload);
			if (typedPayload.meta.page !== page) {
				setPage(typedPayload.meta.page);
			}
		} catch (loadError) {
			setError(
				loadError instanceof Error ? loadError.message : "Unable to load notices.",
			);
		} finally {
			setIsLoading(false);
		}
	}, [page, query, readFilter, severity]);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			void loadNotices();
		}, 0);

		return () => window.clearTimeout(timeoutId);
	}, [loadNotices]);

	const analytics = useMemo(
		() => ({
			total: payload.meta.total,
			unread: payload.meta.unread,
			critical: payload.meta.critical,
			filtered: payload.notifications.length,
		}),
		[payload.meta.critical, payload.meta.total, payload.meta.unread, payload.notifications.length],
	);
	const statCards = [
		{ label: "Total Notices", value: analytics.total, icon: Bell },
		{ label: "Unread", value: analytics.unread, icon: CheckCheck },
		{ label: "Critical", value: analytics.critical, icon: ShieldAlert },
		{ label: "Showing", value: analytics.filtered, icon: Filter },
	] satisfies Array<{ label: string; value: number; icon: LucideIcon }>;

	function clearFilters() {
		setQuery("");
		setSeverity("all");
		setReadFilter("all");
		setPage(1);
	}

	async function markRead(notification: AppNotification) {
		if (notification.isRead) return;

		setPayload((current) => ({
			...current,
			notifications: current.notifications.map((item) =>
				item.id === notification.id ? { ...item, isRead: true } : item,
			),
			meta: {
				...current.meta,
				unread: Math.max(current.meta.unread - 1, 0),
			},
		}));

		const response = await fetch(
			`/api/notifications/${encodeURIComponent(notification.id)}/read`,
			{ method: "POST" },
		).catch(() => null);

		if (!response?.ok) {
			void loadNotices();
		}
	}

	async function markAllRead() {
		if (!payload.meta.unread || isMarkingAll) return;

		setIsMarkingAll(true);

		try {
			const response = await fetch("/api/notifications/read-all", {
				method: "POST",
			});

			if (!response.ok) {
				throw new Error("Unable to mark notices read.");
			}

			setPayload((current) => ({
				...current,
				notifications: current.notifications.map((notice) => ({
					...notice,
					isRead: true,
				})),
				meta: { ...current.meta, unread: 0 },
			}));
		} catch {
			void loadNotices();
		} finally {
			setIsMarkingAll(false);
		}
	}

	return (
		<div className="space-y-5">
			<section className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
							Notice Center
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							{title}
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#60728f]">
							{subtitle}
						</p>
					</div>
					<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef4fb] text-[#2E86C1]">
						<Bell className="size-5" />
					</div>
				</div>

				<div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{statCards.map(({ label, value, icon: Icon }) => (
						<div
							key={label}
							className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4"
						>
							<div className="flex items-center justify-between gap-3">
								<div>
									<p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8395AF]">
										{label}
									</p>
									<p className="mt-2 text-3xl font-black text-[#0D2B55]">
										{value}
									</p>
								</div>
								<div className="flex size-10 items-center justify-center rounded-2xl bg-white text-[#2E86C1]">
									<Icon className="size-4" />
								</div>
							</div>
						</div>
					))}
				</div>
			</section>

			<section className="rounded-2xl border border-[#dbe5f1] bg-white p-4 shadow-sm sm:p-5">
				<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]">
					<label className="relative">
						<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
						<input
							value={query}
							onChange={(event) => {
								setQuery(event.target.value);
								setPage(1);
							}}
							placeholder="Search notices"
							className="h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] pl-11 pr-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>
					<select
						value={severity}
						onChange={(event) => {
							setSeverity(event.target.value as SeverityFilter);
							setPage(1);
						}}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="all">All severity</option>
						<option value="info">Info</option>
						<option value="success">Success</option>
						<option value="warning">Warning</option>
						<option value="critical">Critical</option>
					</select>
					<select
						value={readFilter}
						onChange={(event) => {
							setReadFilter(event.target.value as ReadFilter);
							setPage(1);
						}}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="all">All read states</option>
						<option value="unread">Unread</option>
						<option value="read">Read</option>
					</select>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={clearFilters}
							className="h-12 rounded-2xl border border-[#d3dfed] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
						>
							Reset
						</button>
						<button
							type="button"
							onClick={markAllRead}
							disabled={!payload.meta.unread || isMarkingAll}
							className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#123a73] disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isMarkingAll ? <Loader2 className="size-4 animate-spin" /> : null}
							Read all
						</button>
					</div>
				</div>
			</section>

			<section className="overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white shadow-sm">
				<div className="hidden overflow-x-auto lg:block">
					<table className="w-full min-w-[860px] border-collapse text-left">
						<thead className="bg-[#f8fbff]">
							<tr className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
								<th className="px-5 py-4">Notice</th>
								<th className="px-5 py-4">Severity</th>
								<th className="px-5 py-4">Audience</th>
								<th className="px-5 py-4">Published</th>
								<th className="px-5 py-4">State</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#dbe5f1]">
							{payload.notifications.map((notice) => (
								<tr
									key={notice.id}
									className="bg-white transition hover:bg-[#f8fbff]"
								>
									<td className="px-5 py-4">
										<p className="max-w-xl font-black text-[#06183A]">
											{notice.title}
										</p>
										<p className="mt-1 max-w-2xl text-sm leading-6 text-[#60728f]">
											{notice.message}
										</p>
									</td>
									<td className="px-5 py-4">
										<Badge className={severityStyles[notice.severity]}>
											{notice.severity}
										</Badge>
									</td>
									<td className="px-5 py-4 text-sm font-bold capitalize text-[#0D2B55]">
										{notice.audience.replace("-", " ")}
									</td>
									<td className="px-5 py-4 text-sm font-semibold text-[#60728f]">
										{formatDate(notice.publishedAt ?? notice.startAt)}
									</td>
									<td className="px-5 py-4">
										<button
											type="button"
											onClick={() => markRead(notice)}
											disabled={notice.isRead}
											className="rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#0D2B55] transition hover:border-[#B7770D] disabled:cursor-default disabled:opacity-70"
										>
											{notice.isRead ? "Read" : "Mark read"}
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="space-y-3 p-4 lg:hidden">
					{payload.notifications.map((notice) => (
						<article
							key={notice.id}
							className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4"
						>
							<div className="flex flex-wrap items-center gap-2">
								<Badge className={severityStyles[notice.severity]}>
									{notice.severity}
								</Badge>
								<Badge className="border-[#dbe5f1] bg-white text-[#0D2B55]">
									{notice.isRead ? "Read" : "Unread"}
								</Badge>
							</div>
							<h3 className="mt-3 text-base font-black text-[#06183A]">
								{notice.title}
							</h3>
							<p className="mt-2 text-sm leading-6 text-[#60728f]">
								{notice.message}
							</p>
							<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
								<p className="text-xs font-bold text-[#8395AF]">
									{formatDate(notice.publishedAt ?? notice.startAt)}
								</p>
								<button
									type="button"
									onClick={() => markRead(notice)}
									disabled={notice.isRead}
									className="rounded-full border border-[#dbe5f1] bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#0D2B55] transition hover:border-[#B7770D] disabled:cursor-default disabled:opacity-70"
								>
									{notice.isRead ? "Read" : "Mark read"}
								</button>
							</div>
						</article>
					))}
				</div>

				{payload.notifications.length > 0 ? (
					<div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dbe5f1] bg-[#f8fbff] px-4 py-4 sm:px-5">
						<p className="text-xs font-black uppercase tracking-[0.14em] text-[#60728f]">
							Page {payload.meta.page} of {payload.meta.pageCount} -{" "}
							{payload.meta.total} notices
						</p>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => setPage((current) => Math.max(current - 1, 1))}
								disabled={payload.meta.page <= 1 || isLoading}
								className="h-10 rounded-2xl border border-[#d3dfed] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D] disabled:cursor-not-allowed disabled:opacity-50"
							>
								Previous
							</button>
							<button
								type="button"
								onClick={() =>
									setPage((current) =>
										Math.min(current + 1, payload.meta.pageCount),
									)
								}
								disabled={payload.meta.page >= payload.meta.pageCount || isLoading}
								className="h-10 rounded-2xl border border-[#d3dfed] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D] disabled:cursor-not-allowed disabled:opacity-50"
							>
								Next
							</button>
						</div>
					</div>
				) : null}

				{isLoading || error || payload.notifications.length === 0 ? (
					<div className="border-t border-[#dbe5f1] p-8 text-center">
						<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eef4fb] text-[#2E86C1]">
							{isLoading ? (
								<Loader2 className="size-6 animate-spin" />
							) : (
								<Bell className="size-6" />
							)}
						</div>
						<h3 className="mt-4 text-lg font-black text-[#06183A]">
							{isLoading ? "Loading notices" : error ? "Notice load failed" : "No notices found"}
						</h3>
						<p className="mt-2 text-sm text-[#60728f]">
							{error || "Try adjusting your filters or check back later."}
						</p>
					</div>
				) : null}
			</section>
		</div>
	);
}
