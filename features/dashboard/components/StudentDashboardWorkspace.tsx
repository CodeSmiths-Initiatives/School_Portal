import type {
  StudentDashboardChartPoint,
  StudentDashboardData,
  StudentDashboardNotice,
} from "@/lib/services/student-dashboard.service";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bell,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LineChart,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";

type StudentDashboardWorkspaceProps = {
  collegeSlug: string;
  data: StudentDashboardData;
};

const noticeToneClass = {
  info: "border-[#c9dff4] bg-[#f2f8ff] text-[#1a5a92]",
  success: "border-[#bce6ca] bg-[#f1fbf4] text-[#177245]",
  warning: "border-[#f3d79f] bg-[#fff8eb] text-[#9b6300]",
  critical: "border-[#ffb6b6] bg-[#fff3f3] text-[#b42318]",
} satisfies Record<StudentDashboardNotice["tone"], string>;

function formatCurrency(amount: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Live";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function KpiCard({
  label,
  value,
  meta,
  icon: Icon,
  accent = "blue",
}: {
  label: string;
  value: string;
  meta: string;
  icon: typeof GraduationCap;
  accent?: "blue" | "gold" | "green" | "rose";
}) {
  const accents = {
    blue: "bg-[#eef7ff] text-[#2E86C1]",
    gold: "bg-[#fff6e5] text-[#B7770D]",
    green: "bg-[#edf8f1] text-[#167a3e]",
    rose: "bg-[#fff0f0] text-[#b42318]",
  };

  return (
    <div className="student-dashboard-enter min-w-0 rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8395AF]">
            {label}
          </p>
          <p className="mt-3 truncate text-2xl font-black text-[#0D2B55] sm:text-3xl">
            {value}
          </p>
        </div>
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${accents[accent]}`}
        >
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-[#5B7090]">
        {meta}
      </p>
    </div>
  );
}

function RingMetric({
  value,
  label,
  subtitle,
}: {
  value: number;
  label: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#dbe5f1] bg-white p-4 shadow-sm">
      <div
        className="relative flex size-24 shrink-0 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(#E4A11B ${value * 3.6}deg, #dfe7f1 0deg)`,
        }}
      >
        <div className="flex size-18 items-center justify-center rounded-full bg-white text-xl font-black text-[#0D2B55]">
          {value}%
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B7770D]">
          {label}
        </p>
        <p className="mt-2 text-sm leading-6 text-[#60728f]">{subtitle}</p>
      </div>
    </div>
  );
}

function BarChart({
  title,
  points,
  variant = "default",
}: {
  title: string;
  points: StudentDashboardChartPoint[];
  variant?: "default" | "compact";
}) {
  return (
    <div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B7770D]">
            Analytics
          </p>
          <h3 className="mt-1 text-lg font-bold text-[#0D2B55]">{title}</h3>
        </div>
        <LineChart className="size-5 text-[#2E86C1]" />
      </div>

      <div
        className={`mt-5 flex items-end gap-3 ${
          variant === "compact" ? "h-36" : "h-48"
        }`}
      >
        {points.map((point, index) => (
          <div
            key={`${title}-${point.label}`}
            className="flex min-w-0 flex-1 flex-col items-center gap-3"
          >
            <div className="flex h-full w-full items-end rounded-xl bg-[#f1f6fc] p-1">
              <div
                className="student-dashboard-bar w-full rounded-lg bg-[linear-gradient(180deg,#2E86C1_0%,#0D2B55_72%,#B7770D_100%)] shadow-[0_12px_24px_rgba(13,43,85,0.14)]"
                style={{
                  height: `${Math.max(point.value, 4)}%`,
                  animationDelay: `${index * 80}ms`,
                }}
              />
            </div>
            <div className="w-full text-center">
              <p className="truncate text-sm font-bold text-[#0D2B55]">
                {point.amount}
              </p>
              <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-[#7d90aa]">
                {point.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdmissionTimeline({
  points,
}: {
  points: StudentDashboardChartPoint[];
}) {
  return (
    <div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B7770D]">
            Admission
          </p>
          <h3 className="mt-1 text-lg font-bold text-[#0D2B55]">
            Progress timeline
          </h3>
        </div>
        <ClipboardCheck className="size-5 text-[#2E86C1]" />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {points.map((point, index) => {
          const isDone = point.amount === "Done";

          return (
            <div
              key={`${point.label}-${index}`}
              className={`student-dashboard-enter rounded-2xl border p-4 ${
                isDone
                  ? "border-[#c9e8d3] bg-[#f3fbf6]"
                  : "border-[#dbe5f1] bg-[#fbfdff]"
              }`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`flex size-8 items-center justify-center rounded-full ${
                    isDone
                      ? "bg-[#167a3e] text-white"
                      : "bg-[#eef4fb] text-[#6b7f9e]"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <span className="text-xs font-black">{index + 1}</span>
                  )}
                </span>
                <span className="rounded-full border border-[#dbe5f1] bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#60728f]">
                  {point.amount}
                </span>
              </div>
              <p className="mt-4 text-sm font-bold text-[#0D2B55]">
                {point.label}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#dfe7f1]">
                <div
                  className="student-dashboard-meter h-full rounded-full bg-[linear-gradient(90deg,#0D2B55,#E4A11B)]"
                  style={{
                    width: `${point.value}%`,
                    animationDelay: `${index * 80}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NoticeList({ notices }: { notices: StudentDashboardNotice[] }) {
  return (
    <div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B7770D]">
            Notices
          </p>
          <h3 className="mt-1 text-lg font-bold text-[#0D2B55]">
            Student updates
          </h3>
        </div>
        <Bell className="size-5 text-[#2E86C1]" />
      </div>
      <div className="mt-4 space-y-3">
        {notices.map((notice) => (
          <div
            key={`${notice.title}-${notice.meta}`}
            className={`rounded-2xl border px-4 py-3 ${noticeToneClass[notice.tone]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-bold">{notice.title}</p>
              <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.14em]">
                {notice.meta}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#60728f]">
              {notice.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseList({ data }: { data: StudentDashboardData }) {
  return (
    <div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B7770D]">
            Courses
          </p>
          <h3 className="mt-1 text-lg font-bold text-[#0D2B55]">
            College course snapshot
          </h3>
        </div>
        <BookOpen className="size-5 text-[#2E86C1]" />
      </div>
      <div className="mt-4 space-y-3">
        {data.courses.length ? (
          data.courses.slice(0, 5).map((course) => (
            <div
              key={course.id}
              className="grid gap-3 rounded-2xl border border-[#e3eaf4] bg-[#fbfdff] px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#0D2B55]">
                  {course.code} - {course.title}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#7d90aa]">
                  Level {course.level || "-"} / {course.semester}
                </p>
              </div>
              <span className="w-fit rounded-full border border-[#dbe5f1] bg-white px-3 py-1 text-xs font-bold text-[#35527d]">
                {course.creditUnits} units
              </span>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#cfdbea] bg-[#fbfdff] px-4 py-6 text-sm font-semibold text-[#60728f]">
            No active course records returned for this college yet.
          </div>
        )}
      </div>
    </div>
  );
}

function HeroTrendPanel({ data }: { data: StudentDashboardData }) {
  const points = data.charts.admissionProgress;
  const chartPoints = points
    .map((point, index) => {
      const x = points.length === 1 ? 180 : (index / (points.length - 1)) * 360;
      const y = 120 - (Math.min(Math.max(point.value, 0), 100) / 100) * 92;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="min-h-44 overflow-hidden rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#E4A11B]">
              Admission Pulse
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {data.currentStage} / {data.admissionStatus}
            </p>
          </div>
          <LineChart className="size-5 text-[#E4A11B]" />
        </div>

        <div className="mt-4 h-28 rounded-2xl border border-white/10 bg-[#06172f]/25">
          <svg
            viewBox="0 0 360 120"
            className="h-full w-full"
            role="img"
            aria-label="Admission progress trend"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="student-hero-line"
                x1="0"
                x2="1"
                y1="0"
                y2="0"
              >
                <stop offset="0%" stopColor="#E4A11B" />
                <stop offset="55%" stopColor="#2E86C1" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
              <linearGradient
                id="student-hero-fill"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#E4A11B" stopOpacity="0.26" />
                <stop offset="100%" stopColor="#2E86C1" stopOpacity="0.03" />
              </linearGradient>
            </defs>
            <polygon
              points={`0,120 ${chartPoints} 360,120`}
              fill="url(#student-hero-fill)"
            />
            <polyline
              points={chartPoints}
              fill="none"
              stroke="url(#student-hero-line)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="5"
            />
            {points.map((point, index) => {
              const x =
                points.length === 1 ? 180 : (index / (points.length - 1)) * 360;
              const y =
                120 - (Math.min(Math.max(point.value, 0), 100) / 100) * 92;

              return (
                <circle
                  key={`${point.label}-dot`}
                  cx={x}
                  cy={y}
                  r="5"
                  fill={point.amount === "Done" ? "#E4A11B" : "#8ea7c6"}
                  stroke="#0D2B55"
                  strokeWidth="3"
                />
              );
            })}
          </svg>
        </div>
      </div>

      <div className="grid min-h-44 gap-3 sm:grid-cols-3 lg:grid-cols-1">
        {[
          [
            "Paid",
            formatCurrency(
              data.paymentSummary.totalPaid,
              data.paymentSummary.currency,
            ),
          ],
          [
            "Pending",
            formatCurrency(
              data.paymentSummary.pendingAmount,
              data.paymentSummary.currency,
            ),
          ],
          ["Courses", `${data.courses.length} active`],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 backdrop-blur-sm"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9db2cc]">
              {label}
            </p>
            <p className="mt-2 truncate text-sm font-black text-white">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudentDashboardWorkspace({
  collegeSlug,
  data,
}: StudentDashboardWorkspaceProps) {
  const latestInvoice = data.paymentSummary.latestInvoice;
  const quickActions = [
    {
      label: "Admission",
      href: `/college/${collegeSlug}/student/admission`,
      icon: FileText,
    },
    {
      label: "Profile",
      href: `/college/${collegeSlug}/student/profile`,
      icon: UserRound,
    },
    {
      label: "Payments",
      href: `/college/${collegeSlug}/modules/payments`,
      icon: CircleDollarSign,
    },
    {
      label: "Courses",
      href: `/college/${collegeSlug}/modules/courses`,
      icon: BookOpen,
    },
  ];

  return (
    <div className="space-y-5">
      <section className="student-dashboard-enter overflow-hidden rounded-2xl border border-[#dbe5f1] bg-[#0D2B55] shadow-[0_22px_55px_rgba(13,43,85,0.18)]">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.15fr)_24rem]">
          <div className="relative p-5 text-white sm:p-6 lg:p-7">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#B7770D,#E4A11B,#2E86C1)]" />
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-[#E4A11B]/60 bg-white/10 text-[#E4A11B] shadow-[0_16px_36px_rgba(4,14,32,0.22)]">
                <GraduationCap className="size-9" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#E4A11B]">
                  Live Student Dashboard
                </p>
                <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                  {data.studentName}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[#c5d4e8]">
                  {data.collegeName} / {data.email}
                </p>
              </div>
            </div>

            {/* <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
							{quickActions.map((action) => {
								const Icon = action.icon;

								return (
									<Link
										key={action.label}
										href={action.href}
										className="group flex items-center justify-between gap-3 rounded-2xl border border-white/12 bg-white/8 px-4 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-white hover:text-[#0D2B55]"
									>
										<span className="flex items-center gap-2">
											<Icon className="size-4 text-[#E4A11B] transition group-hover:text-[#B7770D]" />
											{action.label}
										</span>
										<ArrowRight className="size-4" />
									</Link>
								);
							})}
						</div> */}

            <HeroTrendPanel data={data} />
          </div>

          <div className="border-t border-white/10 bg-white/8 p-5 text-white backdrop-blur-sm sm:p-6 xl:border-l xl:border-t-0">
            <RingMetric
              value={data.profileCompletion}
              label="Profile Completion"
              subtitle={`${data.completedProfileSections} of ${data.totalProfileSections} admission sections are complete.`}
            />
            <div className="mt-4 rounded-2xl border border-white/12 bg-[#06172f]/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E4A11B]">
                    Application
                  </p>
                  <p className="mt-2 break-all text-sm font-bold text-white">
                    {data.applicationNumber}
                  </p>
                </div>
                <BadgeCheck className="size-5 shrink-0 text-[#E4A11B]" />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-xl border border-white/10 bg-white/8 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9db2cc]">
                    Stage
                  </p>
                  <p className="mt-1 text-sm font-bold">{data.currentStage}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/8 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9db2cc]">
                    Updated
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    {formatDateTime(data.generatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Admission"
          value={data.admissionStatus}
          meta={`Current stage: ${data.currentStage}`}
          icon={ClipboardCheck}
          accent="blue"
        />
        <KpiCard
          label="Payment"
          value={data.paymentStatus}
          meta={`${formatCurrency(data.paymentSummary.totalPaid, data.paymentSummary.currency)} paid`}
          icon={Banknote}
          accent="green"
        />
        <KpiCard
          label="Courses"
          value={`${data.courses.length}`}
          meta={`${data.charts.courseLoad.reduce((sum, point) => sum + Number.parseInt(point.amount, 10), 0) || 0} credit units listed`}
          icon={BookOpen}
          accent="gold"
        />
        <KpiCard
          label="Notices"
          value={`${data.notices.length}`}
          meta="Admission, ledger, profile, and course updates"
          icon={Bell}
          accent={data.paymentSummary.pendingAmount > 0 ? "rose" : "blue"}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.75fr)]">
        <AdmissionTimeline points={data.charts.admissionProgress} />
        <NoticeList notices={data.notices} />
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <BarChart title="Payment balance" points={data.charts.paymentMix} />
        <BarChart
          title="Course load"
          points={data.charts.courseLoad}
          variant="compact"
        />
        <div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B7770D]">
                Latest Invoice
              </p>
              <h3 className="mt-1 text-lg font-bold text-[#0D2B55]">
                Payment activity
              </h3>
            </div>
            <Sparkles className="size-5 text-[#2E86C1]" />
          </div>
          {latestInvoice ? (
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-[#e3eaf4] bg-[#fbfdff] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8495af]">
                  Invoice
                </p>
                <p className="mt-2 break-all text-sm font-bold text-[#0D2B55]">
                  {latestInvoice.invoiceNumber}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div className="rounded-2xl border border-[#e3eaf4] bg-[#fbfdff] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8495af]">
                    Amount
                  </p>
                  <p className="mt-2 text-sm font-bold text-[#0D2B55]">
                    {formatCurrency(
                      latestInvoice.amount,
                      data.paymentSummary.currency,
                    )}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#e3eaf4] bg-[#fbfdff] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8495af]">
                    Status
                  </p>
                  <p className="mt-2 text-sm font-bold text-[#0D2B55]">
                    {latestInvoice.status}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-6 text-[#60728f]">
                {latestInvoice.description}
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-[#cfdbea] bg-[#fbfdff] px-4 py-8 text-sm font-semibold leading-6 text-[#60728f]">
              No student invoice was returned for this account.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.75fr)]">
        <CourseList data={data} />
        <div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B7770D]">
                Session
              </p>
              <h3 className="mt-1 text-lg font-bold text-[#0D2B55]">
                Account summary
              </h3>
            </div>
            <CalendarClock className="size-5 text-[#2E86C1]" />
          </div>
          <div className="mt-5 space-y-3">
            {[
              ["College", data.collegeName],
              ["Email", data.email],
              ["Application", data.applicationNumber],
              ["Payment", data.paymentStatus],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-[#e3eaf4] bg-[#fbfdff] px-4 py-3"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8495af]">
                  {label}
                </p>
                <p className="mt-2 break-all text-sm font-bold text-[#0D2B55]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
