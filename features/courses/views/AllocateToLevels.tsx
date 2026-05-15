"use client";

import { useState } from "react";
import { Course, Level, CourseType } from "../types/course.types";
import { Button } from "@/components/ui/button";

interface Props {
	courses: Course[];
}

// ─── Level group header colors ────────────────────────────────────────────────
const LEVEL_META: Record<
	Level,
	{ emoji: string; textColor: string; bgColor: string }
> = {
	"100L": { emoji: "📘", textColor: "text-blue-600", bgColor: "bg-blue-50" },
	"200L": {
		emoji: "📗",
		textColor: "text-emerald-600",
		bgColor: "bg-emerald-50",
	},
	"300L": {
		emoji: "📙",
		textColor: "text-orange-500",
		bgColor: "bg-orange-50",
	},
	"400L": { emoji: "📕", textColor: "text-red-500", bgColor: "bg-red-50" },
};

// Level badge pill (200L, 300L etc.)
const LEVEL_PILL: Record<Level, string> = {
	"100L": "bg-blue-100   text-blue-700",
	"200L": "bg-emerald-100 text-emerald-700",
	"300L": "bg-emerald-100 text-emerald-700",
	"400L": "bg-emerald-100 text-emerald-700",
};

// Type pill colors
const TYPE_PILL: Record<string, string> = {
	Core: "bg-teal-100   text-teal-700",
	Elective: "bg-blue-100   text-blue-700",
	Required: "bg-red-100    text-red-600",
	Borrowed: "bg-orange-100 text-orange-600",
};

const ALL_LEVELS: Level[] = ["100L", "200L", "300L", "400L"];

// ─── New Allocation modal ─────────────────────────────────────────────────────
function NewAllocationModal({
	courses,
	onAdd,
	onClose,
}: {
	courses: Course[];
	onAdd: (courseId: string, level: Level) => void;
	onClose: () => void;
}) {
	const [selectedCourse, setSelectedCourse] = useState("");
	const [selectedLevel, setSelectedLevel] = useState<Level>("200L");

	const sel = `w-full border border-[#dce6f2] rounded-xl px-4 py-3 text-sm text-[#1a2b52]
		bg-white outline-none focus:border-[#3d5a9e] appearance-none`;

	return (
		<div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
			<div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7">
				<div className="flex items-center justify-between mb-5">
					<h3 className="text-base font-bold text-[#1a2b52]">New Allocation</h3>
					<button
						onClick={onClose}
						className="w-8 h-8 rounded-lg border border-[#dce6f2] flex items-center justify-center text-[#8a9ab5] hover:text-[#1a2b52] text-sm"
					>
						✕
					</button>
				</div>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-[10px] font-bold tracking-widest text-[#4a5a7a] uppercase">
							Course
						</label>
						<div className="relative">
							<select
								className={sel}
								value={selectedCourse}
								onChange={(e) => setSelectedCourse(e.target.value)}
							>
								<option value="" disabled>
									Select a course...
								</option>
								{courses
									.filter((c) => c.status === "Approved")
									.map((c) => (
										<option key={c.id} value={c.id}>
											{c.code} — {c.title}
										</option>
									))}
							</select>
							<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9ab5] pointer-events-none text-xs">
								▾
							</span>
						</div>
					</div>
					<div className="flex flex-col gap-1.5">
						<label className="text-[10px] font-bold tracking-widest text-[#4a5a7a] uppercase">
							Level
						</label>
						<div className="relative">
							<select
								className={sel}
								value={selectedLevel}
								onChange={(e) => setSelectedLevel(e.target.value as Level)}
							>
								{ALL_LEVELS.map((l) => (
									<option key={l} value={l}>
										{l.replace("L", " Level")}
									</option>
								))}
							</select>
							<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9ab5] pointer-events-none text-xs">
								▾
							</span>
						</div>
					</div>
					<div className="flex gap-3 pt-1">
						<button
							disabled={!selectedCourse}
							onClick={() => {
								if (selectedCourse) {
									onAdd(selectedCourse, selectedLevel);
									onClose();
								}
							}}
							className="flex-1 py-3 rounded-xl bg-[#3d5a9e] hover:bg-[#2d4a8e] disabled:opacity-40 text-white text-sm font-bold transition-all"
						>
							Add Allocation
						</button>
						<button
							onClick={onClose}
							className="flex-1 py-3 rounded-xl border-2 border-[#dce6f2] text-[#4a5a7a] text-sm font-semibold hover:border-[#8a9ab5] transition-colors"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AllocateToLevels({ courses }: Props) {
	// Build initial allocation rows: each course × each of its assigned levels
	const [rows, setRows] = useState<{ courseId: string; level: Level }[]>(() =>
		courses.flatMap((c) => c.levels.map((l) => ({ courseId: c.id, level: l }))),
	);
	const [showModal, setShowModal] = useState(false);

	function addAllocation(courseId: string, level: Level) {
		// Prevent duplicate
		if (!rows.find((r) => r.courseId === courseId && r.level === level)) {
			setRows((prev) => [...prev, { courseId, level }]);
		}
	}

	function removeRow(courseId: string, level: Level) {
		setRows((prev) =>
			prev.filter((r) => !(r.courseId === courseId && r.level === level)),
		);
	}

	// Group rows by level
	const byLevel: Record<Level, { courseId: string; level: Level }[]> = {
		"100L": [],
		"200L": [],
		"300L": [],
		"400L": [],
	};
	rows.forEach((r) => byLevel[r.level]?.push(r));

	const activeLevels = ALL_LEVELS.filter((l) => byLevel[l].length > 0);

	const COL_HEADERS = [
		"LEVEL",
		"COURSE CODE",
		"COURSE TITLE",
		"UNITS",
		"TYPE",
		"SEMESTER",
		"LECTURER",
		"STATUS",
		"",
	];

	return (
		<div className="flex flex-col gap-5">
			<div className="flex items-start justify-between">
				<div>
					<p className="text-2xl text-black font-semibold mb-1">
						Level Allocations
					</p>
					<p className="text-xs text-[#8a9ab5]">
						Dept. of Computer Science · 2025/2026
					</p>
				</div>
				<div>
					<Button className="border border-[#dce6f2] rounded-full px-4 py-1.5 text-xs font-bold text-[#4a5a7a] bg-white mt-1">
						2025/2026
					</Button>
				</div>
			</div>
			{/* Page heading */}
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold text-[#1a2b52] mt-1">
						Course Allocation by Level
					</h1>
					<p className="text-xs text-[#8a9ab5] mt-0.5">
						Assign approved courses to specific student levels
					</p>
				</div>
			</div>

			{/* Table card */}
			<div className="bg-white rounded-2xl border border-[#e4eaf4] shadow-sm overflow-hidden">
				{/* Card header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f5fb]">
					<h2 className="font-bold text-[#1a2b52] text-base">
						Level Allocations
					</h2>
					<button
						onClick={() => setShowModal(true)}
						className="flex items-center gap-1.5 bg-[#3d5a9e] hover:bg-[#2d4a8e] text-white
							text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-[#3d5a9e]/20"
					>
						<span>+</span> New Allocation
					</button>
				</div>

				{/* Column headers */}
				<div
					className="grid grid-cols-[70px_110px_1fr_60px_90px_120px_140px_110px_40px]
					px-6 py-3 bg-[#f7f9fd] border-b border-[#eef3fb]"
				>
					{COL_HEADERS.map((h, i) => (
						<span
							key={i}
							className="text-[10px] font-bold tracking-widest text-[#8a9ab5] uppercase"
						>
							{h}
						</span>
					))}
				</div>

				{/* Rows grouped by level */}
				{activeLevels.length === 0 ? (
					<div className="px-6 py-12 text-center">
						<p className="text-sm text-[#8a9ab5]">
							No allocations yet. Click <strong>+ New Allocation</strong> to
							begin.
						</p>
					</div>
				) : (
					activeLevels.map((level) => {
						const meta = LEVEL_META[level];
						const levelRows = byLevel[level];
						return (
							<div key={level}>
								{/* Level group header */}
								<div
									className={`flex items-center gap-2 px-6 py-2.5 ${meta.bgColor} border-b border-[#eef3fb]`}
								>
									<span className="text-sm">{meta.emoji}</span>
									<span className={`text-sm font-bold ${meta.textColor}`}>
										{level.replace("L", " Level")}
									</span>
								</div>

								{/* Rows for this level */}
								{levelRows.map((row, i) => {
									const course = courses.find((c) => c.id === row.courseId);
									if (!course) return null;

									// Derive semester from schedule or default
									const semester = course.schedule
										?.toLowerCase()
										.includes("1st")
										? "1st Semester"
										: course.schedule?.toLowerCase().includes("2nd")
											? "2nd Semester"
											: "1st Semester";

									return (
										<div
											key={`${row.courseId}-${row.level}`}
											className={`grid grid-cols-[70px_110px_1fr_60px_90px_120px_140px_110px_40px]
												px-6 py-4 items-center border-b border-[#f5f5f0] last:border-0
												${i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"} hover:bg-[#f7f9fd] transition-colors`}
										>
											{/* Level badge */}
											<span
												className={`text-[11px] font-bold px-2.5 py-1 rounded-full w-fit ${LEVEL_PILL[row.level]}`}
											>
												{row.level}
											</span>

											{/* Course code */}
											<span className="text-sm font-bold text-[#1a2b52]">
												{course.code}
											</span>

											{/* Course title */}
											<span className="text-sm text-[#4a5a7a] pr-2">
												{course.title}
											</span>

											{/* Units */}
											<span className="text-sm text-[#4a5a7a]">
												{course.units} U
											</span>

											{/* Type pill */}
											<span
												className={`text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit
												${TYPE_PILL[course.type] ?? "bg-gray-100 text-gray-600"}`}
											>
												{course.type.toLowerCase()}
											</span>

											{/* Semester */}
											<span className="text-sm text-[#4a5a7a]">{semester}</span>

											{/* Lecturer */}
											<span className="text-sm text-[#4a5a7a]">
												{course.lecturer}
											</span>

											{/* Status pill */}
											<span
												className={`text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit
												${
													course.status === "Approved"
														? "bg-emerald-50 text-emerald-600 border border-emerald-200"
														: course.status === "Pending"
															? "bg-amber-50 text-amber-600 border border-amber-200"
															: "bg-red-50 text-red-600 border border-red-200"
												}`}
											>
												{course.status.toLowerCase()}
											</span>

											{/* Remove */}
											<button
												onClick={() => removeRow(row.courseId, row.level)}
												className="text-[#c0c8d8] hover:text-red-400 transition-colors text-base font-bold"
												title="Remove allocation"
											>
												×
											</button>
										</div>
									);
								})}
							</div>
						);
					})
				)}
			</div>

			{/* New Allocation modal */}
			{showModal && (
				<NewAllocationModal
					courses={courses}
					onAdd={addAllocation}
					onClose={() => setShowModal(false)}
				/>
			)}
		</div>
	);
}
