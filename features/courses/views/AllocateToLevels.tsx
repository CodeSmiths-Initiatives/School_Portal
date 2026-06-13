"use client";

import {
	Eye,
	Filter,
	Layers3,
	Pencil,
	Plus,
	Search,
	Trash2,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { RowActionMenu } from "@/components/ui/row-action-menu";
import type {
	Course,
	CourseStatus,
	CourseType,
	Level,
} from "../types/course.types";

interface Props {
	courses: Course[];
	canManageAllocations?: boolean;
}

type AllocationRow = {
	courseId: string;
	level: Level;
};

type AllocationTableRow = AllocationRow & {
	course: Course;
	semester: string;
};

type AllocationStatusFilter = CourseStatus | "All Status";
type AllocationTypeFilter = CourseType | "All Types";
type AllocationLevelFilter = Level | "All Levels";
type AllocationSemesterFilter = "All Semesters" | "1st Semester" | "2nd Semester";

const ALL_LEVELS: Level[] = ["100L", "200L", "300L", "400L"];
const PAGE_SIZE = 10;

function levelPill(level: Level) {
	const tone =
		level === "100L"
			? "border-sky-200 bg-sky-50 text-sky-700"
			: level === "200L"
				? "border-emerald-200 bg-emerald-50 text-emerald-700"
				: level === "300L"
					? "border-amber-200 bg-amber-50 text-amber-700"
					: "border-red-200 bg-red-50 text-red-700";

	return `rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${tone}`;
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

function getSemester(course: Course) {
	const schedule = course.schedule?.toLowerCase() ?? "";

	if (schedule.includes("2nd") || schedule.includes("second")) {
		return "2nd Semester";
	}

	return "1st Semester";
}

function NewAllocationModal({
	courses,
	onAdd,
	onClose,
	initialRow,
}: {
	courses: Course[];
	onAdd: (courseId: string, level: Level) => void;
	onClose: () => void;
	initialRow?: AllocationTableRow | null;
}) {
	const selectableCourses = courses.filter(
		(course) => course.status === "Approved" || course.id === initialRow?.courseId,
	);
	const [selectedCourse, setSelectedCourse] = useState(initialRow?.courseId ?? "");
	const [selectedLevel, setSelectedLevel] = useState<Level>(
		initialRow?.level ?? "100L",
	);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
				<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
							New Allocation
						</p>
						<h2 className="mt-2 text-xl font-black sm:text-2xl">
							{initialRow ? "Edit allocation" : "Assign course to level"}
						</h2>
						<p className="mt-1 text-sm font-semibold text-[#c5d4e8]">
							Add an approved course to a student level for the current session.
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#0D2B55]"
						aria-label="Close allocation form"
					>
						<X className="size-5" />
					</button>
				</div>

				<div className="space-y-4 p-5 sm:p-6">
					<label className="block">
						<span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
							Course
						</span>
						<select
							value={selectedCourse}
							onChange={(event) => setSelectedCourse(event.target.value)}
							className="mt-2 h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
						>
							<option value="" disabled>
								Select an approved course
							</option>
							{selectableCourses.map((course) => (
								<option key={course.id} value={course.id}>
									{course.code} - {course.title}
								</option>
							))}
						</select>
					</label>

					<label className="block">
						<span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
							Level
						</span>
						<select
							value={selectedLevel}
							onChange={(event) => setSelectedLevel(event.target.value as Level)}
							className="mt-2 h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
						>
							{ALL_LEVELS.map((level) => (
								<option key={level} value={level}>
									{level.replace("L", " Level")}
								</option>
							))}
						</select>
					</label>

					<div className="flex flex-col-reverse gap-3 border-t border-[#dbe5f1] pt-4 sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={onClose}
							className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#d3dfed] bg-white px-5 text-sm font-black text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
						>
							Cancel
						</button>
						<button
							type="button"
							disabled={!selectedCourse}
							onClick={() => {
								if (!selectedCourse) {
									return;
								}

								onAdd(selectedCourse, selectedLevel);
								onClose();
							}}
							className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:bg-[#123866] disabled:cursor-not-allowed disabled:opacity-40"
						>
							<Plus className="size-4" />
							{initialRow ? "Save Allocation" : "Add Allocation"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function AllocationDetailsModal({
	row,
	onClose,
}: {
	row: AllocationTableRow | null;
	onClose: () => void;
}) {
	if (!row) {
		return null;
	}

	const details = [
		["Level", row.level],
		["Course Code", row.course.code],
		["Department", row.course.department],
		["Type", row.course.type],
		["Credit Units", `${row.course.units} Units`],
		["Semester", row.semester],
		["Lecturer", row.course.lecturer],
		["Status", row.course.status],
	];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
			<div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
				<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
							Allocation Details
						</p>
						<h2 className="mt-2 text-xl font-black sm:text-2xl">
							{row.course.title}
						</h2>
						<p className="mt-1 text-sm font-semibold text-[#c5d4e8]">
							{row.course.code} - {row.level}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#0D2B55]"
						aria-label="Close allocation details"
					>
						<X className="size-5" />
					</button>
				</div>

				<div className="p-5 sm:p-6">
					<div className="grid gap-3 md:grid-cols-2">
						{details.map(([label, value]) => (
							<div
								key={label}
								className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-3"
							>
								<p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
									{label}
								</p>
								<p className="mt-1 break-words text-sm font-black text-[#0D2B55]">
									{value}
								</p>
							</div>
						))}
					</div>
					<div className="mt-5 flex justify-end border-t border-[#dbe5f1] pt-4">
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

function AllocationRowActions({
	row,
	open,
	onToggle,
	onView,
	onEdit,
	onDelete,
}: {
	row: AllocationTableRow;
	open: boolean;
	onToggle: () => void;
	onView: () => void;
	onEdit?: () => void;
	onDelete?: () => void;
}) {
	return (
		<RowActionMenu
			label={`Open actions for ${row.course.code} ${row.level}`}
			open={open}
			onOpenChange={onToggle}
			width={176}
			items={[
				{
					label: "View",
					icon: <Eye className="size-4" />,
					onSelect: onView,
				},
				...(onEdit
					? [
							{
								label: "Edit",
								icon: <Pencil className="size-4" />,
								onSelect: onEdit,
							},
						]
					: []),
				...(onDelete
					? [
							{
								label: "Delete",
								icon: <Trash2 className="size-4" />,
								onSelect: onDelete,
								className: "text-[#c54848] hover:bg-red-50",
							},
						]
					: []),
			]}
		/>
	);
}

export default function AllocateToLevels({
	courses,
	canManageAllocations = true,
}: Props) {
	const [rows, setRows] = useState<AllocationRow[]>(() =>
		courses.flatMap((course) =>
			course.levels.map((level) => ({ courseId: course.id, level })),
		),
	);
	const [showModal, setShowModal] = useState(false);
	const [viewRow, setViewRow] = useState<AllocationTableRow | null>(null);
	const [editRow, setEditRow] = useState<AllocationTableRow | null>(null);
	const [openActionsKey, setOpenActionsKey] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [levelFilter, setLevelFilter] =
		useState<AllocationLevelFilter>("All Levels");
	const [typeFilter, setTypeFilter] =
		useState<AllocationTypeFilter>("All Types");
	const [statusFilter, setStatusFilter] =
		useState<AllocationStatusFilter>("All Status");
	const [semesterFilter, setSemesterFilter] =
		useState<AllocationSemesterFilter>("All Semesters");
	const [currentPage, setCurrentPage] = useState(1);

	const courseById = useMemo(
		() => new Map(courses.map((course) => [course.id, course])),
		[courses],
	);

	const allocationRows = useMemo<AllocationTableRow[]>(
		() =>
			rows.flatMap((row) => {
				const course = courseById.get(row.courseId);

				if (!course) {
					return [];
				}

				return [{ ...row, course, semester: getSemester(course) }];
			}),
		[courseById, rows],
	);

	const filteredRows = useMemo(
		() =>
			allocationRows.filter((row) => {
				const query = searchQuery.trim().toLowerCase();
				const matchesSearch =
					!query ||
					row.course.title.toLowerCase().includes(query) ||
					row.course.code.toLowerCase().includes(query) ||
					row.course.department.toLowerCase().includes(query) ||
					row.course.lecturer.toLowerCase().includes(query);
				const matchesLevel =
					levelFilter === "All Levels" || row.level === levelFilter;
				const matchesType =
					typeFilter === "All Types" || row.course.type === typeFilter;
				const matchesStatus =
					statusFilter === "All Status" || row.course.status === statusFilter;
				const matchesSemester =
					semesterFilter === "All Semesters" || row.semester === semesterFilter;

				return (
					matchesSearch &&
					matchesLevel &&
					matchesType &&
					matchesStatus &&
					matchesSemester
				);
			}),
		[
			allocationRows,
			levelFilter,
			searchQuery,
			semesterFilter,
			statusFilter,
			typeFilter,
		],
	);

	const analytics = useMemo(() => {
		const activeLevelCount = new Set(allocationRows.map((row) => row.level)).size;
		const approvedCount = allocationRows.filter(
			(row) => row.course.status === "Approved",
		).length;
		const unitTotal = allocationRows.reduce(
			(total, row) => total + row.course.units,
			0,
		);

		return [
			["Total Allocations", allocationRows.length],
			["Approved Allocations", approvedCount],
			["Active Levels", activeLevelCount],
			["Credit Units", unitTotal],
		];
	}, [allocationRows]);

	const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
	const safePage = Math.min(currentPage, pageCount);
	const paginatedRows = filteredRows.slice(
		(safePage - 1) * PAGE_SIZE,
		safePage * PAGE_SIZE,
	);

	function updateFilter<T>(setter: (value: T) => void, value: T) {
		setter(value);
		setCurrentPage(1);
	}

	function clearFilters() {
		setSearchQuery("");
		setLevelFilter("All Levels");
		setTypeFilter("All Types");
		setStatusFilter("All Status");
		setSemesterFilter("All Semesters");
		setCurrentPage(1);
	}

	function addAllocation(courseId: string, level: Level) {
		setRows((currentRows) => {
			const exists = currentRows.some(
				(row) => row.courseId === courseId && row.level === level,
			);

			if (exists) {
				return currentRows;
			}

			return [...currentRows, { courseId, level }];
		});
	}

	function updateAllocation(
		currentCourseId: string,
		currentLevel: Level,
		nextCourseId: string,
		nextLevel: Level,
	) {
		setRows((currentRows) => {
			const duplicate = currentRows.some(
				(row) =>
					row.courseId === nextCourseId &&
					row.level === nextLevel &&
					(row.courseId !== currentCourseId || row.level !== currentLevel),
			);

			if (duplicate) {
				return currentRows;
			}

			return currentRows.map((row) =>
				row.courseId === currentCourseId && row.level === currentLevel
					? { courseId: nextCourseId, level: nextLevel }
					: row,
			);
		});
	}

	function removeRow(courseId: string, level: Level) {
		setRows((currentRows) =>
			currentRows.filter(
				(row) => !(row.courseId === courseId && row.level === level),
			),
		);
	}

	function closeActions() {
		setOpenActionsKey(null);
	}

	return (
		<section className="space-y-5">
			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							Course Allocation
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							Level allocation table
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#556987]">
							Assign approved courses to levels, review allocation coverage, and
							filter the allocation list without leaving the course workspace.
						</p>
					</div>
					{canManageAllocations ? (
						<button
							type="button"
							onClick={() => setShowModal(true)}
							className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866]"
						>
							<Plus className="size-4" />
							New Allocation
						</button>
					) : (
						<span className="rounded-full border border-[#dce6f2] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#6b7e9f]">
							View-only allocations
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

				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
					<label className="relative xl:col-span-2">
						<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
						<input
							value={searchQuery}
							onChange={(event) =>
								updateFilter(setSearchQuery, event.target.value)
							}
							placeholder="Search course, code, department, lecturer"
							className="h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] pl-11 pr-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>
					<select
						value={levelFilter}
						onChange={(event) =>
							updateFilter(
								setLevelFilter,
								event.target.value as AllocationLevelFilter,
							)
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="All Levels">All levels</option>
						{ALL_LEVELS.map((level) => (
							<option key={level} value={level}>
								{level}
							</option>
						))}
					</select>
					<select
						value={typeFilter}
						onChange={(event) =>
							updateFilter(setTypeFilter, event.target.value as AllocationTypeFilter)
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
						value={semesterFilter}
						onChange={(event) =>
							updateFilter(
								setSemesterFilter,
								event.target.value as AllocationSemesterFilter,
							)
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="All Semesters">All semesters</option>
						<option value="1st Semester">1st Semester</option>
						<option value="2nd Semester">2nd Semester</option>
					</select>
					<select
						value={statusFilter}
						onChange={(event) =>
							updateFilter(
								setStatusFilter,
								event.target.value as AllocationStatusFilter,
							)
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="All Status">All approval status</option>
						{(["Pending", "Approved", "Rejected"] as CourseStatus[]).map(
							(status) => (
								<option key={status} value={status}>
									{status}
								</option>
							),
						)}
					</select>
				</div>
			</div>

			<div className="overflow-hidden rounded-3xl border border-[#d7e2f0] bg-white shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe5f1] px-4 py-4 sm:px-5">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
							Allocations Table
						</p>
						<p className="mt-1 text-sm font-semibold text-[#60728f]">
							Showing {paginatedRows.length} of {filteredRows.length} allocations
						</p>
					</div>
					<div className="flex items-center gap-2 rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-4 py-2 text-xs font-black text-[#0D2B55]">
						Page {safePage} of {pageCount}
					</div>
				</div>

				{filteredRows.length === 0 ? (
					<div className="p-8 text-center">
						<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eef4fb] text-[#2E86C1]">
							<Layers3 className="size-6" />
						</div>
						<h3 className="mt-4 text-lg font-black text-[#06183A]">
							No allocations found
						</h3>
						<p className="mt-2 text-sm text-[#60728f]">
							Adjust the filters or add a new approved course allocation.
						</p>
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className="min-w-[1080px] w-full border-collapse text-left">
								<thead className="bg-[#f8fbff]">
									<tr className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
										<th className="px-5 py-4">Level</th>
										<th className="px-5 py-4">Course</th>
										<th className="px-5 py-4">Department</th>
										<th className="px-5 py-4">Type</th>
										<th className="px-5 py-4">Units</th>
										<th className="px-5 py-4">Semester</th>
										<th className="px-5 py-4">Lecturer</th>
										<th className="px-5 py-4">Status</th>
										<th className="px-5 py-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[#dbe5f1]">
									{paginatedRows.map((row) => (
										<tr
											key={`${row.courseId}-${row.level}`}
											className="bg-white transition hover:bg-[#f8fbff]"
										>
											<td className="px-5 py-4">
												<span className={levelPill(row.level)}>{row.level}</span>
											</td>
											<td className="px-5 py-4">
												<p className="font-black text-[#06183A]">
													{row.course.title}
												</p>
												<p className="mt-1 text-sm font-semibold text-[#60728f]">
													{row.course.code}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="max-w-[14rem] text-sm font-black text-[#0D2B55]">
													{row.course.department}
												</p>
											</td>
											<td className="px-5 py-4">
												<span className={typePill(row.course.type)}>
													{row.course.type}
												</span>
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-black text-[#0D2B55]">
													{row.course.units}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-bold text-[#60728f]">
													{row.semester}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="max-w-[12rem] text-sm font-black text-[#0D2B55]">
													{row.course.lecturer}
												</p>
											</td>
											<td className="px-5 py-4">
												<span className={statusPill(row.course.status)}>
													{row.course.status}
												</span>
											</td>
											<td className="px-5 py-4">
												<AllocationRowActions
													row={row}
													open={
														openActionsKey === `${row.courseId}-${row.level}`
													}
													onToggle={() =>
														setOpenActionsKey((current) => {
															const key = `${row.courseId}-${row.level}`;

															return current === key ? null : key;
														})
													}
													onView={() => {
														setViewRow(row);
														closeActions();
													}}
													onEdit={
														canManageAllocations
															? () => {
																	setEditRow(row);
																	closeActions();
																}
															: undefined
													}
													onDelete={
														canManageAllocations
															? () => {
																	removeRow(row.courseId, row.level);
																	closeActions();
																}
															: undefined
													}
												/>
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

			{showModal ? (
				<NewAllocationModal
					courses={courses}
					onAdd={addAllocation}
					onClose={() => setShowModal(false)}
				/>
			) : null}
			<AllocationDetailsModal row={viewRow} onClose={() => setViewRow(null)} />
			{editRow ? (
				<NewAllocationModal
					courses={courses}
					initialRow={editRow}
					onAdd={(courseId, level) => {
						updateAllocation(editRow.courseId, editRow.level, courseId, level);
					}}
					onClose={() => setEditRow(null)}
				/>
			) : null}
		</section>
	);
}
