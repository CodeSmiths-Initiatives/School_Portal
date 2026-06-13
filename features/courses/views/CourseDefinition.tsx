"use client";

import {
	BookOpenCheck,
	Eye,
	Filter,
	Plus,
	Search,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Course, CourseStatus, CourseType, Level } from "../types/course.types";
import DefineNewCourse from "./DefineNewCourse";

const LEVELS: Level[] = ["100L", "200L", "300L", "400L"];
const PAGE_SIZE = 12;

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
	onDefineNew: (course: Omit<Course, "id">) => void;
	canDefineCourse?: boolean;
}

function statusPill(status: CourseStatus) {
	const tone =
		status === "Approved"
			? "border-emerald-200 bg-emerald-50 text-emerald-700"
			: status === "Rejected"
				? "border-red-200 bg-red-50 text-red-700"
				: "border-amber-200 bg-amber-50 text-amber-700";

	return `rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${tone}`;
}

function typePill(type: CourseType) {
	const tone =
		type === "Core"
			? "border-sky-200 bg-sky-50 text-sky-700"
			: type === "Elective"
				? "border-indigo-200 bg-indigo-50 text-indigo-700"
				: type === "Required"
					? "border-purple-200 bg-purple-50 text-purple-700"
					: "border-amber-200 bg-amber-50 text-amber-700";

	return `rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${tone}`;
}

function DetailItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-3">
			<p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
				{label}
			</p>
			<p className="mt-1 break-words text-sm font-black text-[#0D2B55]">
				{value || "Not provided"}
			</p>
		</div>
	);
}

function CourseDetailsModal({
	course,
	onClose,
}: {
	course: Course | null;
	onClose: () => void;
}) {
	if (!course) {
		return null;
	}

	const rows = [
		["Course Code", course.code],
		["Department", course.department],
		["Type", course.type],
		["Credit Units", `${course.units} Units`],
		["Levels", course.levels.join(", ")],
		["Mode", course.mode],
		["Schedule", course.schedule],
		["Lecturer", course.lecturer],
		["Status", course.status],
	];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
				<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
							Course Details
						</p>
						<h2 className="mt-2 text-xl font-black sm:text-2xl">
							{course.title}
						</h2>
						<p className="mt-1 text-sm font-semibold text-[#c5d4e8]">
							{course.code} - {course.department}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#0D2B55]"
						aria-label="Close course details"
					>
						<X className="size-5" />
					</button>
				</div>

				<div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-5 sm:p-6">
					<p className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4 text-sm font-semibold leading-7 text-[#60728f]">
						{course.description || "No description has been added for this course."}
					</p>
					<div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
						{rows.map(([label, value]) => (
							<DetailItem key={label} label={label} value={value} />
						))}
					</div>
					<div className="sticky bottom-0 mt-5 flex justify-end border-t border-[#dbe5f1] bg-white/95 pt-4 backdrop-blur">
						<button
							type="button"
							onClick={onClose}
							className="inline-flex items-center justify-center rounded-2xl border border-[#dbe5f1] px-5 py-3 text-sm font-black text-[#0D2B55] transition hover:border-[#0D2B55]"
						>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function DefineCourseModal({
	open,
	onClose,
	onSave,
}: {
	open: boolean;
	onClose: () => void;
	onSave: (course: Omit<Course, "id">) => void;
}) {
	if (!open) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
				<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
							Define Course
						</p>
						<h2 className="mt-2 text-xl font-black sm:text-2xl">
							New course definition
						</h2>
						<p className="mt-1 text-sm font-semibold text-[#c5d4e8]">
							Create a draft course for academic review.
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#0D2B55]"
						aria-label="Close define course form"
					>
						<X className="size-5" />
					</button>
				</div>

				<div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-5 sm:p-6">
					<DefineNewCourse
						onSave={(course) => {
							onSave(course);
							onClose();
						}}
						onCancel={onClose}
					/>
				</div>
			</div>
		</div>
	);
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
	canDefineCourse = true,
}: Props) {
	const [viewCourse, setViewCourse] = useState<Course | null>(null);
	const [defineOpen, setDefineOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const pageCount = Math.max(1, Math.ceil(courses.length / PAGE_SIZE));
	const safePage = Math.min(currentPage, pageCount);
	const paginatedCourses = courses.slice(
		(safePage - 1) * PAGE_SIZE,
		safePage * PAGE_SIZE,
	);
	const analytics = useMemo(
		() => [
			["Core Courses", stats.core],
			["Electives", stats.elective],
			["Required", stats.required],
			["Borrowed", stats.borrowed],
		],
		[stats],
	);

	function updateFilter<T>(setter: (value: T) => void, value: T) {
		setter(value);
		setCurrentPage(1);
	}

	function clearFilters() {
		onSearch("");
		onTypeFilter("All Types");
		onStatusFilter("All Status");
		onLevelFilter(null);
		setCurrentPage(1);
	}

	return (
		<section className="space-y-5">
			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							Course Catalogue
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							Course table and definitions
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#556987]">
							Review course definitions, filter by academic metadata, and define
							new courses without leaving the catalogue workspace.
						</p>
					</div>
					{canDefineCourse ? (
						<button
							type="button"
							onClick={() => setDefineOpen(true)}
							className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866]"
						>
							<Plus className="size-4" />
							Define Course
						</button>
					) : (
						<span className="rounded-full border border-[#dce6f2] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#6b7e9f]">
							View-only catalogue
						</span>
					)}
				</div>

				<div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{analytics.map(([label, value]) => (
						<div
							key={label}
							className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4"
						>
							<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
								{label}
							</p>
							<p className="mt-2 text-3xl font-black text-[#0D2B55]">{value}</p>
						</div>
					))}
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
							onChange={(event) => updateFilter(onSearch, event.target.value)}
							placeholder="Search course, code, lecturer"
							className="h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] pl-11 pr-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>
					<select
						value={typeFilter}
						onChange={(event) =>
							updateFilter(onTypeFilter, event.target.value as CourseType | "All Types")
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="All Types">All course types</option>
						{(["Core", "Elective", "Required", "Borrowed"] as CourseType[]).map(
							(type) => (
								<option key={type} value={type}>
									{type}
								</option>
							),
						)}
					</select>
					<select
						value={statusFilter}
						onChange={(event) =>
							updateFilter(
								onStatusFilter,
								event.target.value as CourseStatus | "All Status",
							)
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="All Status">All approval status</option>
						{(["Pending", "Approved", "Rejected"] as CourseStatus[]).map((status) => (
							<option key={status} value={status}>
								{status}
							</option>
						))}
					</select>
					<select
						value={activeLevel ?? "All Levels"}
						onChange={(event) =>
							updateFilter(
								onLevelFilter,
								event.target.value === "All Levels"
									? null
									: (event.target.value as Level),
							)
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
				</div>
			</div>

			<div className="overflow-hidden rounded-3xl border border-[#d7e2f0] bg-white shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe5f1] px-4 py-4 sm:px-5">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
							Courses Table
						</p>
						<p className="mt-1 text-sm font-semibold text-[#60728f]">
							Showing {paginatedCourses.length} of {courses.length} courses
						</p>
					</div>
					<div className="flex items-center gap-2 rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-4 py-2 text-xs font-black text-[#0D2B55]">
						Page {safePage} of {pageCount}
					</div>
				</div>

				{courses.length === 0 ? (
					<div className="p-8 text-center">
						<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eef4fb] text-[#2E86C1]">
							<BookOpenCheck className="size-6" />
						</div>
						<h3 className="mt-4 text-lg font-black text-[#06183A]">
							No courses found
						</h3>
						<p className="mt-2 text-sm text-[#60728f]">
							Adjust the filters or define a new course for this catalogue.
						</p>
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className="min-w-[1040px] w-full border-collapse text-left">
								<thead className="bg-[#f8fbff]">
									<tr className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
										<th className="px-5 py-4">Course</th>
										<th className="px-5 py-4">Department</th>
										<th className="px-5 py-4">Type</th>
										<th className="px-5 py-4">Units</th>
										<th className="px-5 py-4">Levels</th>
										<th className="px-5 py-4">Schedule</th>
										<th className="px-5 py-4">Status</th>
										<th className="px-5 py-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[#dbe5f1]">
									{paginatedCourses.map((course) => (
										<tr
											key={course.id}
											className="bg-white transition hover:bg-[#f8fbff]"
										>
											<td className="px-5 py-4">
												<p className="font-black text-[#06183A]">{course.title}</p>
												<p className="mt-1 text-sm font-semibold text-[#60728f]">
													{course.code} - {course.lecturer}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="max-w-[14rem] text-sm font-black text-[#0D2B55]">
													{course.department}
												</p>
											</td>
											<td className="px-5 py-4">
												<span className={typePill(course.type)}>{course.type}</span>
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-black text-[#0D2B55]">
													{course.units}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-bold text-[#60728f]">
													{course.levels.join(", ")}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-black text-[#0D2B55]">
													{course.mode}
												</p>
												<p className="mt-1 text-xs font-bold text-[#60728f]">
													{course.schedule}
												</p>
											</td>
											<td className="px-5 py-4">
												<span className={statusPill(course.status)}>
													{course.status}
												</span>
											</td>
											<td className="px-5 py-4">
												<div className="flex justify-end gap-2">
													<button
														type="button"
														onClick={() => setViewCourse(course)}
														className="inline-flex size-10 items-center justify-center rounded-2xl border border-[#d3dfed] bg-white text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
														aria-label={`View ${course.title}`}
														title="View"
													>
														<Eye className="size-4" />
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div className="flex flex-col gap-3 border-t border-[#dbe5f1] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
							<p className="text-sm font-semibold text-[#60728f]">
								Rows per page: {PAGE_SIZE}
							</p>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
									disabled={safePage === 1}
									className="h-10 rounded-2xl border border-[#d3dfed] bg-white px-4 text-sm font-black text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D] disabled:cursor-not-allowed disabled:opacity-40"
								>
									Previous
								</button>
								<button
									type="button"
									onClick={() =>
										setCurrentPage((page) => Math.min(pageCount, page + 1))
									}
									disabled={safePage === pageCount}
									className="h-10 rounded-2xl bg-[#0D2B55] px-4 text-sm font-black text-white transition hover:bg-[#123866] disabled:cursor-not-allowed disabled:opacity-40"
								>
									Next
								</button>
							</div>
						</div>
					</>
				)}
			</div>

			<CourseDetailsModal
				course={viewCourse}
				onClose={() => setViewCourse(null)}
			/>
			<DefineCourseModal
				open={defineOpen}
				onClose={() => setDefineOpen(false)}
				onSave={onDefineNew}
			/>
		</section>
	);
}
