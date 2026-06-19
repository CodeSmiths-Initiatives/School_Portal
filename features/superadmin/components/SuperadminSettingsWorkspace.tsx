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
  Pencil,
  RefreshCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RowActionMenu } from "@/components/ui/row-action-menu";
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

type SettingsTab = "notifications" | "maintenance";

const severityStyles = {
  info: "border-blue-200 bg-blue-50 text-blue-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
} satisfies Record<PlatformNoticeSeverity, string>;

const statusStyles = {
  draft: "border-slate-200 bg-slate-50 text-slate-700",
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

function dateTimeLocal(daysOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function createNoticeForm(): NoticeForm {
  return {
    title: "",
    message: "",
    audience: "all",
    severity: "info",
    status: "active",
    startAt: dateTimeLocal(),
    endAt: dateTimeLocal(7),
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
    status:
      notification.status === "archived" || notification.status === "expired"
        ? "expired"
        : notification.status === "active"
          ? "active"
          : "draft",
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

function isInvalidMaintenanceRange(maintenance: MaintenanceWindow) {
  if (!maintenance.startAt || !maintenance.endAt) {
    return false;
  }

  return new Date(maintenance.endAt) <= new Date(maintenance.startAt);
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
          <h2 className="mt-2 text-2xl font-black text-[#06183A]">{title}</h2>
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
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${className}`}
    >
      {children}
    </span>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black text-[#0D2B55]">
        {value || "Not provided"}
      </p>
    </div>
  );
}

export function SuperadminSettingsWorkspace({
  initialSettings,
  actorName,
}: SuperadminSettingsWorkspaceProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [noticeForm, setNoticeForm] = useState<NoticeForm>(() =>
    createNoticeForm(),
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
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("notifications");
  const [openActionId, setOpenActionId] = useState("");
  const [viewNotice, setViewNotice] = useState<PlatformNotice | null>(null);
  const [viewMaintenance, setViewMaintenance] =
    useState<MaintenanceWindow | null>(null);
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
        (notification) =>
          mapNotificationToPlatformNotice(notification, actorName),
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
    () =>
      settings.notices.filter((notice) => notice.status === "active").length,
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
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

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
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        notification?: AppNotification;
      } | null;

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
        notices: [notice, ...current.notices],
      }));
      toast.success({
        title: "Notice saved",
        description:
          notice.status === "draft"
            ? "Notice draft is ready for review."
            : "Notice is ready for platform delivery.",
      });
      setNoticeForm(createNoticeForm());
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

  async function handleMaintenanceSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isInvalidMaintenanceRange(maintenance)) {
      toast.error({
        title: "Check maintenance window",
        description: "The maintenance end time must be after the start time.",
      });
      return;
    }

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
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update maintenance.");
      }

      setSettings((current) => ({ ...current, maintenance }));
      setShowMaintenanceModal(false);
      toast.info({
        title: maintenance.enabled
          ? "Maintenance scheduled"
          : "Maintenance disabled",
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

  const criticalNotices = settings.notices.filter(
    (notice) => notice.severity === "critical",
  ).length;
  const maintenanceRangeInvalid = isInvalidMaintenanceRange(maintenance);
  const statCards = [
    { label: "Total notices", value: settings.notices.length, icon: BellRing },
    { label: "Published", value: activeNotices, icon: CheckCircle2 },
    { label: "Critical", value: criticalNotices, icon: AlertTriangle },
  ];
  const maintenanceRows = [settings.maintenance];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8395AF]">
                  {label}
                </p>
                <p className="mt-3 text-3xl font-black text-[#0D2B55]">
                  {value}
                </p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#eef4fb] text-[#2E86C1]">
                <Icon className="size-5" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <SettingsCard
        kicker="Security"
        title="Change password"
        description="Use the same portal password rules used across registration and reset flows."
        icon={<KeyRound className="size-5" />}
      >
        <form className="mt-6 grid gap-4" onSubmit={handlePasswordSubmit}>
          <div className="grid gap-4 md:grid-cols-4">
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </FieldLabel>
            <div className="flex flex-col justify-end">
              <button
                type="submit"
                disabled={isSavingPassword}
                className="inline-flex h-12 items-center justify-center gap-3 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_14px_26px_rgba(13,43,85,0.24)] transition hover:bg-[#123a73] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShieldCheck className="size-4" />
                {isSavingPassword ? "Updating..." : "Update password"}
              </button>
            </div>
          </div>

          {/* <div className="space-y-4">
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
					</div> */}
        </form>
      </SettingsCard>

      <section className="overflow-hidden rounded-3xl border border-[#d7e2f0] bg-white shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe5f1] bg-[#f8fbff] px-4 py-4 sm:px-5">
          <div className="inline-flex rounded-2xl border border-[#d3dfed] bg-white p-1">
            {[
              { key: "notifications", label: "In app notification" },
              { key: "maintenance", label: "Schedule maintenance window" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as SettingsTab)}
                className={`h-10 rounded-xl px-4 text-xs font-black uppercase tracking-[0.12em] transition ${
                  activeTab === tab.key
                    ? "bg-[#0D2B55] text-white"
                    : "text-[#60728f] hover:text-[#0D2B55]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSettings(initialSettings);
                setMaintenance(initialSettings.maintenance);
                setNoticeForm(createNoticeForm());
                void loadNotices();
                toast.info("Settings form reset");
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[#cbd9ec] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
            >
              <RefreshCcw className="size-4" />
              Reset
            </button>
            {activeTab === "notifications" ? (
              <button
                type="button"
                onClick={() => {
                  setNoticeForm(createNoticeForm());
                  setShowNoticeModal(true);
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#123a73]"
              >
                <Megaphone className="size-4" />
                Create notice
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowMaintenanceModal(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#123a73]"
              >
                <CalendarClock className="size-4" />
                Edit window
              </button>
            )}
          </div>
        </div>

        {activeTab === "notifications" ? (
          <div>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[960px] border-collapse text-left">
                <thead className="bg-white">
                  <tr className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
                    <th className="px-5 py-4">Notice</th>
                    <th className="px-5 py-4">Audience</th>
                    <th className="px-5 py-4">Severity</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Window</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbe5f1]">
                  {settings.notices.map((notice) => (
                    <tr
                      key={notice.id}
                      className="transition hover:bg-[#f8fbff]"
                    >
                      <td className="px-5 py-4">
                        <p className="font-black text-[#06183A]">
                          {notice.title}
                        </p>
                        <p className="mt-1 line-clamp-2 max-w-xl text-sm leading-6 text-[#60728f]">
                          {notice.message}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold capitalize text-[#0D2B55]">
                        {notice.audience.replace("-", " ")}
                      </td>
                      <td className="px-5 py-4">
                        <Badge className={severityStyles[notice.severity]}>
                          {notice.severity}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge className={statusStyles[notice.status]}>
                          {notice.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#60728f]">
                        {formatDateTime(notice.startAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <RowActionMenu
                          label={`Actions for ${notice.title}`}
                          open={openActionId === `notice:${notice.id}`}
                          onOpenChange={(open) =>
                            setOpenActionId(open ? `notice:${notice.id}` : "")
                          }
                          menuClassName="z-[180]"
                          items={[
                            {
                              label: "View data",
                              icon: <Eye className="size-4" />,
                              onSelect: () => setViewNotice(notice),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 p-4 lg:hidden">
              {settings.notices.map((notice) => (
                <article
                  key={notice.id}
                  className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-[#06183A]">
                        {notice.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#60728f]">
                        {notice.message}
                      </p>
                    </div>
                    <RowActionMenu
                      label={`Actions for ${notice.title}`}
                      open={openActionId === `notice-mobile:${notice.id}`}
                      onOpenChange={(open) =>
                        setOpenActionId(
                          open ? `notice-mobile:${notice.id}` : "",
                        )
                      }
                      menuClassName="z-[180]"
                      items={[
                        {
                          label: "View data",
                          icon: <Eye className="size-4" />,
                          onSelect: () => setViewNotice(notice),
                        },
                      ]}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={severityStyles[notice.severity]}>
                      {notice.severity}
                    </Badge>
                    <Badge className={statusStyles[notice.status]}>
                      {notice.status}
                    </Badge>
                    <Badge className="border-[#dbe5f1] bg-white text-[#0D2B55]">
                      {notice.audience.replace("-", " ")}
                    </Badge>
                  </div>
                </article>
              ))}
            </div>
            {isLoadingNotices || settings.notices.length === 0 ? (
              <div className="border-t border-[#dbe5f1] p-8 text-center text-sm font-semibold text-[#60728f]">
                {isLoadingNotices
                  ? "Loading platform notices..."
                  : "No persisted platform notices yet."}
              </div>
            ) : null}
          </div>
        ) : (
          <div>
            <div className="border-b border-[#dbe5f1] bg-[#fbfdff] px-4 py-5 sm:px-5">
              <div className="grid gap-3 lg:grid-cols-3">
                {[
                  {
                    title: "What it is used for",
                    body: "Announce planned platform downtime before it affects applicants, students, staff, and college admins.",
                  },
                  {
                    title: "How to use it",
                    body: "Open Edit window, add the title, message, start time, end time, impact level, then enable and save.",
                  },
                  {
                    title: "What it does now",
                    body: "Stores the current window in this session and records an audit event; persistent enforcement can be connected later.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-[#dbe5f1] bg-white p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef4fb] text-[#2E86C1]">
                        <Wrench className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-[#06183A]">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#60728f]">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead className="bg-white">
                  <tr className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
                    <th className="px-5 py-4">Window</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Impact</th>
                    <th className="px-5 py-4">Start</th>
                    <th className="px-5 py-4">End</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbe5f1]">
                  {maintenanceRows.map((row) => (
                    <tr
                      key={row.title}
                      className="transition hover:bg-[#f8fbff]"
                    >
                      <td className="px-5 py-4">
                        <p className="font-black text-[#06183A]">{row.title}</p>
                        <p className="mt-1 line-clamp-2 max-w-xl text-sm leading-6 text-[#60728f]">
                          {row.message}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          className={
                            row.enabled
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                          }
                        >
                          {row.enabled ? "enabled" : "disabled"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold capitalize text-[#0D2B55]">
                        {row.impact}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#60728f]">
                        {formatDateTime(row.startAt)}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#60728f]">
                        {formatDateTime(row.endAt)}
                      </td>
                      <td className="px-5 py-4">
                        <RowActionMenu
                          label="Maintenance actions"
                          open={openActionId === "maintenance"}
                          onOpenChange={(open) =>
                            setOpenActionId(open ? "maintenance" : "")
                          }
                          menuClassName="z-[180]"
                          items={[
                            {
                              label: "View data",
                              icon: <Eye className="size-4" />,
                              onSelect: () => setViewMaintenance(row),
                            },
                            {
                              label: "Edit window",
                              icon: <Pencil className="size-4" />,
                              onSelect: () => setShowMaintenanceModal(true),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 p-4 lg:hidden">
              {maintenanceRows.map((row) => (
                <article
                  key={row.title}
                  className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-[#06183A]">{row.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#60728f]">
                        {row.message}
                      </p>
                    </div>
                    <RowActionMenu
                      label="Maintenance actions"
                      open={openActionId === "maintenance-mobile"}
                      onOpenChange={(open) =>
                        setOpenActionId(open ? "maintenance-mobile" : "")
                      }
                      menuClassName="z-[180]"
                      items={[
                        {
                          label: "View data",
                          icon: <Eye className="size-4" />,
                          onSelect: () => setViewMaintenance(row),
                        },
                        {
                          label: "Edit window",
                          icon: <Pencil className="size-4" />,
                          onSelect: () => setShowMaintenanceModal(true),
                        },
                      ]}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge
                      className={
                        row.enabled
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-700"
                      }
                    >
                      {row.enabled ? "enabled" : "disabled"}
                    </Badge>
                    <Badge className="border-[#dbe5f1] bg-white text-[#0D2B55]">
                      {row.impact}
                    </Badge>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      {showMaintenanceModal ? (
        <div className="fixed inset-0 z-[230] flex items-end justify-center bg-[#06172f]/60 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-6">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-[#d7e2f0] bg-white shadow-[0_26px_70px_rgba(6,24,58,0.28)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#f8fbff] px-4 py-4 sm:px-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
                  Maintenance Control
                </p>
                <h2 className="mt-2 text-xl font-black text-[#06183A] sm:text-2xl">
                  Schedule maintenance window
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowMaintenanceModal(false)}
                className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#d3dfed] bg-white text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
                aria-label="Close maintenance modal"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleMaintenanceSubmit}>
              <div className="max-h-[calc(92vh-8rem)] space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                <div className="rounded-3xl border border-[#dbe5f1] bg-[#fbfdff] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#eef4fb] text-[#2E86C1]">
                      <CalendarClock className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#0D2B55]">
                        Use this before planned downtime
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[#60728f]">
                        The window tells users when the portal may be
                        unavailable and how serious the impact is. Keep it
                        disabled until the message is ready to show.
                      </p>
                    </div>
                  </div>
                </div>

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
                    {maintenanceRangeInvalid ? (
                      <span className="mt-2 block text-xs font-bold text-red-600">
                        End time must be after the start time.
                      </span>
                    ) : null}
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
              </div>

              <div className="flex justify-end border-t border-[#dbe5f1] bg-white px-4 py-4 sm:px-6">
                <button
                  type="submit"
                  disabled={isSavingMaintenance || maintenanceRangeInvalid}
                  className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_14px_26px_rgba(13,43,85,0.24)] transition hover:bg-[#123a73] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  <CalendarClock className="size-4" />
                  {isSavingMaintenance
                    ? "Saving window..."
                    : "Save maintenance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {viewNotice ? (
        <div className="fixed inset-0 z-[230] flex items-end justify-center bg-[#06172f]/60 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-6">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-[#d7e2f0] bg-white shadow-[0_26px_70px_rgba(6,24,58,0.28)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#f8fbff] px-4 py-4 sm:px-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
                  Notice Data
                </p>
                <h2 className="mt-2 text-xl font-black text-[#06183A] sm:text-2xl">
                  {viewNotice.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewNotice(null)}
                className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#d3dfed] bg-white text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
                aria-label="Close notice details"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="max-h-[calc(88vh-6rem)] space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
              <div className="flex flex-wrap gap-2">
                <Badge className={severityStyles[viewNotice.severity]}>
                  {viewNotice.severity}
                </Badge>
                <Badge className={statusStyles[viewNotice.status]}>
                  {viewNotice.status}
                </Badge>
                <Badge className="border-[#dbe5f1] bg-white text-[#0D2B55]">
                  {viewNotice.audience.replace("-", " ")}
                </Badge>
              </div>
              <p className="whitespace-pre-wrap rounded-3xl border border-[#dbe5f1] bg-[#fbfdff] p-4 text-sm font-semibold leading-7 text-[#60728f]">
                {viewNotice.message}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailBlock
                  label="Start"
                  value={formatDateTime(viewNotice.startAt)}
                />
                <DetailBlock
                  label="End"
                  value={formatDateTime(viewNotice.endAt)}
                />
                <DetailBlock label="Created by" value={viewNotice.createdBy} />
                <DetailBlock
                  label="Updated"
                  value={formatDateTime(viewNotice.updatedAt)}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {viewMaintenance ? (
        <div className="fixed inset-0 z-[230] flex items-end justify-center bg-[#06172f]/60 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-6">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-[#d7e2f0] bg-white shadow-[0_26px_70px_rgba(6,24,58,0.28)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#f8fbff] px-4 py-4 sm:px-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
                  Maintenance Data
                </p>
                <h2 className="mt-2 text-xl font-black text-[#06183A] sm:text-2xl">
                  {viewMaintenance.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewMaintenance(null)}
                className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#d3dfed] bg-white text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
                aria-label="Close maintenance details"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="max-h-[calc(88vh-6rem)] space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
              <div className="flex flex-wrap gap-2">
                <Badge
                  className={
                    viewMaintenance.enabled
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }
                >
                  {viewMaintenance.enabled ? "enabled" : "disabled"}
                </Badge>
                <Badge className="border-[#dbe5f1] bg-white text-[#0D2B55]">
                  {viewMaintenance.impact}
                </Badge>
              </div>
              <p className="whitespace-pre-wrap rounded-3xl border border-[#dbe5f1] bg-[#fbfdff] p-4 text-sm font-semibold leading-7 text-[#60728f]">
                {viewMaintenance.message}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailBlock
                  label="Start"
                  value={formatDateTime(viewMaintenance.startAt)}
                />
                <DetailBlock
                  label="End"
                  value={formatDateTime(viewMaintenance.endAt)}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showNoticeModal ? (
        <div className="fixed inset-0 z-[230] flex items-end justify-center bg-[#06172f]/60 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-6">
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
