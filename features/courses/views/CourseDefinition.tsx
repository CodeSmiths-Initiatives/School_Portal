"use client";

import { useState } from "react";
import { Course, CourseStatus, CourseType, Level } from "../types/course.types";
import CourseCard from "../components/CourseCard";

const LEVELS: Level[] = ["100L", "200L", "300L", "400L"];

interface Props {
	courses: Course[];
	stats: { core: number; elective: number; required: number; borrowed: number };
	searchQuery: string;
	onSearch: (q: string) => void;
	typeFilter: CourseType | "All Types";
	onTypeFilter: (t: CourseType | "All Types") => void;
	statusFilter: CourseStatus | "All Status";
	onStatusFilter: (s: CourseStatus | "All Status") => void;
	activeLevel: Level | null;
	onLevelFilter: (l: Level | null) => void;
	onDefineNew: () => void;
}

// Shared pill button class
function pillBtn(active: boolean) {
	return `px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap
    ${
			active
				? "bg-[#0E50BD] text-white border-[#0E50BD] shadow-sm"
				: "bg-white text-[#4a5a7a] border-[#dce6f2] hover:border-[#0E50BD] hover:text-[#0E50BD]"
		}`;
}

export default function CourseDefinition({
	courses,
	stats,
	searchQuery,
	onSearch,
	typeFilter,
	onTypeFilter,
	statusFilter,
	onStatusFilter,
	activeLevel,
	onLevelFilter,
	onDefineNew,
}: Props) {
	const [viewCourse, setViewCourse] = useState<Course | null>(null);

	const STAT_CARDS = [
		{
			label: "CORE COURSES",
			value: stats.core,
			sub: "Active this session",
			border: "border-t-emerald-500",
		},
		{
			label: "ELECTIVE",
			value: stats.elective,
			sub: "Available choices",
			border: "border-t-blue-500",
		},
		{
			label: "REQUIRED",
			value: stats.required,
			sub: "University mandatory",
			border: "border-t-purple-500",
		},
		{
			label: "BORROWED",
			value: stats.borrowed,
			sub: "Cross-dept course",
			border: "border-t-amber-500",
		},
	];

	return (
		<div className="flex flex-col gap-6">
			{/* Breadcrumb */}
			<div>
				<p className="text-2xl font-bold text-[#1a2b52] ">Course Definitions</p>
				<p className="text-xs text-[#8a9ab5] mt-0.5">
					Dept. of Computer Science 2025/2026
				</p>
			</div>

			{/* Heading + CTA */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold  text-[#1a2b52]">
						Course Definitions
					</h2>
					<p className="text-xs text-[#8a9ab5] mt-0.5">
						All courses defined by your department this session
					</p>
				</div>
				<button
					onClick={onDefineNew}
					className="bg-[#0E50BD] hover:bg-[#0a3d96] text-white text-sm font-bold
            px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-[#0E50BD]/30 flex-shrink-0"
				>
					Define New Course
				</button>
			</div>

			{/* 4 stat cards */}
			<div className="grid grid-cols-4 gap-4">
				{STAT_CARDS.map((c) => (
					<div
						key={c.label}
						className={`bg-white rounded-xl border border-[#e4eaf4] border-t-4 ${c.border} p-5 shadow-sm`}
					>
						<p className="text-[10px] font-bold tracking-widest text-[#8a9ab5] uppercase mb-3">
							{c.label}
						</p>
						<p
							className="text-5xl font-light text-[#1a2b52]"
						>
							{c.value}
						</p>
						<p className="text-xs text-[#8a9ab5] mt-2">{c.sub}</p>
					</div>
				))}
			</div>

			{/* ── Filter bar ── */}
			{/* Single flex row: search + All Types + All Status + All Levels + 100L…400L */}
			<div className="flex items-center gap-2 flex-wrap">
				{/* Search */}
				<input
					type="text"
					placeholder="Search courses.."
					value={searchQuery}
					onChange={(e) => onSearch(e.target.value)}
					className="border border-[#dce6f2] rounded-full px-4 py-2 text-sm text-[#1a2b52]
            bg-white placeholder:text-[#b0bcd4] outline-none
            focus:border-[#0E50BD] focus:ring-2 focus:ring-[#0E50BD]/10 min-w-[170px]"
				/>

				{/* Type filters — "All Types" resets, individual options filter */}
				<button
					onClick={() => onTypeFilter("All Types")}
					className={pillBtn(typeFilter === "All Types")}
				>
					All Types
				</button>
				{(["Core", "Elective", "Required", "Borrowed"] as CourseType[]).map(
					(t) => (
						<button
							key={t}
							onClick={() => onTypeFilter(typeFilter === t ? "All Types" : t)}
							className={pillBtn(typeFilter === t)}
						>
							{t}
						</button>
					),
				)}

				{/* Status filters */}
				<button
					onClick={() => onStatusFilter("All Status")}
					className={pillBtn(statusFilter === "All Status")}
				>
					All Status
				</button>
				{(["Pending", "Approved", "Rejected"] as CourseStatus[]).map((s) => (
					<button
						key={s}
						onClick={() =>
							onStatusFilter(statusFilter === s ? "All Status" : s)
						}
						className={pillBtn(statusFilter === s)}
					>
						{s}
					</button>
				))}

				{/* Level filters */}
				<button
					onClick={() => onLevelFilter(null)}
					className={pillBtn(activeLevel === null)}
				>
					All Levels
				</button>
				{LEVELS.map((l) => (
					<button
						key={l}
						onClick={() => onLevelFilter(activeLevel === l ? null : l)}
						className={pillBtn(activeLevel === l)}
					>
						{l}
					</button>
				))}
			</div>

			{/* Course cards grid */}
			{courses.length === 0 ? (
				<div className="bg-white rounded-2xl border border-[#e4eaf4] p-12 text-center shadow-sm">
					<p className="text-[#8a9ab5] text-sm">
						No courses match your filters
					</p>
				</div>
			) : (
				<div className="grid grid-cols-2 gap-4">
					{courses.map((c) => (
						<CourseCard key={c.id} course={c} onView={setViewCourse} />
					))}
				</div>
			)}

			{/* View Details modal */}
			{viewCourse && (
				<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7">
						<div className="flex items-start justify-between mb-4">
							<div>
								<p className="text-xs text-[#8a9ab5]">
									{viewCourse.code} · {viewCourse.department}
								</p>
								<h3 className="font-bold text-[#1a2b52] text-xl mt-0.5">
									{viewCourse.title}
								</h3>
							</div>
							<button
								onClick={() => setViewCourse(null)}
								className="w-8 h-8 rounded-lg border border-[#dce6f2] flex items-center justify-center
                  text-[#8a9ab5] hover:text-[#1a2b52] transition-colors"
							>
								✕
							</button>
						</div>
						<p className="text-sm text-[#6b7e9f] mb-5 leading-relaxed">
							{viewCourse.description}
						</p>
						<div className="grid grid-cols-2 gap-3 text-sm">
							{[
								["Type", viewCourse.type],
								["Units", `${viewCourse.units} Units`],
								["Levels", viewCourse.levels.join(", ")],
								["Mode", viewCourse.mode],
								["Schedule", viewCourse.schedule],
								["Lecturer", viewCourse.lecturer],
								["Status", viewCourse.status],
							].map(([k, v]) => (
								<div key={k} className="bg-[#f7f9fd] rounded-xl px-4 py-3">
									<p className="text-[10px] font-bold tracking-widest text-[#8a9ab5] uppercase mb-1">
										{k}
									</p>
									<p className="font-semibold text-[#1a2b52]">{v}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
