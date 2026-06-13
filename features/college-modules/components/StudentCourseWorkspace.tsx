"use client";

import {
	BookOpenCheck,
	CalendarDays,
	CheckCircle2,
	Clock3,
	Filter,
	GraduationCap,
	Layers3,
	MapPin,
	RefreshCw,
	Search,
	Sparkles,
	Table2,
} from "lucide-react";
import { useMemo, useState } from "react";
import type {
	Course,
	CourseType,
	Level,
	Mode,
	TimelineSlot,
} from "@/features/courses/types/course.types";
import type { StudentCourseData } from "@/lib/services/student-course.service";

type StudentCourseWorkspaceProps = {
	data: StudentCourseData;
	collegeName: string;
};

type WorkspaceTab = "allocation" | "calendar";

type AllocationRow = {
	key: string;
	level: Level;
	course: Course;
};

const LEVELS: Level[] = ["100L", "200L", "300L", "400L"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
const COURSE_TYPES: CourseType[] = ["Core", "Elective", "Required", "Borrowed", "Carryover"];
const COURSE_MODES: Mode[] = ["On-Site", "Online", "Hybrid"];

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

function includesSearch(value: string, search: string) {
	return value.toLowerCase().includes(search.trim().toLowerCase());
}

function typePill(type: CourseType) {
	const styles: Record<CourseType, string> = {
		Core: "border-[#cfe6d6] bg-[#f0fbf3] text-[#176b37]",
		Elective: "border-[#d7e4f7] bg-[#f3f8ff] text-[#255b98]",
		Required: "border-[#f7ddb2] bg-[#fff8ec] text-[#9a5d08]",
		Borrowed: "border-[#ead9fb] bg-[#faf5ff] text-[#6941a5]",
		Carryover: "border-[#f5cfcf] bg-[#fff4f4] text-[#a33b3b]",
	};

	return `inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${styles[type]}`;
}

function modePill(mode: Mode) {
	const styles: Record<Mode, string> = {
		"On-Site": "bg-[#eef4fb] text-[#31547d]",
		Online: "bg-[#eef8f1] text-[#176b37]",
		Hybrid: "bg-[#fff6e8] text-[#9a5d08]",
	};

	return `inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles[mode]}`;
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
		<div className="student-dashboard-enter rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
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

function SelectFilter({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: string;
	options: string[];
	onChange: (value: string) => void;
}) {
	return (
		<label className="min-w-0">
			<span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[#7486a0]">
				{label}
			</span>
			<select
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="h-11 w-full rounded-xl border border-[#d8e3f0] bg-white px-3 text-sm font-bold text-[#17305f] outline-none transition focus:border-[#2E86C1] focus:ring-4 focus:ring-[#2E86C1]/10"
			>
				{options.map((option) => (
					<option key={option} value={option}>
						{option}
					</option>
				))}
			</select>
		</label>
	);
}

function EmptyState({ title, message }: { title: string; message: string }) {
	return (
		<div className="rounded-2xl border border-dashed border-[#cfdbea] bg-[#fbfdff] px-4 py-10 text-center">
			<div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#eef4fb] text-[#2E86C1]">
				<Sparkles className="size-5" />
			</div>
			<p className="mt-4 text-sm font-black text-[#0D2B55]">{title}</p>
			<p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#60728f]">
				{message}
			</p>
		</div>
	);
}

function AllocationTable({ rows }: { rows: AllocationRow[] }) {
	return (
		<div className="overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white">
			<div className="overflow-x-auto app-scrollbar">
				<table className="min-w-[880px] w-full border-collapse text-left">
					<thead>
						<tr className="border-b border-[#dbe5f1] bg-[#f6f9fd] text-[11px] font-black uppercase tracking-[0.14em] text-[#647894]">
							<th className="px-5 py-4">Course</th>
							<th className="px-5 py-4">Level</th>
							<th className="px-5 py-4">Type</th>
							<th className="px-5 py-4">Units</th>
							<th className="px-5 py-4">Mode</th>
							<th className="px-5 py-4">Lecturer</th>
							<th className="px-5 py-4">Schedule</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-[#edf2f8]">
						{rows.map((row, index) => (
							<tr
								key={row.key}
								className="student-dashboard-enter bg-white text-sm transition hover:bg-[#fbfdff]"
								style={{ animationDelay: `${Math.min(index * 24, 180)}ms` }}
							>
								<td className="px-5 py-4">
									<div className="flex min-w-64 items-center gap-3">
										<div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#eef4fb] text-[#2E86C1]">
											<BookOpenCheck className="size-5" />
										</div>
										<div className="min-w-0">
											<p className="font-black text-[#0D2B55]">
												{row.course.code}
											</p>
											<p className="mt-1 line-clamp-2 text-[#5d708d]">
												{row.course.title}
											</p>
										</div>
									</div>
								</td>
								<td className="px-5 py-4">
									<span className="rounded-full border border-[#dbe5f1] bg-[#fbfdff] px-3 py-1 text-xs font-black text-[#17305f]">
										{row.level}
									</span>
								</td>
								<td className="px-5 py-4">
									<span className={typePill(row.course.type)}>
										{row.course.type}
									</span>
								</td>
								<td className="px-5 py-4 font-black text-[#0D2B55]">
									{row.course.units}
								</td>
								<td className="px-5 py-4">
									<span className={modePill(row.course.mode)}>
										{row.course.mode}
									</span>
								</td>
								<td className="px-5 py-4 font-semibold text-[#405a7c]">
									{row.course.lecturer || "Not assigned"}
								</td>
								<td className="px-5 py-4 text-[#60728f]">
									{row.course.schedule || "Pending"}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function CalendarSlot({ slot }: { slot: TimelineSlot }) {
	return (
		<div className="student-dashboard-enter rounded-xl border border-[#dbe5f1] bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#bfd2e9]">
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<p className="truncate text-sm font-black text-[#0D2B55]">
						{slot.code}
					</p>
					<p className="mt-1 line-clamp-2 text-xs leading-5 text-[#60728f]">
						{slot.course}
					</p>
				</div>
				<span className="shrink-0 rounded-full bg-[#fff6e8] px-2 py-1 text-[10px] font-black text-[#9a5d08]">
					{slot.level}
				</span>
			</div>
			<div className="mt-3 space-y-2 text-xs font-bold text-[#4f6788]">
				<span className="flex items-center gap-2">
					<Clock3 className="size-3.5 text-[#B7770D]" />
					{slot.time}
				</span>
				<span className="flex items-center gap-2">
					<MapPin className="size-3.5 text-[#B7770D]" />
					{slot.room}
				</span>
			</div>
		</div>
	);
}

function TimetableCalendar({ slots }: { slots: TimelineSlot[] }) {
	const slotsByDay = useMemo(() => {
		const grouped = new Map<string, TimelineSlot[]>();

		for (const slot of slots) {
			grouped.set(slot.day, [...(grouped.get(slot.day) ?? []), slot]);
		}

		return grouped;
	}, [slots]);

	return (
		<div className="grid gap-4 xl:grid-cols-5">
			{DAYS.map((day) => {
				const daySlots = (slotsByDay.get(day) ?? []).sort((left, right) =>
					left.time.localeCompare(right.time),
				);

				return (
					<section
						key={day}
						className="min-h-64 rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-3"
					>
						<div className="flex items-center justify-between gap-2 rounded-xl bg-[#0D2B55] px-3 py-3 text-white">
							<p className="text-sm font-black">{day}</p>
							<span className="rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-black text-[#E4A11B]">
								{daySlots.length}
							</span>
						</div>
						<div className="mt-3 space-y-3">
							{daySlots.length ? (
								daySlots.map((slot) => <CalendarSlot key={slot.id} slot={slot} />)
							) : (
								<div className="rounded-xl border border-dashed border-[#cfdbea] bg-white px-3 py-8 text-center text-xs font-bold leading-5 text-[#71839e]">
									No published class slot
								</div>
							)}
						</div>
					</section>
				);
			})}
		</div>
	);
}

export default function StudentCourseWorkspace({
	data,
	collegeName,
}: StudentCourseWorkspaceProps) {
	const [activeTab, setActiveTab] = useState<WorkspaceTab>("allocation");
	const [search, setSearch] = useState("");
	const [levelFilter, setLevelFilter] = useState("All Levels");
	const [typeFilter, setTypeFilter] = useState("All Types");
	const [modeFilter, setModeFilter] = useState("All Modes");

	const allocationRows = useMemo(
		() =>
			data.allocations.flatMap((allocation) =>
				allocation.courses.map((course) => ({
					key: `${allocation.level}-${course.id}`,
					level: allocation.level,
					course,
				})),
			),
		[data.allocations],
	);

	const filteredRows = useMemo(
		() =>
			allocationRows.filter((row) => {
				const searchable = [
					row.course.code,
					row.course.title,
					row.course.department,
					row.course.lecturer,
					row.course.schedule,
					row.level,
				].join(" ");

				return (
					(!search.trim() || includesSearch(searchable, search)) &&
					(levelFilter === "All Levels" || row.level === levelFilter) &&
					(typeFilter === "All Types" || row.course.type === typeFilter) &&
					(modeFilter === "All Modes" || row.course.mode === modeFilter)
				);
			}),
		[allocationRows, levelFilter, modeFilter, search, typeFilter],
	);

	const visibleUnits = filteredRows.reduce(
		(sum, row) => sum + row.course.units,
		0,
	);

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

			<section className="rounded-2xl border border-[#dbe5f1] bg-white p-3 shadow-sm sm:p-4">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6edf6] pb-3">
					<div className="inline-flex rounded-2xl border border-[#dbe5f1] bg-[#f6f9fd] p-1">
						{[
							{
								key: "allocation" as const,
								label: "Allocation",
								icon: Table2,
							},
							{
								key: "calendar" as const,
								label: "Calendar",
								icon: CalendarDays,
							},
						].map((tab) => {
							const Icon = tab.icon;
							const isActive = activeTab === tab.key;

							return (
								<button
									key={tab.key}
									type="button"
									onClick={() => setActiveTab(tab.key)}
									className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-black transition sm:px-4 ${
										isActive
											? "bg-[#0D2B55] text-white shadow-sm"
											: "text-[#536a89] hover:bg-white"
									}`}
								>
									<Icon className="size-4" />
									<span>{tab.label}</span>
								</button>
							);
						})}
					</div>

					<div className="flex flex-wrap items-center gap-2 text-xs font-black text-[#60728f]">
						<span className="inline-flex items-center gap-2 rounded-full bg-[#eef8f1] px-3 py-2 text-[#176b37]">
							<CheckCircle2 className="size-4" />
							Approved only
						</span>
						<span className="rounded-full bg-[#fff6e8] px-3 py-2 text-[#9a5d08]">
							{activeTab === "allocation"
								? `${filteredRows.length} rows / ${visibleUnits} units`
								: `${data.timetableSlots.length} slots`}
						</span>
					</div>
				</div>

				{activeTab === "allocation" ? (
					<div className="student-dashboard-enter mt-4 space-y-4">
						<div className="rounded-2xl border border-[#e3eaf4] bg-[#fbfdff] p-4">
							<div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_repeat(3,minmax(9rem,12rem))_auto]">
								<label className="min-w-0">
									<span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[#7486a0]">
										Search
									</span>
									<div className="flex h-11 items-center gap-2 rounded-xl border border-[#d8e3f0] bg-white px-3 transition focus-within:border-[#2E86C1] focus-within:ring-4 focus-within:ring-[#2E86C1]/10">
										<Search className="size-4 text-[#8395AF]" />
										<input
											value={search}
											onChange={(event) => setSearch(event.target.value)}
											placeholder="Course, code, lecturer, department"
											className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#17305f] outline-none placeholder:text-[#8ba0ba]"
										/>
									</div>
								</label>
								<SelectFilter
									label="Level"
									value={levelFilter}
									options={["All Levels", ...LEVELS]}
									onChange={setLevelFilter}
								/>
								<SelectFilter
									label="Type"
									value={typeFilter}
									options={["All Types", ...COURSE_TYPES]}
									onChange={setTypeFilter}
								/>
								<SelectFilter
									label="Mode"
									value={modeFilter}
									options={["All Modes", ...COURSE_MODES]}
									onChange={setModeFilter}
								/>
								<button
									type="button"
									onClick={() => {
										setSearch("");
										setLevelFilter("All Levels");
										setTypeFilter("All Types");
										setModeFilter("All Modes");
									}}
									className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d8e3f0] bg-white px-4 text-sm font-black text-[#0D2B55] transition hover:border-[#bfd2e9] hover:bg-[#f6f9fd] lg:mt-auto"
								>
									<Filter className="size-4" />
									Reset
								</button>
							</div>
						</div>

						{filteredRows.length ? (
							<AllocationTable rows={filteredRows} />
						) : (
							<EmptyState
								title="No allocation matches these filters"
								message="Adjust the search, level, type, or mode filters to review approved course allocations."
							/>
						)}
					</div>
				) : (
					<div className="student-dashboard-enter mt-4">
						{data.timetableSlots.length ? (
							<TimetableCalendar slots={data.timetableSlots} />
						) : (
							<EmptyState
								title="No timetable slot has been published"
								message="Published timetable slots linked to visible courses will appear in this calendar view."
							/>
						)}
					</div>
				)}
			</section>
		</div>
	);
}
