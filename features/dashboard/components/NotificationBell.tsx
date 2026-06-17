"use client";

import { Bell, CheckCheck, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
	AppNotification,
	AppNotificationListPayload,
	AppNotificationSeverity,
} from "@/lib/services/notification.service";

const severityStyles = {
	info: "border-blue-200 bg-blue-50 text-blue-700",
	success: "border-emerald-200 bg-emerald-50 text-emerald-700",
	warning: "border-amber-200 bg-amber-50 text-amber-700",
	critical: "border-red-200 bg-red-50 text-red-700",
} satisfies Record<AppNotificationSeverity, string>;

function formatNoticeDate(value: string | null) {
	if (!value) return "Live";

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Live";

	return new Intl.DateTimeFormat("en-NG", {
		day: "2-digit",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

function NoticeBadge({
	children,
	severity,
}: {
	children: React.ReactNode;
	severity: AppNotificationSeverity;
}) {
	return (
		<span
			className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${severityStyles[severity]}`}
		>
			{children}
		</span>
	);
}

export function NotificationBell() {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isMarkingAll, setIsMarkingAll] = useState(false);
	const [error, setError] = useState("");
	const [payload, setPayload] = useState<AppNotificationListPayload>({
		notifications: [],
		meta: {
			page: 1,
			pageSize: 5,
			pageCount: 1,
			total: 0,
			unread: 0,
			critical: 0,
			generatedAt: new Date().toISOString(),
		},
	});
	const containerRef = useRef<HTMLDivElement | null>(null);
	const unreadCount = payload.meta.unread;
	const countLabel = useMemo(
		() => (unreadCount > 9 ? "9+" : String(unreadCount)),
		[unreadCount],
	);

	const loadNotifications = useCallback(async () => {
		setIsLoading(true);
		setError("");

		try {
			const response = await fetch("/api/notifications?pageSize=5", {
				cache: "no-store",
			});
			const nextPayload = (await response.json().catch(() => null)) as
				| AppNotificationListPayload
				| { error?: string }
				| null;

			if (!response.ok) {
				throw new Error(
					(nextPayload as { error?: string } | null)?.error ??
						"Unable to load notifications.",
				);
			}

			setPayload(nextPayload as AppNotificationListPayload);
		} catch (loadError) {
			setError(
				loadError instanceof Error
					? loadError.message
					: "Unable to load notifications.",
			);
		} finally {
			setIsLoading(false);
		}
	}, []);

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

		await fetch(`/api/notifications/${encodeURIComponent(notification.id)}/read`, {
			method: "POST",
		}).catch(() => {
			void loadNotifications();
		});
	}

	async function markAllRead() {
		if (!unreadCount || isMarkingAll) return;

		setIsMarkingAll(true);

		try {
			const response = await fetch("/api/notifications/read-all", {
				method: "POST",
			});

			if (!response.ok) {
				throw new Error("Unable to mark notifications read.");
			}

			setPayload((current) => ({
				...current,
				notifications: current.notifications.map((notification) => ({
					...notification,
					isRead: true,
				})),
				meta: { ...current.meta, unread: 0 },
			}));
		} catch {
			void loadNotifications();
		} finally {
			setIsMarkingAll(false);
		}
	}

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			void loadNotifications();
		}, 0);

		return () => window.clearTimeout(timeoutId);
	}, [loadNotifications]);

	useEffect(() => {
		if (!isOpen) return;

		function handlePointerDown(event: PointerEvent) {
			if (!containerRef.current?.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}

		document.addEventListener("pointerdown", handlePointerDown);

		return () => document.removeEventListener("pointerdown", handlePointerDown);
	}, [isOpen]);

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={() => setIsOpen((current) => !current)}
				className="relative flex size-11 items-center justify-center rounded-[1.1rem] border border-white/12 bg-white/8 text-white transition hover:bg-white hover:text-[#0D2B55]"
				aria-label="Open notifications"
				aria-expanded={isOpen}
			>
				<Bell className="size-5" />
				{unreadCount ? (
					<span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-[#E4A11B] px-1.5 py-0.5 text-[10px] font-black text-[#0D2B55] shadow-sm">
						{countLabel}
					</span>
				) : null}
			</button>

			{isOpen ? (
				<div className="fixed inset-x-3 top-24 z-[220] max-h-[calc(100dvh-7rem)] overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white text-[#0D2B55] shadow-[0_24px_60px_rgba(6,23,47,0.24)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-14 sm:w-[22rem] sm:max-h-none">
					<div className="flex items-center justify-between gap-3 border-b border-[#dbe5f1] bg-[#f8fbff] px-4 py-3">
						<div>
							<p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B7770D]">
								Notifications
							</p>
							<p className="mt-1 text-xs font-semibold text-[#60728f]">
								{unreadCount} unread of {payload.meta.total}
							</p>
						</div>
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								onClick={markAllRead}
								disabled={!unreadCount || isMarkingAll}
								className="flex size-9 items-center justify-center rounded-full border border-[#dbe5f1] bg-white text-[#2E86C1] transition hover:border-[#B7770D] disabled:cursor-not-allowed disabled:opacity-40"
								aria-label="Mark all notifications as read"
							>
								{isMarkingAll ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<CheckCheck className="size-4" />
								)}
							</button>
							<button
								type="button"
								onClick={() => setIsOpen(false)}
								className="flex size-9 items-center justify-center rounded-full border border-[#dbe5f1] bg-white text-[#60728f] transition hover:border-[#B7770D] hover:text-[#0D2B55]"
								aria-label="Close notifications"
							>
								<X className="size-4" />
							</button>
						</div>
					</div>

					<div className="max-h-[calc(100dvh-12rem)] overflow-y-auto p-3 sm:max-h-[24rem]">
						{isLoading ? (
							<div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[#dbe5f1] p-5 text-sm font-semibold text-[#60728f]">
								<Loader2 className="size-4 animate-spin" />
								Loading notifications
							</div>
						) : error ? (
							<div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
								{error}
							</div>
						) : payload.notifications.length ? (
							<div className="space-y-2">
								{payload.notifications.map((notification) => (
									<button
										key={notification.id}
										type="button"
										onClick={() => markRead(notification)}
										className={`block w-full rounded-2xl border p-3 text-left transition hover:border-[#B7770D] ${
											notification.isRead
												? "border-[#e2eaf4] bg-white"
												: "border-[#c9dff4] bg-[#f2f8ff]"
										}`}
									>
										<div className="flex items-start justify-between gap-3">
											<p className="line-clamp-2 text-sm font-black text-[#06183A]">
												{notification.title}
											</p>
											<NoticeBadge severity={notification.severity}>
												{notification.severity}
											</NoticeBadge>
										</div>
										<p className="mt-2 line-clamp-2 text-sm leading-6 text-[#60728f]">
											{notification.message}
										</p>
										<p className="mt-2 text-xs font-bold text-[#8395AF]">
											{formatNoticeDate(
												notification.publishedAt ?? notification.startAt,
											)}
										</p>
									</button>
								))}
							</div>
						) : (
							<div className="rounded-2xl border border-dashed border-[#dbe5f1] p-5 text-center text-sm font-semibold text-[#60728f]">
								No active notifications.
							</div>
						)}
					</div>
				</div>
			) : null}
		</div>
	);
}
