"use client";

import { useState } from "react";
import { Course, CourseStatus } from "../types/course.types";

interface Props {
	courses: Course[];
	onUpdateStatus: (id: string, status: CourseStatus, note?: string) => void;
	canReviewCourses?: boolean;
}

// ─── Icon color per course type ───────────────────────────────────────────────
const ICON_STYLE: Record<string, { bg: string; emoji: string }> = {
	Core: { bg: "bg-blue-100", emoji: "📘" },
	Elective: { bg: "bg-purple-100", emoji: "🎯" },
	Required: { bg: "bg-green-100", emoji: "✅" },
	Borrowed: { bg: "bg-orange-100", emoji: "📋" },
};

// ─── Pill colors ──────────────────────────────────────────────────────────────
const TYPE_PILL: Record<string, string> = {
	Core: "bg-teal-100 text-teal-700",
	Elective: "bg-purple-100 text-purple-600",
	Required: "bg-red-100 text-red-600",
	Borrowed: "bg-orange-100 text-orange-600",
};

const MODE_PILL: Record<string, string> = {
	"On-Site": "bg-[#e8f5e9] text-[#2e7d32]",
	Online: "bg-[#e3f2fd] text-[#1565c0]",
	Hybrid: "bg-[#f3e5f5] text-[#6a1b9a]",
};

const STATUS_PILL: Record<string, string> = {
	Pending: "text-amber-600",
	Approved: "text-emerald-600",
	Rejected: "text-red-600",
};

type FilterTab = "Pending" | "Approved" | "Rejected";

// ─── View Details Modal ───────────────────────────────────────────────────────
function DetailsModal({
	course,
	onClose,
	onApprove,
	onReject,
	canReviewCourses,
}: {
	course: Course;
	onClose: () => void;
	onApprove: () => void;
	onReject: () => void;
	canReviewCourses: boolean;
}) {
	return (
		<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
			<div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
				{/* Modal header */}
				<div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f5fb]">
					<h3 className="text-base font-bold text-[#1a2b52]">
						{course.code} — {course.title}
					</h3>
					<button
						onClick={onClose}
						className="w-8 h-8 rounded-lg border border-[#dce6f2] flex items-center justify-center
              text-[#8a9ab5] hover:text-[#1a2b52] text-sm transition-colors"
					>
						×
					</button>
				</div>

				<div className="px-6 py-5 flex flex-col gap-4">
					{/* Tags */}
					<div className="flex flex-wrap gap-2">
						<span
							className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${TYPE_PILL[course.type]}`}
						>
							{course.type.toLowerCase()}
						</span>
						<span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
							{course.units} Units
						</span>
						{course.levels.map((l) => (
							<span
								key={l}
								className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700"
							>
								{l}
							</span>
						))}
						<span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
							{course.status.toLowerCase()}
						</span>
						<span
							className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${MODE_PILL[course.mode] ?? MODE_PILL["On-Site"]}`}
						>
							{course.mode.toLowerCase()}
						</span>
					</div>

					{/* Description */}
					<p className="text-sm text-[#6b7e9f] leading-relaxed">
						{course.description}
					</p>

					{/* Details grid */}
					<div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
						{[
							["Department", course.department],
							["Semester", "2nd Semester"],
							["Lecturer", course.lecturer],
							["Max Students", "100"],
							["Day / Time", course.schedule],
							[
								"Platform Link",
								course.mode === "Online" ? "meet.google.com/abc-xyz" : "—",
							],
							["Submitted", "2025-02-10"],
						].map(([label, value]) => (
							<div key={label}>
								<span className="font-bold text-[#1a2b52]">{label}: </span>
								<span className="text-[#6b7e9f]">{value}</span>
							</div>
						))}
					</div>
				</div>

				{/* Modal footer */}
				<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#f0f5fb]">
					<button
						onClick={onClose}
						className="px-5 py-2.5 rounded-xl border border-[#dce6f2] text-sm font-semibold
              text-[#4a5a7a] hover:border-[#8a9ab5] transition-colors"
					>
						Close
					</button>
					{canReviewCourses && course.status === "Pending" && (
						<>
							<button
								onClick={() => {
									onReject();
									onClose();
								}}
								className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold
                  transition-colors flex items-center gap-1.5"
							>
								✕ Reject
							</button>
							<button
								onClick={() => {
									onApprove();
									onClose();
								}}
								className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold
                  transition-colors flex items-center gap-1.5"
							>
								✓ Approve
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

// ─── Single course row ────────────────────────────────────────────────────────
function CourseRow({
	course,
	onApprove,
	onReject,
	onView,
	canReviewCourses,
}: {
	course: Course;
	onApprove: () => void;
	onReject: () => void;
	onView: () => void;
	canReviewCourses: boolean;
}) {
	const icon = ICON_STYLE[course.type] ?? ICON_STYLE.Core;
	const modeLabel = course.mode === "Online" ? "Online" : "onsite";
	const modeIconColor =
		course.mode === "Online" ? "text-blue-500" : "text-red-500";

	// Derive display date/time from schedule
	const scheduleDisplay = course.schedule || "—";

	return (
		<div className="bg-white rounded-2xl border border-[#e8ecf4] shadow-sm px-5 py-5 flex items-start gap-4">
			{/* Course icon */}
			<div
				className={`w-11 h-11 rounded-xl ${icon.bg} flex items-center justify-center text-xl flex-shrink-0 mt-0.5`}
			>
				{icon.emoji}
			</div>

			{/* Main content */}
			<div className="flex-1 min-w-0 flex flex-col gap-2.5">
				{/* Title row */}
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<h3 className="font-bold text-[#1a2b52] text-sm leading-snug">
							{course.code} — {course.title}
						</h3>
						<p className="text-xs text-[#8a9ab5] mt-0.5">
							Submitted by{" "}
							<span className="font-semibold text-[#4a5a7a]">
								{course.lecturer}
							</span>
							{" · "}
							{course.department}
							{" · "}2nd Semester
						</p>
						<p className="text-xs text-[#8a9ab5] mt-0.5 flex items-center gap-1">
							{scheduleDisplay}{" "}
							<span className={`flex items-center gap-1 ${modeIconColor}`}>
								{course.mode === "Online" ? "🌐" : "📍"}
								{modeLabel === "onsite"
									? course.schedule?.split(" ").slice(-2).join(" ") || "Campus"
									: "Online"}
							</span>
						</p>
					</div>

					{/* Date + status */}
					<div className="flex flex-col items-end gap-1 flex-shrink-0">
						<span className="text-[10px] text-[#8a9ab5]">
							Submitted 2025-02-10
						</span>
						<span
							className={`text-[11px] font-bold ${STATUS_PILL[course.status]}`}
						>
							{course.status}
						</span>
					</div>
				</div>

				{/* Tag pills */}
				<div className="flex flex-wrap gap-1.5">
					<span
						className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${TYPE_PILL[course.type]}`}
					>
						{course.type.toLowerCase()}
					</span>
					<span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
						{course.units} Units
					</span>
					{course.levels.map((l) => (
						<span
							key={l}
							className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#e8eef8] text-[#3d5a9e]"
						>
							{l}
						</span>
					))}
					<span
						className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${MODE_PILL[course.mode] ?? MODE_PILL["On-Site"]}`}
					>
						{modeLabel}
					</span>
				</div>

				{/* Action buttons — only shown for Pending */}
				{canReviewCourses && course.status === "Pending" && (
					<div className="flex items-center gap-2 mt-0.5">
						<button
							onClick={onApprove}
							className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600
                text-white text-xs font-bold transition-colors"
						>
							✓ Approve
						</button>
						<button
							onClick={onReject}
							className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600
                text-white text-xs font-bold transition-colors"
						>
							✕ Reject
						</button>
						<button
							onClick={onView}
							className="px-4 py-2 rounded-xl border border-[#dce6f2] text-xs font-semibold
                text-[#4a5a7a] hover:border-[#3d5a9e] hover:text-[#3d5a9e] transition-colors"
						>
							View Details
						</button>
					</div>
				)}

				{/* Approval note for reviewed courses */}
				{course.status !== "Pending" && course.approvalNote && (
					<div className="text-xs text-[#6b7e9f] bg-[#f7f9fd] rounded-xl px-3 py-2 border border-[#e4eaf4]">
						<span className="font-bold">Note:</span> {course.approvalNote}
					</div>
				)}
			</div>
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HodApproval({
	courses,
	onUpdateStatus,
	canReviewCourses = true,
}: Props) {
	const [activeTab, setActiveTab] = useState<FilterTab>("Pending");
	const [viewCourse, setViewCourse] = useState<Course | null>(null);
	const [noteMap, setNoteMap] = useState<Record<string, string>>({});

	const pending = courses.filter((c) => c.status === "Pending");
	const approved = courses.filter((c) => c.status === "Approved");
	const rejected = courses.filter((c) => c.status === "Rejected");

	const tabCounts: Record<FilterTab, number> = {
		Pending: pending.length,
		Approved: approved.length,
		Rejected: rejected.length,
	};

	const visibleCourses =
		activeTab === "Pending"
			? pending
			: activeTab === "Approved"
				? approved
				: rejected;

	function handleApprove(id: string) {
		onUpdateStatus(id, "Approved", noteMap[id]);
	}

	function handleReject(id: string) {
		onUpdateStatus(id, "Rejected", noteMap[id] || "Rejected by HOD");
	}

	const TABS: FilterTab[] = ["Pending", "Approved", "Rejected"];

	return (
		<div className="flex flex-col gap-5">
			{/* Page heading */}
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="text-xs text-[#8a9ab5]">
						Dept. of Computer Science · 2025/2026
					</p>
					<h1 className="text-2xl font-bold text-[#1a2b52] mt-1">
						HOD Approval Panel
					</h1>
				</div>
				<span className="border border-[#dce6f2] rounded-full px-4 py-1.5 text-xs font-bold text-[#4a5a7a] bg-white mt-1">
					2025/2026
				</span>
			</div>

			{/* Navy banner */}
			<div className="bg-[#0d1b3e] rounded-2xl px-6 py-5 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
						🏛️
					</div>
					<div>
						<h2 className="text-white font-bold text-base leading-tight">
							Head of Department Review Panel
						</h2>
						<p className="text-white/50 text-xs mt-0.5">
							Courses submitted by lecturers await your approval before becoming
							visible to students.
						</p>
					</div>
				</div>
				{pending.length > 0 && (
					<div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
						<span className="text-white font-bold text-sm">
							{pending.length}
						</span>
					</div>
				)}
			</div>

			{/* Filter tabs */}
			<div className="flex items-center gap-1.5 bg-[#f0f4fb] rounded-xl p-1.5 w-fit">
				{TABS.map((tab) => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all
              ${
								activeTab === tab
									? "bg-[#3d5a9e] text-white shadow-sm"
									: "text-[#6b7e9f] hover:text-[#1a2b52]"
							}`}
					>
						{tab}
						{tabCounts[tab] > 0 ? ` (${tabCounts[tab]})` : ""}
					</button>
				))}
			</div>

			{/* Course list */}
			{visibleCourses.length === 0 ? (
				<div className="bg-white rounded-2xl border border-[#e4eaf4] p-12 text-center shadow-sm">
					<p className="text-3xl mb-3">
						{activeTab === "Pending"
							? "✓"
							: activeTab === "Approved"
								? "🎉"
								: "📋"}
					</p>
					<p className="text-sm font-bold text-[#4a5a7a]">
						{activeTab === "Pending"
							? "No pending courses — all reviewed!"
							: `No ${activeTab.toLowerCase()} courses yet`}
					</p>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{visibleCourses.map((course) => (
						<CourseRow
							key={course.id}
							course={course}
							onApprove={() => handleApprove(course.id)}
							onReject={() => handleReject(course.id)}
							onView={() => setViewCourse(course)}
							canReviewCourses={canReviewCourses}
						/>
					))}
				</div>
			)}

			{/* View Details modal */}
			{viewCourse && (
				<DetailsModal
					course={viewCourse}
					onClose={() => setViewCourse(null)}
					onApprove={() => {
						handleApprove(viewCourse.id);
						setViewCourse(null);
					}}
					onReject={() => {
						handleReject(viewCourse.id);
						setViewCourse(null);
					}}
					canReviewCourses={canReviewCourses}
				/>
			)}
		</div>
	);
}
