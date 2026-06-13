"use client";

import { useState } from "react";
import type { Course, CourseType, Level, Mode } from "../types/course.types";

interface Props {
	onSave: (course: Omit<Course, "id">) => void;
	onCancel: () => void;
	initialCourse?: Course;
	saveLabel?: string;
}

const LEVELS: { value: Level; label: string }[] = [
	{ value: "100L", label: "100 Level" },
	{ value: "200L", label: "200 Level" },
	{ value: "300L", label: "300 Level" },
	{ value: "400L", label: "400 Level" },
];

const CREDIT_UNIT_OPTIONS = [1, 2, 3, 4, 5, 6];
const TIME_SLOTS = [
	"8:00 - 10:00",
	"10:00 - 12:00",
	"12:00 - 14:00",
	"14:00 - 16:00",
	"16:00 - 18:00",
];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const SEMESTERS = ["1st Semester", "2nd Semester"];

const inputClass = (error?: string) =>
	`w-full rounded-xl border px-4 py-3 text-sm text-[#1a2b52] bg-white
	placeholder:text-[#b0bcd4] outline-none transition-all
	focus:border-[#3d5a9e] focus:ring-2 focus:ring-[#3d5a9e]/10
	${error ? "border-red-400 bg-red-50" : "border-[#dce6f2]"}`;

function Field({
	label,
	error,
	children,
}: {
	label: string;
	error?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<label className="text-[10px] font-bold uppercase tracking-widest text-[#4a5a7a]">
				{label}
			</label>
			{children}
			{error ? (
				<p className="text-[11px] font-medium text-red-500">{error}</p>
			) : null}
		</div>
	);
}

function SectionHeading({ label }: { label: string }) {
	return (
		<div className="border-b border-[#edf2f8] pb-2">
			<h3 className="text-sm font-black text-[#1a2b52]">{label}</h3>
		</div>
	);
}

function splitSchedule(schedule?: string) {
	if (!schedule) {
		return { day: "Monday", timeSlot: "8:00 - 10:00" };
	}

	const day = DAYS.find((item) => schedule.startsWith(item)) ?? "Monday";
	const timeSlot = schedule.replace(day, "").trim() || "8:00 - 10:00";

	return { day, timeSlot };
}

export default function DefineNewCourse({
	onSave,
	onCancel,
	initialCourse,
	saveLabel = "Submit for Approval",
}: Props) {
	const initialSchedule = splitSchedule(initialCourse?.schedule);
	const [form, setForm] = useState({
		code: initialCourse?.code ?? "",
		title: initialCourse?.title ?? "",
		description: initialCourse?.description ?? "",
		type: initialCourse?.type ?? ("" as CourseType | ""),
		units: initialCourse?.units ?? ("" as number | ""),
		department: initialCourse?.department ?? "Computer Science",
		semester: "1st Semester",
		levels: initialCourse?.levels ?? ([] as Level[]),
		maxStudents: "",
		lecturer: initialCourse?.lecturer ?? "Dr. Adeyemi Bolaji",
		day: initialSchedule.day,
		timeSlot: initialSchedule.timeSlot,
		mode: initialCourse?.mode ?? ("On-Site" as Mode),
		venue: "",
		status: initialCourse?.status ?? ("Pending" as const),
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	function set(field: string, value: unknown) {
		setForm((current) => ({ ...current, [field]: value }));
		if (errors[field]) {
			setErrors((current) => ({ ...current, [field]: "" }));
		}
	}

	function toggleLevel(level: Level) {
		setForm((current) => ({
			...current,
			levels: current.levels.includes(level)
				? current.levels.filter((item) => item !== level)
				: [...current.levels, level],
		}));
		if (errors.levels) {
			setErrors((current) => ({ ...current, levels: "" }));
		}
	}

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		const nextErrors: Record<string, string> = {};

		if (!form.code.trim()) nextErrors.code = "Course code is required";
		if (!form.title.trim()) nextErrors.title = "Course title is required";
		if (!form.type) nextErrors.type = "Course type is required";
		if (!form.units) nextErrors.units = "Credit units is required";
		if (form.levels.length === 0) {
			nextErrors.levels = "Select at least one level";
		}
		if (!form.lecturer.trim()) {
			nextErrors.lecturer = "Lecturer name is required";
		}

		if (Object.keys(nextErrors).length) {
			setErrors(nextErrors);
			return;
		}

		onSave({
			code: form.code,
			title: form.title,
			description: form.description,
			type: form.type as CourseType,
			units: form.units as number,
			department: form.department,
			levels: form.levels,
			mode: form.mode,
			schedule: `${form.day} ${form.timeSlot}`,
			lecturer: form.lecturer,
			status: form.status,
		});
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="rounded-3xl border border-[#dbe5f1] bg-white p-4 shadow-sm sm:p-6"
		>
			<div className="flex flex-col gap-5">
				<div className="grid gap-5 md:grid-cols-2">
					<Field label="Course Code" error={errors.code}>
						<input
							className={inputClass(errors.code)}
							placeholder="e.g. CSC301"
							value={form.code}
							onChange={(event) => set("code", event.target.value)}
						/>
					</Field>
					<Field label="Course Title" error={errors.title}>
						<input
							className={inputClass(errors.title)}
							placeholder="e.g. Software Engineering"
							value={form.title}
							onChange={(event) => set("title", event.target.value)}
						/>
					</Field>
				</div>

				<Field label="Description">
					<textarea
						className={`${inputClass()} min-h-[90px] resize-y`}
						placeholder="Brief course description..."
						value={form.description}
						onChange={(event) => set("description", event.target.value)}
					/>
				</Field>

				<div className="grid gap-5 md:grid-cols-2">
					<Field label="Course Type" error={errors.type}>
						<select
							className={`${inputClass(errors.type)} appearance-none pr-9`}
							value={form.type}
							onChange={(event) => set("type", event.target.value as CourseType)}
						>
							<option value="" disabled>
								Select type...
							</option>
							{["Core", "Elective", "Required", "Borrowed"].map((type) => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>
					</Field>
					<Field label="Credit Units" error={errors.units}>
						<select
							className={`${inputClass(errors.units)} appearance-none pr-9`}
							value={form.units}
							onChange={(event) =>
								set("units", event.target.value ? Number(event.target.value) : "")
							}
						>
							<option value="" disabled>
								Units...
							</option>
							{CREDIT_UNIT_OPTIONS.map((unit) => (
								<option key={unit} value={unit}>
									{unit} Unit{unit > 1 ? "s" : ""}
								</option>
							))}
						</select>
					</Field>
				</div>

				<div className="grid gap-5 md:grid-cols-2">
					<Field label="Offering Dept.">
						<input
							className={inputClass()}
							value={form.department}
							onChange={(event) => set("department", event.target.value)}
						/>
					</Field>
					<Field label="Semester">
						<select
							className={`${inputClass()} appearance-none pr-9`}
							value={form.semester}
							onChange={(event) => set("semester", event.target.value)}
						>
							{SEMESTERS.map((semester) => (
								<option key={semester} value={semester}>
									{semester}
								</option>
							))}
						</select>
					</Field>
				</div>

				<div className="flex flex-col gap-4 pt-1">
					<SectionHeading label="Level Allocation" />
					<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
						<Field label="Applicable Levels" error={errors.levels}>
							<div className="overflow-hidden rounded-xl border border-[#dce6f2] bg-white">
								{LEVELS.map((level) => (
									<button
										key={level.value}
										type="button"
										onClick={() => toggleLevel(level.value)}
										className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
											form.levels.includes(level.value)
												? "bg-[#dde8f5] font-semibold text-[#1a2b52]"
												: "text-[#4a5a7a] hover:bg-[#f7f9fd]"
										}`}
									>
										{level.label}
									</button>
								))}
							</div>
						</Field>
						<Field label="Max. Students">
							<input
								className={inputClass()}
								type="number"
								placeholder="e.g. 120"
								value={form.maxStudents}
								onChange={(event) => set("maxStudents", event.target.value)}
							/>
						</Field>
						<Field label="Lecturer Name" error={errors.lecturer}>
							<input
								className={inputClass(errors.lecturer)}
								placeholder="Dr. Adeyemi Bolaji"
								value={form.lecturer}
								onChange={(event) => set("lecturer", event.target.value)}
							/>
						</Field>
					</div>
				</div>

				<div className="flex flex-col gap-4 pt-1">
					<SectionHeading label="Timetable Slot" />
					<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
						<Field label="Day">
							<select
								className={`${inputClass()} appearance-none pr-9`}
								value={form.day}
								onChange={(event) => set("day", event.target.value)}
							>
								{DAYS.map((day) => (
									<option key={day} value={day}>
										{day}
									</option>
								))}
							</select>
						</Field>
						<Field label="Time Slot">
							<select
								className={`${inputClass()} appearance-none pr-9`}
								value={form.timeSlot}
								onChange={(event) => set("timeSlot", event.target.value)}
							>
								{TIME_SLOTS.map((timeSlot) => (
									<option key={timeSlot} value={timeSlot}>
										{timeSlot}
									</option>
								))}
							</select>
						</Field>
						<Field label="Mode">
							<select
								className={`${inputClass()} appearance-none pr-9`}
								value={form.mode}
								onChange={(event) => set("mode", event.target.value as Mode)}
							>
								{["On-Site", "Online", "Hybrid"].map((mode) => (
									<option key={mode} value={mode}>
										{mode}
									</option>
								))}
							</select>
						</Field>
					</div>

					<Field label="Venue / Room">
						<input
							className={inputClass()}
							placeholder="e.g. LT1, Block C"
							value={form.venue}
							onChange={(event) => set("venue", event.target.value)}
						/>
					</Field>
				</div>

				<div className="flex flex-col gap-3 border-t border-[#f0f5fb] pt-2 sm:flex-row">
					<button
						type="submit"
						className="inline-flex items-center justify-center rounded-2xl bg-[#0D2B55] px-6 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866]"
					>
						{saveLabel}
					</button>
					<button
						type="button"
						onClick={onCancel}
						className="inline-flex items-center justify-center rounded-2xl border border-[#dbe5f1] px-6 py-3 text-sm font-black text-[#0D2B55] transition hover:border-[#0D2B55]"
					>
						Cancel
					</button>
				</div>
			</div>
		</form>
	);
}
