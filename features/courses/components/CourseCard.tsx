"use client";

import { Course } from "../types/course.types";

const TYPE_COLORS: Record<string, string> = {
	Elective: "bg-blue-100 text-blue-700",
	Core: "bg-emerald-100 text-emerald-700",
	Required: "bg-red-100 text-red-700",
	Borrowed: "bg-orange-100 text-orange-700",
};

const STATUS_COLORS: Record<string, string> = {
	Pending: "bg-amber-100 text-amber-700",
	Approved: "bg-emerald-100 text-emerald-700",
	Rejected: "bg-red-100 text-red-700",
};

interface Props {
	course: Course;
	onView?: (course: Course) => void;
}

export default function CourseCard({ course, onView }: Props) {
	return (
		<div className="bg-white rounded-2xl border border-[#808B96]/50 p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
			{/* Top row */}
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<p className="text-[11px] text-[#8a9ab5]">
						{course.code} · {course.department}
					</p>
					<h3 className="font-bold text-[#1a2b52] text-base leading-snug mt-0.5">
						{course.title}
					</h3>
					<p className="text-xs text-[#8a9ab5] mt-1 leading-relaxed">
						{course.description}
					</p>
				</div>
				<span
					className={`text-[11px] font-bold px-3 py-1 rounded-full shrink-0
          ${STATUS_COLORS[course.status]}`}
				>
					{course.status}
				</span>
			</div>

			{/* If Required label */}
			{course.type === "Required" && (
				<p className="text-xs font-bold text-red-500">Required</p>
			)}

			{/* Tags row */}
			<div className="flex flex-wrap gap-1.5">
				<span
					className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[course.type]}`}
				>
					{course.type}
				</span>
				<span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
					{course.units} Units
				</span>
				{course.levels.map((l) => (
					<span
						key={l}
						className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#f0f5fb] text-[#4a5a7a]"
					>
						{l}
					</span>
				))}
				{course.mode === "Online" && (
					<span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-600">
						Online
					</span>
				)}
			</div>

			{/* Schedule row */}
			<div className="flex flex-wrap gap-2">
				<span className="text-[11px] font-medium text-[#4a5a7a] bg-[#f0f5fb] px-2.5 py-1 rounded-full">
					{course.mode === "Online" ? "🌐 Online" : "📍 On-Site"}
				</span>
				<span className="text-[11px] font-medium text-[#4a5a7a] bg-[#f0f5fb] px-2.5 py-1 rounded-full">
					{course.schedule}
				</span>
			</div>

			{/* Footer */}
			<div className="flex items-center justify-between pt-1 border-t border-[#f0f5fb]">
				<div className="flex items-center gap-2">
					<div className="w-6 h-6 rounded-full bg-[#3d5a9e] flex items-center justify-center">
						<span className="text-white text-[9px] font-bold">
							{course.lecturer
								.split(" ")
								.map((w) => w[0])
								.join("")
								.slice(0, 2)}
						</span>
					</div>
					<span className="text-xs text-[#6b7e9f]">{course.lecturer}</span>
				</div>
				<button
					onClick={() => onView?.(course)}
					className="border border-[#dce6f2] rounded-lg px-4 py-1.5 text-xs font-semibold
            text-[#4a5a7a] hover:border-[#3d5a9e] hover:text-[#3d5a9e] transition-colors"
				>
					View
				</button>
			</div>
		</div>
	);
}
