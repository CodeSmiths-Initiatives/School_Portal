"use client";

import { useState } from "react";
import { Course, CourseType, Level, Mode } from "../types/course.types";
import { Button } from "@/components/ui/button";

interface Props {
	onSave: (course: Omit<Course, "id">) => void;
	onCancel: () => void;
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

// ─── Shared input class ───────────────────────────────────────────────────────
const inp = (err?: string) =>
	`w-full border rounded-xl px-4 py-3 text-sm text-[#1a2b52] bg-white
	placeholder:text-[#b0bcd4] outline-none transition-all
	focus:border-[#3d5a9e] focus:ring-2 focus:ring-[#3d5a9e]/10
	${err ? "border-red-400 bg-red-50" : "border-[#dce6f2]"}`;

// ─── Field wrapper ────────────────────────────────────────────────────────────
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
			<label className="text-[10px] font-bold tracking-widest text-[#4a5a7a] uppercase">
				{label}
			</label>
			{children}
			{error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
		</div>
	);
}

// ─── Section heading with emoji ───────────────────────────────────────────────
function SectionHeading({ emoji, label }: { emoji: string; label: string }) {
	return (
		<div className="flex items-center gap-2 mb-1">
			<span className="text-base">{emoji}</span>
			<h3 className="text-sm font-bold text-[#1a2b52]">{label}</h3>
		</div>
	);
}

export default function DefineNewCourse({ onSave, onCancel }: Props) {
	const [form, setForm] = useState({
		code: "",
		title: "",
		description: "",
		type: "" as CourseType | "",
		units: "" as number | "",
		department: "Computer Science",
		semester: "1st Semester",
		// Level Allocation
		levels: [] as Level[],
		maxStudents: "",
		lecturer: "Dr. Adeyemi Bolaji",
		// Timetable Slot
		day: "Monday",
		timeSlot: "8:00 - 10:00",
		mode: "On-Site" as Mode,
		venue: "",
		// For compatibility with Course type
		schedule: "",
		status: "Pending" as const,
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	function set(field: string, value: unknown) {
		setForm((p) => ({ ...p, [field]: value }));
		if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
	}

	function toggleLevel(l: Level) {
		setForm((p) => ({
			...p,
			levels: p.levels.includes(l)
				? p.levels.filter((x) => x !== l)
				: [...p.levels, l],
		}));
		if (errors.levels) setErrors((p) => ({ ...p, levels: "" }));
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const errs: Record<string, string> = {};
		if (!form.code.trim()) errs.code = "Course code is required";
		if (!form.title.trim()) errs.title = "Course title is required";
		if (!form.type) errs.type = "Course type is required";
		if (!form.units) errs.units = "Credit units is required";
		if (form.levels.length === 0) errs.levels = "Select at least one level";
		if (!form.lecturer.trim()) errs.lecturer = "Lecturer name is required";
		if (Object.keys(errs).length) {
			setErrors(errs);
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
			status: "Pending",
		});
	}

	return (
		<div className="flex flex-col gap-5">
			<div className="flex items-start justify-between">
				<div>
					<p className="text-2xl text-black font-semibold mb-1">
						Define New Course
					</p>
					<p className="text-xs text-[#808B96]">
						Dept. of Computer Science 2025/2026
					</p>
				</div>
				<div>
					<Button>2025/2026</Button>
				</div>
			</div>

			{/* Page heading */}
			<div>
				<h2 className="text-2xl font-bold text-[#1a2b52]">Define New Course</h2>
				<p className="text-xs text-[#8a9ab5] mt-0.5">
					Create a course definition — submitted for HOD approval before
					publishing
				</p>
			</div>

			<form
				onSubmit={handleSubmit}
				className="bg-white rounded-2xl border border-[#e4eaf4] p-7 flex flex-col gap-5 shadow-sm"
			>
				{/* Row 1: Course Code + Course Title */}
				<div className="grid grid-cols-2 gap-5">
					<Field label="Course Code" error={errors.code}>
						<input
							className={inp(errors.code)}
							placeholder="e.g. CSC301"
							value={form.code}
							onChange={(e) => set("code", e.target.value)}
						/>
					</Field>
					<Field label="Course Title" error={errors.title}>
						<input
							className={inp(errors.title)}
							placeholder="e.g. Software Engineering"
							value={form.title}
							onChange={(e) => set("title", e.target.value)}
						/>
					</Field>
				</div>

				{/* Row 2: Description — full width */}
				<Field label="Description">
					<textarea
						className={`${inp()} resize-y min-h-[90px]`}
						placeholder="Brief course description..."
						value={form.description}
						onChange={(e) => set("description", e.target.value)}
					/>
				</Field>

				{/* Row 3: Course Type + Credit Units */}
				<div className="grid grid-cols-2 gap-5">
					<Field label="Course Type" error={errors.type}>
						<div className="relative">
							<select
								className={`${inp(errors.type)} appearance-none pr-9`}
								value={form.type}
								onChange={(e) => set("type", e.target.value as CourseType)}
							>
								<option value="" disabled>
									Select type...
								</option>
								{["Core", "Elective", "Required", "Borrowed"].map((t) => (
									<option key={t} value={t}>
										{t}
									</option>
								))}
							</select>
							<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9ab5] pointer-events-none text-xs">
								▾
							</span>
						</div>
					</Field>
					<Field label="Credit Units" error={errors.units}>
						<div className="relative">
							<select
								className={`${inp(errors.units)} appearance-none pr-9`}
								value={form.units}
								onChange={(e) =>
									set("units", e.target.value ? Number(e.target.value) : "")
								}
							>
								<option value="" disabled>
									Units...
								</option>
								{CREDIT_UNIT_OPTIONS.map((u) => (
									<option key={u} value={u}>
										{u} Unit{u > 1 ? "s" : ""}
									</option>
								))}
							</select>
							<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9ab5] pointer-events-none text-xs">
								▾
							</span>
						</div>
					</Field>
				</div>

				{/* Row 4: Offering Dept. + Semester */}
				<div className="grid grid-cols-2 gap-5">
					<Field label="Offering Dept.">
						<input
							className={inp()}
							value={form.department}
							onChange={(e) => set("department", e.target.value)}
						/>
					</Field>
					<Field label="Semester">
						<div className="relative">
							<select
								className={`${inp()} appearance-none pr-9`}
								value={form.semester}
								onChange={(e) => set("semester", e.target.value)}
							>
								{SEMESTERS.map((s) => (
									<option key={s} value={s}>
										{s}
									</option>
								))}
							</select>
							<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9ab5] pointer-events-none text-xs">
								▾
							</span>
						</div>
					</Field>
				</div>

				{/* ─── Level Allocation section ─── */}
				<div className="flex flex-col gap-4 pt-1">
					<SectionHeading emoji="📊" label="Level Allocation" />
					<div className="grid grid-cols-3 gap-5">
						{/* Applicable Levels — scrollable listbox */}
						<Field label="Applicable Levels" error={errors.levels}>
							<div className="border border-[#dce6f2] rounded-xl bg-white overflow-hidden">
								{LEVELS.map((l) => (
									<button
										key={l.value}
										type="button"
										onClick={() => toggleLevel(l.value)}
										className={`w-full text-left px-4 py-2.5 text-sm transition-colors
											${
												form.levels.includes(l.value)
													? "bg-[#dde8f5] text-[#1a2b52] font-semibold"
													: "text-[#4a5a7a] hover:bg-[#f7f9fd]"
											}`}
									>
										{l.label}
									</button>
								))}
							</div>
						</Field>

						{/* Max Students */}
						<Field label="Max. Students">
							<input
								className={inp()}
								type="number"
								placeholder="e.g. 120"
								value={form.maxStudents}
								onChange={(e) => set("maxStudents", e.target.value)}
							/>
						</Field>

						{/* Lecturer Name */}
						<Field label="Lecturer Name" error={errors.lecturer}>
							<input
								className={inp(errors.lecturer)}
								placeholder="Dr. Adeyemi Bolaji"
								value={form.lecturer}
								onChange={(e) => set("lecturer", e.target.value)}
							/>
						</Field>
					</div>
				</div>

				{/* ─── Timetable Slot section ─── */}
				<div className="flex flex-col gap-4 pt-1">
					<SectionHeading emoji="🗓️" label="Timetable Slot" />

					{/* Row: Day + Time Slot + Mode */}
					<div className="grid grid-cols-3 gap-5">
						<Field label="Day">
							<div className="relative">
								<select
									className={`${inp()} appearance-none pr-9`}
									value={form.day}
									onChange={(e) => set("day", e.target.value)}
								>
									{DAYS.map((d) => (
										<option key={d} value={d}>
											{d}
										</option>
									))}
								</select>
								<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9ab5] pointer-events-none text-xs">
									▾
								</span>
							</div>
						</Field>
						<Field label="Time Slot">
							<div className="relative">
								<select
									className={`${inp()} appearance-none pr-9`}
									value={form.timeSlot}
									onChange={(e) => set("timeSlot", e.target.value)}
								>
									{TIME_SLOTS.map((t) => (
										<option key={t} value={t}>
											{t}
										</option>
									))}
								</select>
								<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9ab5] pointer-events-none text-xs">
									▾
								</span>
							</div>
						</Field>
						<Field label="Mode">
							<div className="relative">
								<select
									className={`${inp()} appearance-none pr-9`}
									value={form.mode}
									onChange={(e) => set("mode", e.target.value as Mode)}
								>
									{["On-Site", "Online", "Hybrid"].map((m) => (
										<option key={m} value={m}>
											{m}
										</option>
									))}
								</select>
								<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9ab5] pointer-events-none text-xs">
									▾
								</span>
							</div>
						</Field>
					</div>

					{/* Venue / Room */}
					<Field label="Venue / Room">
						<input
							className={inp()}
							placeholder="e.g. LT1, Block C"
							value={form.venue}
							onChange={(e) => set("venue", e.target.value)}
						/>
					</Field>
				</div>

				{/* ─── Action buttons ─── */}
				<div className="flex gap-3 pt-2 border-t border-[#f0f5fb]">
					<button
						type="submit"
						className="px-7 py-3 rounded-xl bg-[#3d5a9e] hover:bg-[#2d4a8e] text-white text-sm font-bold
							shadow-md shadow-[#3d5a9e]/30 transition-all hover:-translate-y-0.5"
					>
						Submit for Approval
					</button>
					<button
						type="button"
						onClick={onCancel}
						className="px-7 py-3 rounded-xl border-2 border-[#dce6f2] text-[#4a5a7a] text-sm font-semibold
							hover:border-[#8a9ab5] transition-colors"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
}
