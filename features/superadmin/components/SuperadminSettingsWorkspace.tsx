"use client";

import {
	AlertTriangle,
	BellRing,
	CalendarClock,
	CheckCircle2,
	Eye,
	EyeOff,
	KeyRound,
	Megaphone,
	RefreshCcw,
	Save,
	ShieldCheck,
	SlidersHorizontal,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
	MaintenanceWindow,
	PlatformNotice,
	PlatformNoticeAudience,
	PlatformNoticeSeverity,
	PlatformNoticeStatus,
	PlatformSettings,
} from "@/lib/services/superadmin-settings.service";
import type {
	AppNotification,
	AppNotificationListPayload,
} from "@/lib/services/notification.service";
import { toast } from "@/lib/toast";

type NoticeForm = {
	title: string;
	message: string;
	audience: PlatformNoticeAudience;
	severity: PlatformNoticeSeverity;
	status: PlatformNoticeStatus;
	startAt: string;
	endAt: string;
};

type PasswordForm = {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
};

type SuperadminSettingsWorkspaceProps = {
	initialSettings: PlatformSettings;
	actorName: string;
};

const DEFAULT_NOTICE_START_AT = "2026-06-16T09:00";
const DEFAULT_NOTICE_END_AT = "2026-06-17T09:00";

const severityStyles = {
	info: "border-blue-200 bg-blue-50 text-blue-700",
	success: "border-emerald-200 bg-emerald-50 text-emerald-700",
	warning: "border-amber-200 bg-amber-50 text-amber-700",
	critical: "border-red-200 bg-red-50 text-red-700",
} satisfies Record<PlatformNoticeSeverity, string>;

const statusStyles = {
	draft: "border-slate-200 bg-slate-50 text-slate-700",
	scheduled: "border-blue-200 bg-blue-50 text-blue-700",
	active: "border-emerald-200 bg-emerald-50 text-emerald-700",
	expired: "border-slate-200 bg-slate-50 text-slate-500",
} satisfies Record<PlatformNoticeStatus, string>;

function formatDateTime(value: string) {
	if (!value) {
		return "Not scheduled";
	}

	return new Intl.DateTimeFormat("en-NG", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

function createNoticeForm(settings: PlatformSettings): NoticeForm {
	const firstDraft = settings.notices.find((notice) => notice.status === "draft");
	const source = firstDraft ?? settings.notices[0];

	return {
		title: source?.title ?? "",
		message: source?.message ?? "",
		audience: source?.audience ?? "all",
		severity: source?.severity ?? "info",
		status: "draft",
		startAt: source?.startAt ?? DEFAULT_NOTICE_START_AT,
		endAt: source?.endAt ?? DEFAULT_NOTICE_END_AT,
	};
}

function mapNotificationToPlatformNotice(
	notification: AppNotification,
	fallbackActor: string,
): PlatformNotice {
	return {
		id: notification.id,
		title: notification.title,
		message: notification.message,
		audience:
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

function createIdempotencyKey(form: NoticeForm) {
	return [
		"platform-notice",
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

function SettingsCard({
	children,
	className = "",
	description,
	icon,
	kicker,
	title,
}: {
	children: React.ReactNode;
	className?: string;
	description: string;
	icon: React.ReactNode;
	kicker: string;
	title: string;
}) {
	return (
		<section
			className={`rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6 ${className}`}
		>
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
						{kicker}
					</p>
					<h2 className="mt-2 text-2xl font-black text-[#06183A]">
						{title}
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-7 text-[#556987]">
						{description}
					</p>
				</div>
				<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef4fb] text-[#2E86C1]">
					{icon}
				</div>
			</div>
			{children}
		</section>
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

function PasswordInput({
	onChange,
	placeholder,
	value,
	visible,
}: {
	onChange: (value: string) => void;
	placeholder: string;
	value: string;
	visible: boolean;
}) {
	return (
		<input
			value={value}
			onChange={(event) => onChange(event.target.value)}
			type={visible ? "text" : "password"}
			placeholder={placeholder}
			className={`${inputClassName()} pr-12`}
		/>
	);
}

function Badge({
	children,
	className,
}: {
	children: React.ReactNode;
	className: string;
}) {
	return (
		<span className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${className}`}>
			{children}
		</span>
	);
}

export function SuperadminSettingsWorkspace({
	initialSettings,
	actorName,
}: SuperadminSettingsWorkspaceProps) {
	const [settings, setSettings] = useState(initialSettings);
	const [noticeForm, setNoticeForm] = useState<NoticeForm>(() =>
		createNoticeForm(initialSettings),
	);
	const [maintenance, setMaintenance] = useState<MaintenanceWindow>(
		initialSettings.maintenance,
	);
	const [passwordForm, setPasswordForm] = useState<PasswordForm>({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [showNoticeModal, setShowNoticeModal] = useState(false);
	const [isSavingPassword, setIsSavingPassword] = useState(false);
	const [isSavingNotice, setIsSavingNotice] = useState(false);
	const [isLoadingNotices, setIsLoadingNotices] = useState(false);
	const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);

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
						"Unable to load platform notices.",
				);
			}

			const notices = (payload as AppNotificationListPayload).notifications.map(
				(notification) => mapNotificationToPlatformNotice(notification, actorName),
			);

			setSettings((current) => ({ ...current, notices }));
		} catch (error) {
			toast.error({
				title: "Notice load failed",
				description:
					error instanceof Error
						? error.message
						: "Unable to load persisted platform notices.",
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

	const activeNotices = useMemo(
		() => settings.notices.filter((notice) => notice.status === "active").length,
		[settings.notices],
	);
	const scheduledNotices = useMemo(
		() => settings.notices.filter((notice) => notice.status === "scheduled").length,
		[settings.notices],
	);

	function updateNoticeField<K extends keyof NoticeForm>(
		key: K,
		value: NoticeForm[K],
	) {
		setNoticeForm((current) => ({ ...current, [key]: value }));
	}

	function updateMaintenanceField<K extends keyof MaintenanceWindow>(
		key: K,
		value: MaintenanceWindow[K],
	) {
		setMaintenance((current) => ({ ...current, [key]: value }));
	}

	async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsSavingPassword(true);

		try {
			const response = await fetch("/api/superadmin/settings", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "password",
					payload: passwordForm,
				}),
			});
			const payload = (await response.json().catch(() => null)) as
				| { error?: string }
				| null;

			if (!response.ok) {
				throw new Error(payload?.error ?? "Unable to update password.");
			}

			setPasswordForm({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
			toast.success({
				title: "Password updated",
				description: "Your Superadmin password was changed successfully.",
			});
		} catch (error) {
			toast.error({
				title: "Password update failed",
				description:
					error instanceof Error
						? error.message
						: "Check your current password and try again.",
			});
		} finally {
			setIsSavingPassword(false);
		}
	}

	async function handleNoticeSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsSavingNotice(true);

		try {
			const response = await fetch("/api/notifications", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					scope: "platform",
					title: noticeForm.title,
					message: noticeForm.message,
					audience: noticeForm.audience,
					severity: noticeForm.severity,
					status: noticeForm.status,
					startAt: noticeForm.startAt,
					endAt: noticeForm.endAt,
					idempotencyKey: createIdempotencyKey(noticeForm),
				}),
			});
			const payload = (await response.json().catch(() => null)) as
				| { error?: string; notification?: AppNotification }
				| null;

			if (!response.ok) {
				throw new Error(payload?.error ?? "Unable to save notice.");
			}

			const notice = payload?.notification
				? mapNotificationToPlatformNotice(payload.notification, actorName)
				: ({
						...noticeForm,
						id: createIdempotencyKey(noticeForm),
						createdBy: actorName,
						updatedAt: new Date().toISOString(),
					} satisfies PlatformNotice);

			setSettings((current) => ({
				...current,
				notices: [notice, ...current.notices].slice(0, 8),
			}));
			toast.success({
				title: "Notice saved",
				description:
					notice.status === "draft"
						? "Notice draft is ready for review."
						: "Notice is ready for platform delivery.",
			});
			setNoticeForm(createNoticeForm({ ...settings, notices: [notice] }));
			setShowNoticeModal(false);
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

	async function handleMaintenanceSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsSavingMaintenance(true);

		try {
			const response = await fetch("/api/superadmin/settings", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "maintenance",
					payload: maintenance,
				}),
			});
			const payload = (await response.json().catch(() => null)) as
				| { error?: string }
				| null;

			if (!response.ok) {
				throw new Error(payload?.error ?? "Unable to update maintenance.");
			}

			setSettings((current) => ({ ...current, maintenance }));
			toast.info({
				title: maintenance.enabled ? "Maintenance scheduled" : "Maintenance disabled",
				description: maintenance.enabled
					? "Users can be shown this window before the planned downtime."
					: "The platform maintenance banner is currently off.",
			});
		} catch (error) {
			toast.error({
				title: "Maintenance update failed",
				description:
					error instanceof Error
						? error.message
						: "Check the maintenance details and try again.",
			});
		} finally {
			setIsSavingMaintenance(false);
		}
	}

	return (
		<div className="space-y-6">
			<section className="grid gap-4 md:grid-cols-3">
				<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-sm">
					<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8395AF]">
						Published Notices
					</p>
					<p className="mt-3 text-3xl font-black text-[#0D2B55]">
						{activeNotices}
					</p>
					<p className="mt-2 text-sm font-semibold text-[#60728f]">
						Active across selected portal audiences.
					</p>
				</div>
				<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-sm">
					<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8395AF]">
						Scheduled
					</p>
					<p className="mt-3 text-3xl font-black text-[#0D2B55]">
						{scheduledNotices}
					</p>
					<p className="mt-2 text-sm font-semibold text-[#60728f]">
						Ready for future maintenance or admission updates.
					</p>
				</div>
				<div className="rounded-3xl border border-[#d7e2f0] bg-[#0D2B55] p-5 text-white shadow-sm">
					<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
						Maintenance
					</p>
					<p className="mt-3 text-3xl font-black">
						{settings.maintenance.enabled ? "On" : "Off"}
					</p>
					<p className="mt-2 text-sm font-semibold text-[#b8c7dc]">
						Controlled by Superadmin settings only.
					</p>
				</div>
			</section>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_28rem]">
				<div className="space-y-6">
					<SettingsCard
						kicker="Platform Notices"
						title="Create app notification"
						description="Publish or schedule messages for students, staff, college admins, or the full platform."
						icon={<Megaphone className="size-5" />}
					>
						<div className="mt-6 space-y-4">
							<div className="rounded-3xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
								<div className="flex flex-wrap items-center gap-2">
									<Badge className={severityStyles[noticeForm.severity]}>
										{noticeForm.severity}
									</Badge>
									<Badge className={statusStyles[noticeForm.status]}>
										{noticeForm.status}
									</Badge>
									<Badge className="border-[#dbe5f1] bg-white text-[#0D2B55]">
										{noticeForm.audience.replace("-", " ")}
									</Badge>
								</div>
								<h3 className="mt-4 text-lg font-black text-[#06183A]">
									{noticeForm.title || "Notice preview"}
								</h3>
								<p className="mt-2 text-sm font-semibold leading-7 text-[#60728f]">
									{noticeForm.message ||
										"Users will see the notice message here."}
								</p>
							</div>

							<button
								type="button"
								onClick={() => setShowNoticeModal(true)}
								className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_14px_26px_rgba(13,43,85,0.24)] transition hover:bg-[#123a73] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
							>
								<Megaphone className="size-4" />
								Create notice
							</button>
						</div>
					</SettingsCard>

					<SettingsCard
						kicker="Maintenance Control"
						title="Schedule maintenance window"
						description="Prepare platform downtime messaging before users are affected. This will connect to public banners and guards in the next persistence slice."
						icon={<CalendarClock className="size-5" />}
					>
						<form className="mt-6 space-y-4" onSubmit={handleMaintenanceSubmit}>
							<div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
								<div className="flex items-center gap-3">
									<div
										className={`flex size-11 items-center justify-center rounded-full ${
											maintenance.enabled
												? "bg-emerald-50 text-emerald-700"
												: "bg-slate-100 text-slate-600"
										}`}
									>
										<SlidersHorizontal className="size-5" />
									</div>
									<div>
										<p className="text-sm font-black text-[#0D2B55]">
											Maintenance mode
										</p>
										<p className="text-xs font-semibold text-[#60728f]">
											{maintenance.enabled
												? "Window messaging is enabled."
												: "No platform maintenance banner is active."}
										</p>
									</div>
								</div>
								<button
									type="button"
									onClick={() =>
										updateMaintenanceField("enabled", !maintenance.enabled)
									}
									className={`h-11 rounded-full px-5 text-sm font-black transition ${
										maintenance.enabled
											? "bg-[#0D2B55] text-white"
											: "border border-[#cbd9ec] bg-white text-[#0D2B55]"
									}`}
								>
									{maintenance.enabled ? "Enabled" : "Disabled"}
								</button>
							</div>

							<FieldLabel label="Title">
								<input
									value={maintenance.title}
									onChange={(event) =>
										updateMaintenanceField("title", event.target.value)
									}
									className={inputClassName()}
								/>
							</FieldLabel>
							<FieldLabel label="Message">
								<textarea
									value={maintenance.message}
									onChange={(event) =>
										updateMaintenanceField("message", event.target.value)
									}
									className={textareaClassName()}
								/>
							</FieldLabel>

							<div className="grid gap-4 md:grid-cols-3">
								<FieldLabel label="Start">
									<input
										value={maintenance.startAt}
										onChange={(event) =>
											updateMaintenanceField("startAt", event.target.value)
										}
										type="datetime-local"
										className={inputClassName()}
									/>
								</FieldLabel>
								<FieldLabel label="End">
									<input
										value={maintenance.endAt}
										onChange={(event) =>
											updateMaintenanceField("endAt", event.target.value)
										}
										type="datetime-local"
										className={inputClassName()}
									/>
								</FieldLabel>
								<FieldLabel label="Impact">
									<select
										value={maintenance.impact}
										onChange={(event) =>
											updateMaintenanceField(
												"impact",
												event.target.value as MaintenanceWindow["impact"],
											)
										}
										className={inputClassName()}
									>
										<option value="low">Low</option>
										<option value="medium">Medium</option>
										<option value="high">High</option>
									</select>
								</FieldLabel>
							</div>

							<button
								type="submit"
								disabled={isSavingMaintenance}
								className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_14px_26px_rgba(13,43,85,0.24)] transition hover:bg-[#123a73] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
							>
								<CalendarClock className="size-4" />
								{isSavingMaintenance ? "Saving window..." : "Save maintenance"}
							</button>
						</form>
					</SettingsCard>
				</div>

				<aside className="space-y-6">
					<SettingsCard
						kicker="Security"
						title="Change password"
						description="Use the same portal password rules used across registration and reset flows."
						icon={<KeyRound className="size-5" />}
					>
						<form className="mt-6 space-y-4" onSubmit={handlePasswordSubmit}>
							<FieldLabel label="Current Password">
								<div className="relative">
									<PasswordInput
										value={passwordForm.currentPassword}
										onChange={(value) =>
											setPasswordForm((current) => ({
												...current,
												currentPassword: value,
											}))
										}
										placeholder="Current password"
										visible={showPassword}
									/>
								</div>
							</FieldLabel>
							<FieldLabel label="New Password">
								<div className="relative">
									<PasswordInput
										value={passwordForm.newPassword}
										onChange={(value) =>
											setPasswordForm((current) => ({
												...current,
												newPassword: value,
											}))
										}
										placeholder="New password"
										visible={showPassword}
									/>
								</div>
							</FieldLabel>
							<FieldLabel label="Confirm Password">
								<div className="relative">
									<PasswordInput
										value={passwordForm.confirmPassword}
										onChange={(value) =>
											setPasswordForm((current) => ({
												...current,
												confirmPassword: value,
											}))
										}
										placeholder="Confirm new password"
										visible={showPassword}
									/>
									<button
										type="button"
										onClick={() => setShowPassword((current) => !current)}
										className="absolute right-3 top-1/2 mt-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[#42618a] transition hover:bg-white"
										aria-label={
											showPassword ? "Hide password" : "Show password"
										}
									>
										{showPassword ? (
											<EyeOff className="size-4" />
										) : (
											<Eye className="size-4" />
										)}
									</button>
								</div>
							</FieldLabel>

							<div className="rounded-3xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
								<p className="text-sm font-black text-[#0D2B55]">
									Password policy
								</p>
								<div className="mt-3 space-y-2 text-xs font-semibold text-[#60728f]">
									<p className="flex items-center gap-2">
										<CheckCircle2 className="size-4 text-emerald-600" />
										8-15 characters
									</p>
									<p className="flex items-center gap-2">
										<CheckCircle2 className="size-4 text-emerald-600" />
										At least one uppercase letter
									</p>
									<p className="flex items-center gap-2">
										<CheckCircle2 className="size-4 text-emerald-600" />
										At least one number and one special character
									</p>
								</div>
							</div>

							<button
								type="submit"
								disabled={isSavingPassword}
								className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_14px_26px_rgba(13,43,85,0.24)] transition hover:bg-[#123a73] disabled:cursor-not-allowed disabled:opacity-60"
							>
								<ShieldCheck className="size-4" />
								{isSavingPassword ? "Updating..." : "Update password"}
							</button>
						</form>
					</SettingsCard>

					<SettingsCard
						kicker="Notice Center"
						title="Recent notices"
						description="Persisted platform notifications that can appear in user notification bells."
						icon={<BellRing className="size-5" />}
					>
						<div className="mt-6 space-y-3">
							{isLoadingNotices ? (
								<p className="rounded-2xl border border-dashed border-[#dbe5f1] p-4 text-sm font-semibold text-[#60728f]">
									Loading platform notices...
								</p>
							) : settings.notices.length ? (
								settings.notices.map((notice) => (
								<article
									key={notice.id}
									className="rounded-3xl border border-[#dbe5f1] bg-[#fbfdff] p-4"
								>
									<div className="flex flex-wrap items-center gap-2">
										<Badge className={severityStyles[notice.severity]}>
											{notice.severity}
										</Badge>
										<Badge className={statusStyles[notice.status]}>
											{notice.status}
										</Badge>
									</div>
									<h3 className="mt-3 text-base font-black text-[#06183A]">
										{notice.title}
									</h3>
									<p className="mt-2 text-sm font-semibold leading-6 text-[#60728f]">
										{notice.message}
									</p>
									<p className="mt-3 text-xs font-bold text-[#8395AF]">
										{formatDateTime(notice.startAt)} - {formatDateTime(notice.endAt)}
									</p>
								</article>
								))
							) : (
								<p className="rounded-2xl border border-dashed border-[#dbe5f1] p-4 text-sm font-semibold text-[#60728f]">
									No persisted platform notices yet.
								</p>
							)}
						</div>
					</SettingsCard>

					<div className="rounded-3xl border border-[#f0d49d] bg-[#fff8eb] p-5 text-[#7a4d04]">
						<div className="flex gap-3">
							<AlertTriangle className="mt-0.5 size-5 shrink-0" />
							<div>
								<p className="text-sm font-black text-[#7a4d04]">
									Production persistence note
								</p>
								<p className="mt-2 text-sm font-semibold leading-6">
									Platform notices now persist through the shared notification
									API. Maintenance windows remain on the settings endpoint.
								</p>
							</div>
						</div>
					</div>

					<button
						type="button"
						onClick={() => {
							setSettings(initialSettings);
							setMaintenance(initialSettings.maintenance);
							setNoticeForm(createNoticeForm(initialSettings));
							void loadNotices();
							toast.info("Settings form reset");
						}}
						className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-[#cbd9ec] bg-white px-5 text-sm font-black text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
					>
						<RefreshCcw className="size-4" />
						Reset settings form
					</button>
				</aside>
			</div>

			{showNoticeModal ? (
				<div className="fixed inset-0 z-50 flex items-end justify-center bg-[#06172f]/60 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-6">
					<div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-[#d7e2f0] bg-white shadow-[0_26px_70px_rgba(6,24,58,0.28)]">
						<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#f8fbff] px-4 py-4 sm:px-6">
							<div>
								<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
									Platform Notices
								</p>
								<h2 className="mt-2 text-xl font-black text-[#06183A] sm:text-2xl">
									Create app notification
								</h2>
							</div>
							<button
								type="button"
								onClick={() => setShowNoticeModal(false)}
								className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#d3dfed] bg-white text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
								aria-label="Close create notice modal"
							>
								<X className="size-4" />
							</button>
						</div>

						<form onSubmit={handleNoticeSubmit}>
							<div className="max-h-[calc(92vh-8rem)] space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
								<div className="grid gap-4 xl:grid-cols-2">
									<FieldLabel label="Title">
										<input
											value={noticeForm.title}
											onChange={(event) =>
												updateNoticeField("title", event.target.value)
											}
											placeholder="Scheduled maintenance"
											className={inputClassName()}
										/>
									</FieldLabel>

									<div className="grid gap-4 md:grid-cols-3">
										<FieldLabel label="Audience">
											<select
												value={noticeForm.audience}
												onChange={(event) =>
													updateNoticeField(
														"audience",
														event.target.value as PlatformNoticeAudience,
													)
												}
												className={inputClassName()}
											>
												<option value="all">All users</option>
												<option value="students">Students</option>
												<option value="staff">Staff</option>
												<option value="college-admins">College admins</option>
											</select>
										</FieldLabel>
										<FieldLabel label="Severity">
											<select
												value={noticeForm.severity}
												onChange={(event) =>
													updateNoticeField(
														"severity",
														event.target.value as PlatformNoticeSeverity,
													)
												}
												className={inputClassName()}
											>
												<option value="info">Info</option>
												<option value="success">Success</option>
												<option value="warning">Warning</option>
												<option value="critical">Critical</option>
											</select>
										</FieldLabel>
										<FieldLabel label="Status">
											<select
												value={noticeForm.status}
												onChange={(event) =>
													updateNoticeField(
														"status",
														event.target.value as PlatformNoticeStatus,
													)
												}
												className={inputClassName()}
											>
												<option value="draft">Draft</option>
												<option value="scheduled">Scheduled</option>
												<option value="active">Active</option>
											</select>
										</FieldLabel>
									</div>
								</div>

								<FieldLabel label="Message">
									<textarea
										value={noticeForm.message}
										onChange={(event) =>
											updateNoticeField("message", event.target.value)
										}
										placeholder="Portal maintenance will run from 1 Aug to 15 Aug."
										className={textareaClassName()}
									/>
								</FieldLabel>

								<div className="grid gap-4 md:grid-cols-2">
									<FieldLabel label="Start">
										<input
											value={noticeForm.startAt}
											onChange={(event) =>
												updateNoticeField("startAt", event.target.value)
											}
											type="datetime-local"
											className={inputClassName()}
										/>
									</FieldLabel>
									<FieldLabel label="End">
										<input
											value={noticeForm.endAt}
											onChange={(event) =>
												updateNoticeField("endAt", event.target.value)
											}
											type="datetime-local"
											className={inputClassName()}
										/>
									</FieldLabel>
								</div>

								<div className="rounded-3xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
									<div className="flex flex-wrap items-center gap-2">
										<Badge className={severityStyles[noticeForm.severity]}>
											{noticeForm.severity}
										</Badge>
										<Badge className={statusStyles[noticeForm.status]}>
											{noticeForm.status}
										</Badge>
										<Badge className="border-[#dbe5f1] bg-white text-[#0D2B55]">
											{noticeForm.audience.replace("-", " ")}
										</Badge>
									</div>
									<h3 className="mt-4 text-lg font-black text-[#06183A]">
										{noticeForm.title || "Notice preview"}
									</h3>
									<p className="mt-2 text-sm font-semibold leading-7 text-[#60728f]">
										{noticeForm.message ||
											"Users will see the notice message here."}
									</p>
								</div>
							</div>

							<div className="flex justify-end border-t border-[#dbe5f1] bg-white px-4 py-4 sm:px-6">
								<button
									type="submit"
									disabled={isSavingNotice}
									className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_14px_26px_rgba(13,43,85,0.24)] transition hover:bg-[#123a73] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
								>
									<Save className="size-4" />
									{isSavingNotice ? "Saving notice..." : "Save notice"}
								</button>
							</div>
						</form>
					</div>
				</div>
			) : null}
		</div>
	);
}
