import {
	BookOpenCheck,
	CalendarDays,
	Clock3,
	GraduationCap,
	Layers3,
	MapPin,
	RefreshCw,
} from "lucide-react";
import type { StudentCourseData } from "@/lib/services/student-course.service";

type StudentCourseWorkspaceProps = {
	data: StudentCourseData;
	collegeName: string;
};

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

function SummaryCard({
	label,
	value,
	note,
	icon: Icon,
}: {
	label: string;
	value: string | number;
	note: string;
	icon: typeof BookOpenCheck;
}) {
	return (
		<div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8395AF]">
						{label}
					</p>
					<p className="mt-3 text-2xl font-black text-[#0D2B55]">{value}</p>
				</div>
				<div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef4fb] text-[#2E86C1]">
					<Icon className="size-5" />
				</div>
			</div>
			<p className="mt-3 text-sm leading-6 text-[#60728f]">{note}</p>
		</div>
	);
}

export default function StudentCourseWorkspace({
	data,
	collegeName,
}: StudentCourseWorkspaceProps) {
	return (
		<div className="space-y-5">
			<section className="overflow-hidden rounded-2xl border border-[#dbe5f1] bg-[#0D2B55] shadow-[0_22px_55px_rgba(13,43,85,0.18)]">
				<div className="relative p-5 text-white sm:p-6 lg:p-7">
					<div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#B7770D,#E4A11B,#2E86C1)]" />
					<div className="flex flex-wrap items-start justify-between gap-5">
						<div className="flex min-w-0 gap-4">
							<div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-[#E4A11B]/60 bg-white/10 text-[#E4A11B]">
								<BookOpenCheck className="size-7" />
							</div>
							<div className="min-w-0">
								<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#E4A11B]">
									Student Courses
								</p>
								<h2 className="mt-2 text-2xl font-black sm:text-3xl">
									Live course allocation and timetable
								</h2>
								<p className="mt-2 max-w-3xl text-sm leading-7 text-[#c5d4e8]">
									{collegeName} students can view approved course allocations and
									published timetable slots permitted for their role.
								</p>
							</div>
						</div>
						<div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm font-bold text-white backdrop-blur-sm">
							<div className="flex items-center gap-2">
								<RefreshCw className="size-4 text-[#E4A11B]" />
								<span>{formatDateTime(data.generatedAt)}</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<SummaryCard
					label="Allocated Courses"
					value={data.summary.allocatedCourses}
					note="Approved courses currently assigned to student levels."
					icon={BookOpenCheck}
				/>
				<SummaryCard
					label="Credit Units"
					value={data.summary.totalUnits}
					note="Total units across all visible level allocations."
					icon={GraduationCap}
				/>
				<SummaryCard
					label="Active Levels"
					value={data.summary.activeLevels}
					note="Student levels with at least one approved allocation."
					icon={Layers3}
				/>
				<SummaryCard
					label="Timetable Slots"
					value={data.summary.timetableSlots}
					note="Published live slots linked to visible courses."
					icon={CalendarDays}
				/>
			</section>

			<section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]">
				<div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
								Course Allocation
							</p>
							<h3 className="mt-2 text-xl font-bold text-[#0D2B55]">
								Approved courses by level
							</h3>
						</div>
					</div>
					<div className="mt-5 space-y-4">
						{data.allocations.length ? (
							data.allocations.map((allocation) => (
								<div
									key={allocation.level}
									className="rounded-2xl border border-[#e3eaf4] bg-[#fbfdff] p-4"
								>
									<div className="flex flex-wrap items-center justify-between gap-3">
										<h4 className="text-base font-black text-[#0D2B55]">
											{allocation.level}
										</h4>
										<span className="rounded-full border border-[#dbe5f1] bg-white px-3 py-1 text-xs font-bold text-[#35527d]">
											{allocation.totalUnits} units
										</span>
									</div>
									<div className="mt-4 grid gap-3 md:grid-cols-2">
										{allocation.courses.map((course) => (
											<div
												key={`${allocation.level}-${course.id}`}
												className="rounded-xl border border-[#dbe5f1] bg-white px-4 py-3"
											>
												<p className="text-sm font-black text-[#0D2B55]">
													{course.code}
												</p>
												<p className="mt-1 text-sm leading-6 text-[#60728f]">
													{course.title}
												</p>
												<p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#B7770D]">
													{course.type} / {course.units} units / {course.mode}
												</p>
											</div>
										))}
									</div>
								</div>
							))
						) : (
							<div className="rounded-2xl border border-dashed border-[#cfdbea] bg-[#fbfdff] px-4 py-8 text-sm font-semibold text-[#60728f]">
								No approved course allocation has been published for students yet.
							</div>
						)}
					</div>
				</div>

				<div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
					<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
						Timetable
					</p>
					<h3 className="mt-2 text-xl font-bold text-[#0D2B55]">
						Published slots
					</h3>
					<div className="mt-5 space-y-3">
						{data.timetableSlots.length ? (
							data.timetableSlots.map((slot) => (
								<div
									key={slot.id}
									className="rounded-2xl border border-[#e3eaf4] bg-[#fbfdff] px-4 py-3"
								>
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-sm font-black text-[#0D2B55]">
												{slot.code} / {slot.level}
											</p>
											<p className="mt-1 text-sm leading-6 text-[#60728f]">
												{slot.course}
											</p>
										</div>
										<span className="rounded-full bg-[#eef4fb] px-3 py-1 text-xs font-bold text-[#35527d]">
											{slot.mode}
										</span>
									</div>
									<div className="mt-3 grid gap-2 text-sm font-semibold text-[#4f6788] sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
										<span className="flex items-center gap-2">
											<CalendarDays className="size-4 text-[#B7770D]" />
											{slot.day}
										</span>
										<span className="flex items-center gap-2">
											<Clock3 className="size-4 text-[#B7770D]" />
											{slot.time}
										</span>
										<span className="flex items-center gap-2">
											<MapPin className="size-4 text-[#B7770D]" />
											{slot.room}
										</span>
									</div>
								</div>
							))
						) : (
							<div className="rounded-2xl border border-dashed border-[#cfdbea] bg-[#fbfdff] px-4 py-8 text-sm font-semibold text-[#60728f]">
								No timetable slot has been published for visible courses yet.
							</div>
						)}
					</div>
				</div>
			</section>
		</div>
	);
}
