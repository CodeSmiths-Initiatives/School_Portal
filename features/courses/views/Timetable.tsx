"use client";

import {
	CalendarClock,
	ChevronLeft,
	ChevronRight,
	Clock3,
	Eye,
	Filter,
	Layers3,
	MapPin,
	MonitorPlay,
	MoreVertical,
	Pencil,
	Plus,
	Search,
	Trash2,
	Users,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Course, CourseType, Level, Mode, TimelineSlot } from "../types/course.types";
import { DAYS } from "../utils/data";

const LEVELS: Level[] = ["100L", "200L", "300L", "400L"];
const MODES: Array<Mode | "All Modes"> = ["All Modes", "On-Site", "Online", "Hybrid"];
const COURSE_TYPES: Array<CourseType | "All Types"> = [
	"All Types",
	"Core",
	"Elective",
	"Required",
	"Borrowed",
	"Carryover",
];
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const FULL_DAYS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
] as const;
const MONTH_FORMATTER = new Intl.DateTimeFormat("en-NG", {
	month: "long",
	year: "numeric",
});

type SlotForm = Omit<TimelineSlot, "id">;

function normaliseTime(value: string) {
	return value.replace(/\s/g, "").replace(/–|—/g, "-");
}

function formatTime(value: string) {
	return value.replace("-", " - ");
}

function getMonthKey(date: Date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthTitle(monthKey: string) {
	const [year, month] = monthKey.split("-").map(Number);
	return MONTH_FORMATTER.format(new Date(year, month - 1, 1));
}

function shiftMonth(monthKey: string, offset: number) {
	const [year, month] = monthKey.split("-").map(Number);
	return getMonthKey(new Date(year, month - 1 + offset, 1));
}

function getMonthDates(monthKey: string) {
	const [year, month] = monthKey.split("-").map(Number);
	const firstDate = new Date(year, month - 1, 1);
	const lastDate = new Date(year, month, 0);
	const cursor = new Date(firstDate);
	const dates: Date[] = [];

	cursor.setDate(firstDate.getDate() - firstDate.getDay());

	while (cursor <= lastDate || dates.length % 7 !== 0) {
		dates.push(new Date(cursor));
		cursor.setDate(cursor.getDate() + 1);
	}

	return dates;
}

function modeTone(mode: Mode) {
	if (mode === "Online") {
		return {
			card: "border-sky-200 bg-sky-50 text-sky-800",
			icon: "bg-sky-100 text-sky-700",
		};
	}

	if (mode === "Hybrid") {
		return {
			card: "border-violet-200 bg-violet-50 text-violet-800",
			icon: "bg-violet-100 text-violet-700",
		};
	}

	return {
		card: "border-emerald-200 bg-emerald-50 text-emerald-800",
		icon: "bg-emerald-100 text-emerald-700",
	};
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<label className="space-y-2">
			<span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#8395AF]">
				{label}
			</span>
			{children}
		</label>
	);
}

function AddSlotModal({
	courses,
	initialSlot,
	onSubmit,
	onClose,
}: {
	courses: Course[];
	initialSlot?: TimelineSlot | null;
	onSubmit: (slot: SlotForm) => Promise<void> | void;
	onClose: () => void;
}) {
	const selectableCourses = courses.filter((course) => course.status !== "Rejected");
	const initialCourse = initialSlot
		? selectableCourses.find((course) => course.id === initialSlot.courseId) ??
			selectableCourses.find((course) => course.code === initialSlot.code)
		: selectableCourses[0];
	const [form, setForm] = useState<SlotForm>({
		code: initialSlot?.code ?? initialCourse?.code ?? "",
		course: initialSlot?.course ?? initialCourse?.title ?? "",
		courseId: initialSlot?.courseId ?? initialCourse?.id,
		day: "Monday",
		time: "08:00-10:00",
		room: initialSlot?.room ?? "",
		mode: "On-Site",
		level: initialSlot?.level ?? "200L",
		...(initialSlot
			? {
					day: initialSlot.day,
					time: initialSlot.time,
					mode: initialSlot.mode,
				}
			: {}),
	});
	const [formError, setFormError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const inputClass =
		"h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]";
	const canSubmit = Boolean(
		form.courseId &&
			form.code.trim() &&
			form.course.trim() &&
			form.day.trim() &&
			form.time.trim() &&
			form.room.trim() &&
			form.level.trim(),
	);

	function update<K extends keyof SlotForm>(key: K, value: SlotForm[K]) {
		setFormError("");
		setForm((current) => ({ ...current, [key]: value }));
	}

	function updateCourse(courseId: string) {
		const selected = selectableCourses.find((course) => course.id === courseId);

		setFormError("");
		setForm((current) => ({
			...current,
			courseId,
			code: selected?.code ?? current.code,
			course: selected?.title ?? current.course,
		}));
	}

	async function submit() {
		if (!canSubmit) {
			setFormError("Select a course and provide day, time, level, mode, and venue.");
			return;
		}

		setIsSubmitting(true);
		setFormError("");

		try {
			await onSubmit({
				...form,
				code: form.code.trim(),
				course: form.course.trim(),
				time: normaliseTime(form.time),
				room: form.room.trim(),
			});
			onClose();
		} catch (error) {
			setFormError(
				error instanceof Error ? error.message : "Unable to save timetable slot.",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
				<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
							Course Timeline
						</p>
						<h2 className="mt-2 text-xl font-black sm:text-2xl">
							{initialSlot ? "Edit timetable slot" : "Add timetable slot"}
						</h2>
						<p className="mt-1 text-sm font-semibold text-[#c5d4e8]">
							{initialSlot
								? "Update the teaching period saved in the live timetable."
								: "Create a teaching period in the live weekly calendar."}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#0D2B55]"
						aria-label="Close add slot form"
					>
						<X className="size-5" />
					</button>
				</div>

				<div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-5 sm:p-6">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="md:col-span-2">
							<Field label="Course">
								<select
									value={form.courseId ?? ""}
									onChange={(event) => updateCourse(event.target.value)}
									className={inputClass}
								>
									<option value="">Select a course</option>
									{selectableCourses.map((course) => (
										<option key={course.id} value={course.id}>
											{course.code} - {course.title}
										</option>
									))}
								</select>
							</Field>
						</div>
						<Field label="Day">
							<select
								value={form.day}
								onChange={(event) => update("day", event.target.value)}
								className={inputClass}
							>
								{DAYS.map((day) => (
									<option key={day} value={day}>
										{day}
									</option>
								))}
							</select>
						</Field>
						<Field label="Time">
							<input
								value={form.time}
								onChange={(event) => update("time", normaliseTime(event.target.value))}
								placeholder="10:00-12:00"
								className={inputClass}
							/>
						</Field>
						<Field label="Level">
							<select
								value={form.level}
								onChange={(event) => update("level", event.target.value as Level)}
								className={inputClass}
							>
								{LEVELS.map((level) => (
									<option key={level} value={level}>
										{level}
									</option>
								))}
							</select>
						</Field>
						<Field label="Mode">
							<select
								value={form.mode}
								onChange={(event) => update("mode", event.target.value as Mode)}
								className={inputClass}
							>
								{MODES.filter((mode) => mode !== "All Modes").map((mode) => (
									<option key={mode} value={mode}>
										{mode}
									</option>
								))}
							</select>
						</Field>
						<div className="md:col-span-2">
							<Field label="Venue or link">
								<input
									value={form.room}
									onChange={(event) => update("room", event.target.value)}
									placeholder="LT 2, Block A, or Online"
									className={inputClass}
								/>
							</Field>
						</div>
					</div>

					<div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#dbe5f1] pt-5 sm:flex-row sm:justify-end">
						{formError ? (
							<p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 sm:mr-auto">
								{formError}
							</p>
						) : null}
						<button
							type="button"
							onClick={onClose}
							disabled={isSubmitting}
							className="h-12 rounded-2xl border border-[#d3dfed] bg-white px-5 text-sm font-black text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
						>
							Cancel
						</button>
						<button
							type="button"
							disabled={!canSubmit || isSubmitting}
							onClick={submit}
							className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866] disabled:cursor-not-allowed disabled:opacity-40"
						>
							<Plus className="size-4" />
							{isSubmitting ? "Saving..." : initialSlot ? "Save Slot" : "Add Slot"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function SlotActionMenu({
	slot,
	isOpen,
	canManageTimetable,
	onToggle,
	onView,
	onEdit,
	onDelete,
}: {
	slot: TimelineSlot;
	isOpen: boolean;
	canManageTimetable: boolean;
	onToggle: () => void;
	onView: () => void;
	onEdit: () => void;
	onDelete: () => void;
}) {
	return (
		<div className="relative z-[60] shrink-0">
			<button
				type="button"
				onClick={onToggle}
				className="flex size-8 items-center justify-center rounded-xl bg-white/85 text-[#0D2B55] shadow-sm transition hover:bg-white"
				aria-expanded={isOpen}
				aria-label={`Open actions for ${slot.code} timetable slot`}
			>
				<MoreVertical className="size-4" />
			</button>
			{isOpen ? (
				<div className="absolute right-0 top-10 z-[90] w-36 overflow-hidden rounded-xl border border-[#dbe5f1] bg-white py-1 text-[#0D2B55] shadow-[0_18px_45px_rgba(13,43,85,0.22)]">
					<button
						type="button"
						onClick={onView}
						className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-black transition hover:bg-[#f6f9fd]"
					>
						<Eye className="size-4" />
						View
					</button>
					{canManageTimetable ? (
						<>
							<button
								type="button"
								onClick={onEdit}
								className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-black transition hover:bg-[#f6f9fd]"
							>
								<Pencil className="size-4" />
								Edit
							</button>
							<button
								type="button"
								onClick={onDelete}
								className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-black text-red-700 transition hover:bg-red-50"
							>
								<Trash2 className="size-4" />
								Delete
							</button>
						</>
					) : null}
				</div>
			) : null}
		</div>
	);
}

export default function Timetable({
	courses,
	slots,
	canManageTimetable = true,
	onAddSlot,
	onUpdateSlot,
	onDeleteSlot,
}: {
	courses: Course[];
	slots: TimelineSlot[];
	canManageTimetable?: boolean;
	onAddSlot?: (slot: SlotForm) => Promise<void> | void;
	onUpdateSlot?: (id: string, slot: SlotForm) => Promise<void> | void;
	onDeleteSlot?: (id: string) => Promise<void> | void;
}) {
	const [levelFilter, setLevelFilter] = useState<Level | "All Levels">("All Levels");
	const [modeFilter, setModeFilter] = useState<Mode | "All Modes">("All Modes");
	const [typeFilter, setTypeFilter] = useState<CourseType | "All Types">("All Types");
	const [searchQuery, setSearchQuery] = useState("");
	const [monthKey, setMonthKey] = useState(() => getMonthKey(new Date()));
	const [showModal, setShowModal] = useState<"add" | "edit" | null>(null);
	const [selectedSlot, setSelectedSlot] = useState<TimelineSlot | null>(null);
	const [openActionSlotId, setOpenActionSlotId] = useState<string | null>(null);

	const monthDates = useMemo(() => getMonthDates(monthKey), [monthKey]);
	const activeMonth = Number(monthKey.split("-")[1]) - 1;
	const todayKey = new Date().toDateString();
	const coursesBySlotKey = useMemo(() => {
		const lookup = new Map<string, Course>();

		for (const course of courses) {
			lookup.set(course.id, course);
			lookup.set(course.code, course);
		}

		return lookup;
	}, [courses]);

	const filteredSlots = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();

		return slots.filter((slot) => {
			const linkedCourse =
				coursesBySlotKey.get(slot.courseId ?? "") ?? coursesBySlotKey.get(slot.code);
			const levelMatch = levelFilter === "All Levels" || slot.level === levelFilter;
			const modeMatch = modeFilter === "All Modes" || slot.mode === modeFilter;
			const typeMatch = typeFilter === "All Types" || linkedCourse?.type === typeFilter;
			const queryMatch =
				!query ||
				[
					slot.code,
					slot.course,
					slot.room,
					slot.day,
					slot.level,
					slot.mode,
					linkedCourse?.department,
					linkedCourse?.lecturer,
					linkedCourse?.type,
				]
					.join(" ")
					.toLowerCase()
					.includes(query);

			return levelMatch && modeMatch && typeMatch && queryMatch;
		});
	}, [coursesBySlotKey, levelFilter, modeFilter, searchQuery, slots, typeFilter]);

	const slotsByDay = useMemo(() => {
		const grouped = new Map<string, TimelineSlot[]>();

		for (const slot of filteredSlots) {
			grouped.set(slot.day, [...(grouped.get(slot.day) ?? []), slot]);
		}

		for (const [day, daySlots] of grouped.entries()) {
			grouped.set(
				day,
				[...daySlots].sort(
					(left, right) =>
						left.time.localeCompare(right.time) ||
						left.code.localeCompare(right.code),
				),
			);
		}

		return grouped;
	}, [filteredSlots]);

	const analytics = useMemo(
		() => [
			{
				label: "Weekly Slots",
				value: slots.length,
				note: "Scheduled teaching periods",
				icon: CalendarClock,
			},
			{
				label: "Active Levels",
				value: new Set(slots.map((slot) => slot.level)).size,
				note: "Levels with classes",
				icon: Layers3,
			},
			{
				label: "On-site Rooms",
				value: slots.filter((slot) => slot.mode === "On-Site").length,
				note: "Physical class periods",
				icon: MapPin,
			},
			{
				label: "Online Slots",
				value: slots.filter((slot) => slot.mode === "Online").length,
				note: "Virtual class periods",
				icon: MonitorPlay,
			},
		],
		[slots],
	);

	function clearFilters() {
		setLevelFilter("All Levels");
		setModeFilter("All Modes");
		setTypeFilter("All Types");
		setSearchQuery("");
		setMonthKey(getMonthKey(new Date()));
		setOpenActionSlotId(null);
	}

	async function submitSlot(form: SlotForm) {
		const payload = {
			...form,
			time: normaliseTime(form.time),
		};

		if (showModal === "edit" && selectedSlot) {
			await onUpdateSlot?.(selectedSlot.id, payload);
			return;
		}

		await onAddSlot?.(payload);
	}

	async function removeSlot(slot: TimelineSlot) {
		setOpenActionSlotId(null);
		const confirmed = window.confirm(`Delete ${slot.code} from the timetable?`);

		if (!confirmed) return;

		await onDeleteSlot?.(slot.id);
	}

	return (
		<section className="space-y-5">
			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							Course Timeline
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							Weekly course calendar
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#556987]">
							Track teaching slots across levels, delivery modes, rooms, and
							monthly calendar patterns from the live course timetable.
						</p>
					</div>
					{canManageTimetable ? (
						<button
							type="button"
							onClick={() => {
								setSelectedSlot(null);
								setShowModal("add");
							}}
							className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866]"
						>
							<Plus className="size-4" />
							Add Slot
						</button>
					) : (
						<span className="rounded-full border border-[#dce6f2] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#6b7e9f]">
							View-only timeline
						</span>
					)}
				</div>

				<div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{analytics.map((item) => {
						const Icon = item.icon;

						return (
							<div
								key={item.label}
								className="group rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4 transition duration-300 hover:-translate-y-1 hover:border-[#b9c9dc] hover:bg-white hover:shadow-[0_18px_35px_rgba(13,43,85,0.08)]"
							>
								<div className="flex items-center justify-between gap-3">
									<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
										{item.label}
									</p>
									<span className="flex size-10 items-center justify-center rounded-2xl bg-white text-[#0D2B55] shadow-sm transition group-hover:bg-[#0D2B55] group-hover:text-white">
										<Icon className="size-4" />
									</span>
								</div>
								<p className="mt-3 text-3xl font-black text-[#0D2B55]">
									{item.value}
								</p>
								<p className="mt-1 text-sm font-semibold text-[#60728f]">
									{item.note}
								</p>
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
					<button
						type="button"
						onClick={clearFilters}
						className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#d3dfed] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
					>
						Reset filters
					</button>
				</div>

				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
					<label className="relative xl:col-span-2">
						<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
						<input
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder="Search course, code, room, lecturer"
							className="h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] pl-11 pr-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>
					<select
						value={levelFilter}
						onChange={(event) =>
							setLevelFilter(event.target.value as Level | "All Levels")
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="All Levels">All levels</option>
						{LEVELS.map((level) => (
							<option key={level} value={level}>
								{level}
							</option>
						))}
					</select>
					<select
						value={modeFilter}
						onChange={(event) =>
							setModeFilter(event.target.value as Mode | "All Modes")
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						{MODES.map((mode) => (
							<option key={mode} value={mode}>
								{mode}
							</option>
						))}
					</select>
					<select
						value={typeFilter}
						onChange={(event) =>
							setTypeFilter(event.target.value as CourseType | "All Types")
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						{COURSE_TYPES.map((type) => (
							<option key={type} value={type}>
								{type}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="rounded-3xl border border-[#d7e2f0] bg-white shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe5f1] px-4 py-4 sm:px-5">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
							Monthly Calendar
						</p>
						<p className="mt-1 text-sm font-semibold text-[#60728f]">
							Showing {filteredSlots.length} of {slots.length} weekly slots
							across {getMonthTitle(monthKey)}
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={() => {
								setOpenActionSlotId(null);
								setMonthKey((current) => shiftMonth(current, -1));
							}}
							className="flex size-11 items-center justify-center rounded-xl border border-[#d8e3f0] bg-white text-[#0D2B55] transition hover:border-[#bfd2e9] hover:bg-[#f6f9fd]"
							aria-label="Show previous month"
						>
							<ChevronLeft className="size-5" />
						</button>
						<div className="min-w-48 rounded-xl border border-[#d8e3f0] bg-[#f8fbff] px-4 py-2 text-center">
							<p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7486a0]">
								Month
							</p>
							<p className="text-sm font-black text-[#0D2B55]">
								{getMonthTitle(monthKey)}
							</p>
						</div>
						<button
							type="button"
							onClick={() => {
								setOpenActionSlotId(null);
								setMonthKey((current) => shiftMonth(current, 1));
							}}
							className="flex size-11 items-center justify-center rounded-xl border border-[#d8e3f0] bg-white text-[#0D2B55] transition hover:border-[#bfd2e9] hover:bg-[#f6f9fd]"
							aria-label="Show next month"
						>
							<ChevronRight className="size-5" />
						</button>
						<div className="flex items-center gap-2 rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-4 py-2 text-xs font-black text-[#0D2B55]">
							<Users className="size-4" />
							2025/2026 Session
						</div>
					</div>
				</div>

				<div className="overflow-x-auto app-scrollbar">
					<div className="min-w-[1080px]">
						<div className="grid grid-cols-7 bg-[#0D2B55] text-white">
							{WEEK_DAYS.map((day) => (
								<div
									key={day}
									className="border-r border-white/10 px-3 py-3 text-center text-xs font-black uppercase tracking-[0.14em] last:border-r-0"
								>
									{day}
								</div>
							))}
						</div>

						<div className="grid grid-cols-7">
							{monthDates.map((date, index) => {
								const dayName = FULL_DAYS[date.getDay()];
								const entries = slotsByDay.get(dayName) ?? [];
								const isOutsideMonth = date.getMonth() !== activeMonth;
								const isToday = date.toDateString() === todayKey;

								return (
									<section
										key={date.toISOString()}
										className={`relative min-h-64 border-r border-t border-[#dbe5f1] p-2.5 ${
											(index + 1) % 7 === 0 ? "border-r-0" : ""
										} ${
											isOutsideMonth
												? "bg-[#f8fbff] text-[#8a9bb3]"
												: "bg-white"
										}`}
									>
										<div className="flex items-center justify-between gap-2">
											<span
												className={`flex size-8 items-center justify-center rounded-full text-sm font-black ${
													isToday
														? "bg-[#0D2B55] text-white"
														: "bg-[#eef4fb] text-[#17305f]"
												}`}
											>
												{date.getDate()}
											</span>
											{entries.length ? (
												<span className="rounded-full bg-[#fff6e8] px-2 py-1 text-[10px] font-black text-[#9a5d08]">
													{entries.length}
												</span>
											) : null}
										</div>
										<div className="mt-2 space-y-2">
											{entries.map((entry) => {
												const tone = modeTone(entry.mode);
												const linkedCourse =
													coursesBySlotKey.get(entry.courseId ?? "") ??
													coursesBySlotKey.get(entry.code);

												return (
													<div
														key={`${date.toISOString()}-${entry.id}`}
														className={`relative rounded-2xl border p-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${tone.card}`}
													>
														<div className="flex items-start justify-between gap-2">
															<div className="min-w-0">
																<p className="truncate text-xs font-black">
																	{entry.code}
																</p>
																<p className="mt-1 line-clamp-2 text-sm font-black leading-5">
																	{entry.course}
																</p>
															</div>
															<SlotActionMenu
																slot={entry}
																isOpen={openActionSlotId === `${date.toISOString()}-${entry.id}`}
																canManageTimetable={canManageTimetable}
																onToggle={() =>
																	setOpenActionSlotId((current) =>
																		current === `${date.toISOString()}-${entry.id}`
																			? null
																			: `${date.toISOString()}-${entry.id}`,
																	)
																}
																onView={() => {
																	setOpenActionSlotId(null);
																	setSelectedSlot(entry);
																}}
																onEdit={() => {
																	setOpenActionSlotId(null);
																	setSelectedSlot(entry);
																	setShowModal("edit");
																}}
																onDelete={() => removeSlot(entry)}
															/>
														</div>
														<div className="mt-3 space-y-1.5 text-xs font-bold">
															<span className="flex items-center gap-2">
																<Clock3 className="size-3.5" />
																{formatTime(entry.time)}
															</span>
															<span className="flex items-center gap-2">
																<MapPin className="size-3.5" />
																{entry.room || "Venue TBD"}
															</span>
														</div>
														<div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black">
															<span className="rounded-full bg-white/75 px-2.5 py-1">
																{entry.level}
															</span>
															<span className="rounded-full bg-white/75 px-2.5 py-1">
																{entry.mode}
															</span>
															{linkedCourse?.type ? (
																<span className="rounded-full bg-white/75 px-2.5 py-1">
																	{linkedCourse.type}
																</span>
															) : null}
														</div>
													</div>
												);
											})}
										</div>
									</section>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			{selectedSlot && !showModal ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
					<div className="w-full max-w-lg rounded-3xl border border-[#dbe5f1] bg-white p-6 shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
									Timetable Slot
								</p>
								<h2 className="mt-2 text-xl font-black text-[#06183A]">
									{selectedSlot.code} - {selectedSlot.course}
								</h2>
							</div>
							<button
								type="button"
								onClick={() => setSelectedSlot(null)}
								className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#d3dfed] bg-white text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
								aria-label="Close timetable slot details"
							>
								<X className="size-5" />
							</button>
						</div>
						<div className="mt-5 grid gap-3 text-sm font-bold text-[#0D2B55] sm:grid-cols-2">
							{[
								["Day", selectedSlot.day],
								["Time", formatTime(selectedSlot.time)],
								["Level", selectedSlot.level],
								["Mode", selectedSlot.mode],
								["Venue", selectedSlot.room || "Venue TBD"],
							].map(([label, value]) => (
								<div key={label} className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
									<p className="text-[10px] uppercase tracking-[0.18em] text-[#8395AF]">
										{label}
									</p>
									<p className="mt-2">{value}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			) : null}

			{showModal ? (
				<AddSlotModal
					courses={courses}
					initialSlot={showModal === "edit" ? selectedSlot : null}
					onSubmit={submitSlot}
					onClose={() => {
						setShowModal(null);
						setSelectedSlot(null);
					}}
				/>
			) : null}
		</section>
	);
}
