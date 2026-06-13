import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarRange,
  CircleDollarSign,
  FileBarChart2,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Network,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/features/auth/components";
import type { UserDomain } from "@/lib/auth";
import {
  getDefaultPermissionsForDomain,
  getVisibleDashboardMenus,
  type UserPermissionKey,
} from "@/lib/rbac";

export type DashboardStat = {
  label: string;
  value: string;
  change: string;
};

export type DashboardHighlight = {
  title: string;
  description: string;
  meta: string;
};

export type DashboardActivity = {
  label: string;
  value: string;
  note: string;
};

export type DashboardQuickLink = {
  label: string;
  href: string;
  description: string;
};

export type DashboardReportPoint = {
  label: string;
  value: number;
  amount: string;
};

export type DashboardReportPanel = {
  badge: string;
  title: string;
  description: string;
  summary: string;
  variant?: "bar" | "line";
  points: DashboardReportPoint[];
};

export type DashboardTenantContext = {
  label: string;
  name: string;
  description: string;
};

type RoleDashboardShellProps = {
  badge: string;
  title: string;
  subtitle: string;
  domain: UserDomain;
  roleLabel: string;
  tenantSlug?: string;
  activeMenuKey?: string;
  permissions?: UserPermissionKey[];
  stats: DashboardStat[];
  highlights: DashboardHighlight[];
  activity: DashboardActivity[];
  quickLinks: DashboardQuickLink[];
  reportPanel?: DashboardReportPanel;
  tenantContext?: DashboardTenantContext;
  children?: React.ReactNode;
  showOverviewContent?: boolean;
  contentWidth?: "default" | "wide";
};

const DOMAIN_ICON = {
  student: GraduationCap,
  staff: Building2,
  admin: Building2,
  superadmin: ShieldCheck,
} satisfies Record<UserDomain, typeof GraduationCap>;

const MENU_ICON_MAP = {
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CircleDollarSign,
  FileBarChart2,
  FolderKanban,
  LayoutDashboard,
  Network,
  Settings,
  ShieldCheck,
  Users,
};

const STAT_ICONS = [LayoutDashboard, BookOpen, CircleDollarSign, Users];
const HIGHLIGHT_ICONS = [FolderKanban, BadgeCheck, Bell, CalendarRange];

export default function RoleDashboardShell({
  badge,
  title,
  subtitle,
  domain,
  roleLabel,
  tenantSlug,
  activeMenuKey = "dashboard",
  permissions,
  stats,
  highlights,
  activity,
  quickLinks,
  reportPanel,
  tenantContext,
  children,
  showOverviewContent = true,
  contentWidth = "default",
}: RoleDashboardShellProps) {
  const DomainIcon = DOMAIN_ICON[domain];
  const navItems = getVisibleDashboardMenus({
    domain,
    collegeSlug: tenantSlug,
    permissions: permissions ?? getDefaultPermissionsForDomain(domain),
  });
  const headerTitle = tenantContext?.name ?? title;

  return (
    <div className="min-h-dvh bg-[#eef3fb] lg:flex lg:h-dvh lg:flex-col lg:overflow-hidden">
      <header className="border-b-[10px] border-[#B7770D] bg-[#0D2B55] lg:flex-none">
        <div className="flex w-full flex-wrap items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-5 xl:px-10 2xl:px-12">
          <div className="flex items-center gap-3 sm:gap-5 lg:gap-6">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-[#B7770D] bg-linear-to-br from-[#1a3a6b] to-[#0d1b3e] text-[#E4A11B] sm:size-[4.5rem] lg:size-[5.5rem]">
              <DomainIcon className="size-6 sm:size-7 lg:size-8" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#E4A11B]">
                {badge}
              </p>
              <h1 className="mt-1 text-xl font-bold text-white sm:text-3xl">
                {headerTitle}
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-7 text-[#93A6C1] sm:mt-2 sm:text-base">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-[1.75rem] border border-white/10 bg-white/6 p-2 pl-4 shadow-[0_10px_30px_rgba(7,23,52,0.16)] backdrop-blur-sm">
            <div className="min-w-[11rem] rounded-[1.1rem] border border-[#B7770D]/60 bg-[#B7770D]/12 px-4 py-2.5 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E4A11B]">
                Role
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {roleLabel}
              </p>
            </div>

            <div className="h-10 w-px bg-white/12" />

            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="lg:flex lg:min-h-0 lg:flex-1">
        <aside className="bg-[#0D2B55] px-4 py-4 text-white shadow-lg shadow-[#0d2b55]/12 sm:px-6 lg:h-full lg:w-[20rem] lg:flex-none lg:overflow-hidden lg:px-6 lg:py-5 xl:w-[22rem] xl:px-8">
          <div className="lg:sticky lg:top-5">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon =
                  MENU_ICON_MAP[item.icon as keyof typeof MENU_ICON_MAP] ??
                  LayoutDashboard;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      item.key === activeMenuKey
                        ? "bg-white text-[#0D2B55]"
                        : "text-[#dbe6f3] hover:bg-white/5"
                    }`}
                  >
                    <Icon className="size-4.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:h-full lg:overflow-y-auto lg:px-8 xl:px-10">
          <div
            className={`w-full space-y-6 lg:pb-8 ${
              contentWidth === "wide" ? "max-w-none" : "mx-auto max-w-[1240px]"
            }`}
          >
            {showOverviewContent ? (
              <>
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {stats.map((stat, index) => {
                    const Icon = STAT_ICONS[index % STAT_ICONS.length];

                    return (
                      <div
                        key={stat.label}
                        className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8395AF]">
                              {stat.label}
                            </p>
                            <p className="mt-3 text-3xl font-bold text-[#0D2B55]">
                              {stat.value}
                            </p>
                          </div>
                          <div className="flex size-11 items-center justify-center rounded-full bg-[#eef4fb] text-[#2E86C1]">
                            <Icon className="size-5" />
                          </div>
                        </div>
                        <p className="mt-3 text-sm font-medium text-[#5B7090]">
                          {stat.change}
                        </p>
                      </div>
                    );
                  })}
                </section>

                {reportPanel ? (
                  <section className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
                          {reportPanel.badge}
                        </p>
                        <h2 className="mt-2 text-xl font-bold text-[#0D2B55]">
                          {reportPanel.title}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#60728f]">
                          {reportPanel.description}
                        </p>
                      </div>
                      <div className="rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-4 py-2 text-xs font-semibold text-[#4f6788]">
                        {reportPanel.summary}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_16rem]">
                      <div className="rounded-2xl border border-[#e2eaf4] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9fe_100%)] p-4">
                        {reportPanel.variant === "line" ? (
                          <div className="h-52">
                            <div className="relative h-40 overflow-hidden rounded-2xl border border-[#e2eaf4] bg-white">
                              <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-[#dbe5f1]" />
                              <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[#dbe5f1]" />
                              <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-[#dbe5f1]" />
                              <svg
                                viewBox="0 0 300 140"
                                className="absolute inset-0 h-full w-full"
                                role="img"
                                aria-label={`${reportPanel.title} line chart`}
                                preserveAspectRatio="none"
                              >
                                <defs>
                                  <linearGradient
                                    id="tenant-line-fill"
                                    x1="0"
                                    x2="0"
                                    y1="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#2E86C1"
                                      stopOpacity="0.22"
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#2E86C1"
                                      stopOpacity="0.02"
                                    />
                                  </linearGradient>
                                </defs>
                                <polygon
                                  points={`0,140 ${reportPanel.points
                                    .map((point, index) => {
                                      const x =
                                        reportPanel.points.length === 1
                                          ? 150
                                          : (index /
                                              (reportPanel.points.length - 1)) *
                                            300;
                                      const y =
                                        140 -
                                        (Math.min(point.value, 100) / 100) *
                                          112;
                                      return `${x},${y}`;
                                    })
                                    .join(" ")} 300,140`}
                                  fill="url(#tenant-line-fill)"
                                />
                                <polyline
                                  points={reportPanel.points
                                    .map((point, index) => {
                                      const x =
                                        reportPanel.points.length === 1
                                          ? 150
                                          : (index /
                                              (reportPanel.points.length - 1)) *
                                            300;
                                      const y =
                                        140 -
                                        (Math.min(point.value, 100) / 100) *
                                          112;
                                      return `${x},${y}`;
                                    })
                                    .join(" ")}
                                  fill="none"
                                  stroke="#0D2B55"
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                {reportPanel.points.map((point, index) => {
                                  const x =
                                    reportPanel.points.length === 1
                                      ? 150
                                      : (index /
                                          (reportPanel.points.length - 1)) *
                                        300;
                                  const y =
                                    140 -
                                    (Math.min(point.value, 100) / 100) * 112;
                                  return (
                                    <circle
                                      key={`${point.label}-${index}-dot`}
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
                            <div className="mt-3 grid grid-cols-4 gap-2">
                              {reportPanel.points.map((point, index) => (
                                <div
                                  key={`${point.label}-${index}-axis`}
                                  className="text-center"
                                >
                                  <p className="text-sm font-semibold text-[#17305f]">
                                    {point.amount}
                                  </p>
                                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d90aa]">
                                    {point.label}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-52 items-end gap-3">
                            {reportPanel.points.map((point, index) => (
                              <div
                                key={`${point.label}-${index}-bar`}
                                className="flex min-w-0 flex-1 flex-col items-center gap-3"
                              >
                                <div className="flex h-40 w-full items-end">
                                  <div
                                    className="w-full rounded-t-2xl bg-[linear-gradient(180deg,#2E86C1_0%,#0D2B55_100%)] shadow-[0_12px_24px_rgba(46,134,193,0.18)]"
                                    style={{ height: `${point.value}%` }}
                                  />
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-semibold text-[#17305f]">
                                    {point.amount}
                                  </p>
                                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d90aa]">
                                    {point.label}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        {reportPanel.points.map((point, index) => (
                          <div
                            key={`${point.label}-${index}-summary`}
                            className="rounded-xl border border-[#e3eaf4] bg-[#fbfdff] px-4 py-3"
                          >
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a9ab5]">
                              {point.label}
                            </p>
                            <p className="mt-2 text-lg font-bold text-[#0D2B55]">
                              {point.amount}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                ) : null}

                <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_23rem] 2xl:grid-cols-[minmax(0,1.7fr)_24rem]">
                  <div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
                          Command Center
                        </p>
                        <h2 className="mt-2 text-xl font-bold text-[#0D2B55]">
                          {title}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#60728f]">
                          {subtitle}
                        </p>
                      </div>
                      <div className="rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-4 py-2 text-xs font-semibold text-[#4f6788]">
                        Current workspace
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {highlights.map((highlight, index) => {
                        const Icon =
                          HIGHLIGHT_ICONS[index % HIGHLIGHT_ICONS.length];

                        return (
                          <div
                            key={highlight.title}
                            className="rounded-2xl border border-[#e2eaf4] bg-[#fbfdff] p-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex size-10 items-center justify-center rounded-full bg-[#edf4fb] text-[#2E86C1]">
                                <Icon className="size-4.5" />
                              </div>
                              <div>
                                <h3 className="text-base font-semibold text-[#17305f]">
                                  {highlight.title}
                                </h3>
                                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#B7770D]">
                                  {highlight.meta}
                                </p>
                              </div>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-[#60728f]">
                              {highlight.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
                        Quick Links
                      </p>
                      <div className="mt-4 space-y-3">
                        {quickLinks.map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            className="block rounded-xl border border-[#e3eaf4] bg-[#fbfdff] px-4 py-3 transition hover:border-[#c7d5e8] hover:bg-white"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-[#17305f]">
                                {link.label}
                              </p>
                              <ArrowRight className="size-4 text-[#B7770D]" />
                            </div>
                            <p className="mt-2 text-sm text-[#60728f]">
                              {link.description}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
                        Activity Focus
                      </p>
                      <div className="mt-4 space-y-3">
                        {activity.map((item) => (
                          <div
                            key={item.label}
                            className="rounded-xl border border-[#e3eaf4] bg-[#fbfdff] px-4 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-[#17305f]">
                                {item.label}
                              </p>
                              <p className="text-sm font-bold text-[#0D2B55]">
                                {item.value}
                              </p>
                            </div>
                            <p className="mt-2 text-sm text-[#60728f]">
                              {item.note}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </>
            ) : null}

            {children ? <section>{children}</section> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
