"use client";

import {
	BadgeCheck,
	CheckCircle2,
	Eye,
	Filter,
	Search,
	ShieldQuestion,
	Timer,
	X,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { RowActionMenu } from "@/components/ui/row-action-menu";
import type { Course, CourseStatus, CourseType } from "../types/course.types";

interface Props {
	courses: Course[];
	onUpdateStatus: (id: string, status: CourseStatus, note?: string) => void;
	canReviewCourses?: boolean;
}

type StatusFilter = CourseStatus | "All Status";
type TypeFilter = CourseType | "All Types";
type DecisionAction = "Approved" | "Rejected";
type DecisionTarget = {
	action: DecisionAction;
	course: Course;
};

const STATUS_OPTIONS: StatusFilter[] = [
	"All Status",
	"Pending",
	"Approved",
	"Rejected",
];
const TYPE_OPTIONS: TypeFilter[] = [
	"All Types",
	"Core",
	"Elective",
	"Required",
	"Borrowed",
	"Carryover",
];

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
					: type === "Borrowed"
						? "border-amber-200 bg-amber-50 text-amber-700"
						: "border-slate-200 bg-slate-50 text-slate-700";

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

function CourseViewModal({
	course,
	onClose,
	onDecision,
	canReviewCourses,
}: {
	course: Course | null;
	onClose: () => void;
	onDecision: (action: DecisionAction, course: Course) => void;
	canReviewCourses: boolean;
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
		["Submitted By", course.lecturer],
		["Status", course.status],
	];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
				<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
							HOD Approval
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
					<div className="flex flex-wrap gap-2">
						<span className={statusPill(course.status)}>{course.status}</span>
						<span className={typePill(course.type)}>{course.type}</span>
					</div>
					<p className="mt-4 rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4 text-sm font-semibold leading-7 text-[#60728f]">
						{course.description || "No description has been added for this course."}
					</p>
					<div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
						{rows.map(([label, value]) => (
							<DetailItem key={label} label={label} value={value} />
						))}
					</div>
					<div className="sticky bottom-0 mt-5 flex flex-col gap-3 border-t border-[#dbe5f1] bg-white/95 pt-4 backdrop-blur sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={onClose}
							className="h-12 rounded-2xl border border-[#d3dfed] bg-white px-5 text-sm font-black text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
						>
							Close
						</button>
						{canReviewCourses && course.status === "Pending" ? (
							<>
								<button
									type="button"
									onClick={() => onDecision("Rejected", course)}
									className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-black text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100"
								>
									<XCircle className="size-4" />
									Reject
								</button>
								<button
									type="button"
									onClick={() => onDecision("Approved", course)}
									className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(22,128,60,0.18)] transition hover:-translate-y-0.5 hover:bg-emerald-700"
								>
									<CheckCircle2 className="size-4" />
									Approve
								</button>
							</>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}

function ConfirmDecisionModal({
	target,
	onClose,
	onConfirm,
}: {
	target: DecisionTarget | null;
	onClose: () => void;
	onConfirm: (target: DecisionTarget, note: string) => void;
}) {
	const [note, setNote] = useState("");

	if (!target) {
		return null;
	}

	const isApprove = target.action === "Approved";

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#06172f]/70 p-4 backdrop-blur-sm">
			<div className="w-full max-w-xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
				<div
					className={`px-5 py-5 text-white sm:px-6 ${
						isApprove ? "bg-emerald-700" : "bg-red-700"
					}`}
				>
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/70">
								Double Check
							</p>
							<h2 className="mt-2 text-xl font-black sm:text-2xl">
								{isApprove ? "Approve this course?" : "Reject this course?"}
							</h2>
							<p className="mt-1 text-sm font-semibold text-white/75">
								{target.course.code} - {target.course.title}
							</p>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white hover:text-[#0D2B55]"
							aria-label="Close confirmation"
						>
							<X className="size-5" />
						</button>
					</div>
				</div>

				<div className="p-5 sm:p-6">
					<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
						<div className="flex gap-3">
							<div
								className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
									isApprove
										? "bg-emerald-100 text-emerald-700"
										: "bg-red-100 text-red-700"
								}`}
							>
								<ShieldQuestion className="size-5" />
							</div>
							<div>
								<p className="text-sm font-black text-[#0D2B55]">
									Confirm before applying this action.
								</p>
								<p className="mt-1 text-sm leading-6 text-[#60728f]">
									This updates the local UI state only. Backend approval workflows
									can be connected later.
								</p>
							</div>
						</div>
					</div>

					<label className="mt-4 block space-y-2">
						<span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#8395AF]">
							Review note
						</span>
						<textarea
							value={note}
							onChange={(event) => setNote(event.target.value)}
							placeholder={
								isApprove
									? "Optional note for approval"
									: "Reason for rejection"
							}
							className="min-h-28 w-full resize-none rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>

					<div className="mt-5 flex flex-col-reverse gap-3 border-t border-[#dbe5f1] pt-5 sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={onClose}
							className="h-12 rounded-2xl border border-[#d3dfed] bg-white px-5 text-sm font-black text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={() => onConfirm(target, note)}
							className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.16)] transition hover:-translate-y-0.5 ${
								isApprove
									? "bg-emerald-600 hover:bg-emerald-700"
									: "bg-red-600 hover:bg-red-700"
							}`}
						>
							{isApprove ? (
								<CheckCircle2 className="size-4" />
							) : (
								<XCircle className="size-4" />
							)}
							Confirm {isApprove ? "Approval" : "Rejection"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function HodRowActions({
	course,
	open,
	onToggle,
	onView,
	onApprove,
	onReject,
}: {
	course: Course;
	open: boolean;
	onToggle: () => void;
	onView: () => void;
	onApprove?: () => void;
	onReject?: () => void;
}) {
	return (
		<RowActionMenu
			label={`Open actions for ${course.code}`}
			open={open}
			onOpenChange={onToggle}
			width={176}
			items={[
				{
					label: "View",
					icon: <Eye className="size-4" />,
					onSelect: onView,
				},
				...(onApprove
					? [
							{
								label: "Approve",
								icon: <CheckCircle2 className="size-4" />,
								onSelect: onApprove,
								className: "text-emerald-700 hover:bg-emerald-50",
							},
						]
					: []),
				...(onReject
					? [
							{
								label: "Reject",
								icon: <XCircle className="size-4" />,
								onSelect: onReject,
								className: "text-[#c54848] hover:bg-red-50",
							},
						]
					: []),
			]}
		/>
	);
}

export default function HodApproval({
	courses,
	onUpdateStatus,
	canReviewCourses = true,
}: Props) {
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("All Status");
	const [typeFilter, setTypeFilter] = useState<TypeFilter>("All Types");
	const [searchQuery, setSearchQuery] = useState("");
	const [viewCourse, setViewCourse] = useState<Course | null>(null);
	const [decisionTarget, setDecisionTarget] = useState<DecisionTarget | null>(null);
	const [openActionsId, setOpenActionsId] = useState<string | null>(null);

	const analytics = useMemo(
		() => [
			{
				label: "Pending Review",
				value: courses.filter((course) => course.status === "Pending").length,
				note: "Needs HOD decision",
				icon: Timer,
			},
			{
				label: "Approved",
				value: courses.filter((course) => course.status === "Approved").length,
				note: "Ready for publishing",
				icon: BadgeCheck,
			},
			{
				label: "Rejected",
				value: courses.filter((course) => course.status === "Rejected").length,
				note: "Returned for revision",
				icon: XCircle,
			},
			{
				label: "Total Submitted",
				value: courses.length,
				note: "Current local queue",
				icon: ShieldQuestion,
			},
		],
		[courses],
	);

	const filteredCourses = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();

		return courses.filter((course) => {
			const statusMatch =
				statusFilter === "All Status" || course.status === statusFilter;
			const typeMatch = typeFilter === "All Types" || course.type === typeFilter;
			const queryMatch =
				!query ||
				[
					course.code,
					course.title,
					course.department,
					course.lecturer,
					course.schedule,
				]
					.join(" ")
					.toLowerCase()
					.includes(query);

			return statusMatch && typeMatch && queryMatch;
		});
	}, [courses, searchQuery, statusFilter, typeFilter]);

	function clearFilters() {
		setStatusFilter("All Status");
		setTypeFilter("All Types");
		setSearchQuery("");
	}

	function closeActions() {
		setOpenActionsId(null);
	}

	function requestDecision(action: DecisionAction, course: Course) {
		setDecisionTarget({ action, course });
	}

	function confirmDecision(target: DecisionTarget, note: string) {
		onUpdateStatus(
			target.course.id,
			target.action,
			note.trim() ||
				(target.action === "Approved" ? "Approved by HOD" : "Rejected by HOD"),
		);
		setDecisionTarget(null);
		setViewCourse(null);
	}

	return (
		<section className="space-y-5">
			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							HOD Approval
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							Course approval queue
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#556987]">
							Review submitted course definitions, inspect each request, and
							confirm approval or rejection before the local state changes.
						</p>
					</div>
					<span className="rounded-full border border-[#dce6f2] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#6b7e9f]">
						2025/2026 Session
					</span>
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

				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
					<label className="relative xl:col-span-2">
						<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
						<input
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder="Search course, code, lecturer"
							className="h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] pl-11 pr-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>
					<select
						value={statusFilter}
						onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						{STATUS_OPTIONS.map((status) => (
							<option key={status} value={status}>
								{status}
							</option>
						))}
					</select>
					<select
						value={typeFilter}
						onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						{TYPE_OPTIONS.map((type) => (
							<option key={type} value={type}>
								{type}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="overflow-hidden rounded-3xl border border-[#d7e2f0] bg-white shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe5f1] px-4 py-4 sm:px-5">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
							Approval Table
						</p>
						<p className="mt-1 text-sm font-semibold text-[#60728f]">
							Showing {filteredCourses.length} of {courses.length} submissions
						</p>
					</div>
					<div className="rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-4 py-2 text-xs font-black text-[#0D2B55]">
						Actions require confirmation
					</div>
				</div>

				{filteredCourses.length === 0 ? (
					<div className="p-8 text-center">
						<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eef4fb] text-[#2E86C1]">
							<BadgeCheck className="size-6" />
						</div>
						<h3 className="mt-4 text-lg font-black text-[#06183A]">
							No courses found
						</h3>
						<p className="mt-2 text-sm text-[#60728f]">
							Adjust the filters to inspect another part of the approval queue.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-[1080px] w-full border-collapse text-left">
							<thead className="bg-[#f8fbff]">
								<tr className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
									<th className="px-5 py-4">Course</th>
									<th className="px-5 py-4">Department</th>
									<th className="px-5 py-4">Submitted By</th>
									<th className="px-5 py-4">Type</th>
									<th className="px-5 py-4">Schedule</th>
									<th className="px-5 py-4">Status</th>
									<th className="px-5 py-4 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-[#dbe5f1]">
								{filteredCourses.map((course) => (
									<tr key={course.id} className="bg-white transition hover:bg-[#f8fbff]">
										<td className="px-5 py-4">
											<p className="font-black text-[#06183A]">{course.title}</p>
											<p className="mt-1 text-sm font-semibold text-[#60728f]">
												{course.code} - {course.units} Units
											</p>
										</td>
										<td className="px-5 py-4">
											<p className="text-sm font-black text-[#0D2B55]">
												{course.department}
											</p>
											<p className="mt-1 text-xs font-bold text-[#60728f]">
												{course.levels.join(", ")}
											</p>
										</td>
										<td className="px-5 py-4">
											<p className="text-sm font-black text-[#0D2B55]">
												{course.lecturer}
											</p>
										</td>
										<td className="px-5 py-4">
											<span className={typePill(course.type)}>{course.type}</span>
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
											<HodRowActions
												course={course}
												open={openActionsId === course.id}
												onToggle={() =>
													setOpenActionsId((current) =>
														current === course.id ? null : course.id,
													)
												}
												onView={() => {
													setViewCourse(course);
													closeActions();
												}}
												onApprove={
													canReviewCourses && course.status === "Pending"
														? () => {
																requestDecision("Approved", course);
																closeActions();
															}
														: undefined
												}
												onReject={
													canReviewCourses && course.status === "Pending"
														? () => {
																requestDecision("Rejected", course);
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
				)}
			</div>

			<CourseViewModal
				course={viewCourse}
				onClose={() => setViewCourse(null)}
				onDecision={requestDecision}
				canReviewCourses={canReviewCourses}
			/>
			<ConfirmDecisionModal
				target={decisionTarget}
				onClose={() => setDecisionTarget(null)}
				onConfirm={confirmDecision}
			/>
		</section>
	);
}
