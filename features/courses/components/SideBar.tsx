"use client";

import { NavPage, Role } from "../types/course.types";

interface Props {
	activePage: NavPage;
	activeRole: Role;
	onNavigate: (page: NavPage) => void;
	onRoleChange: (role: Role) => void;
}

const ROLES: Role[] = ["Lecturer", "HOD", "Student"];

const NAV_ITEMS = [
	{
		section: "MANAGEMENT",
		items: [
			{ key: "courses-definitions" as NavPage, label: "Courses Definitions" },
			{ key: "define-new-course" as NavPage, label: "Define New Course" },
			{ key: "allocate-to-levels" as NavPage, label: "Allocate to Levels" },
			{ key: "timetable" as NavPage, label: "Timetable" },
		],
	},
	{
		section: "WORKFLOW",
		items: [{ key: "hod-approval" as NavPage, label: "HOD Approval" }],
	},
];

export default function SideBar({
	activePage,
	activeRole,
	onNavigate,
	onRoleChange,
}: Props) {
	return (
		<aside className="w-68 bg-[#0D2B55] min-h-screen flex flex-col shrink-0">
			{/* Logo / Portal name */}
			<div className="flex items-center gap-3 px-5 pt-6 pb-5">
				<div className="w-10 h-10 rounded-xl bg-[#4284F4] flex items-center justify-center shrink-0">
					<span className="text-white text-lg font-bold">C</span>
				</div>
				<div>
					<p className="text-white font-bold text-sm leading-tight">
						Course Portal
					</p>
					<p className="text-[#808B96] text-xs">Academic Management</p>
				</div>
			</div>

			{/* Role tabs */}
			<div className="flex gap-1.5 px-4 pb-5">
				{ROLES.map((role) => (
					<button
						key={role}
						onClick={() => onRoleChange(role)}
						className={`flex-1 py-1.5 rounded-sm text-xs font-semibold transition-all
              ${
								activeRole === role
									? "bg-[#4284F4]/30 border border-[#4284F4] text-white"
									: " bg-inherit border border-[#4284F4] text-[#808B96] hover:text-white/70"
							}`}
					>
						{role}
					</button>
				))}
			</div>

			{/* Nav sections */}
			<nav className="flex-1 px-3 flex flex-col gap-5">
				{NAV_ITEMS.map((section) => (
					<div key={section.section}>
						<p className="text-[9px] font-bold tracking-widest text-white/30 uppercase px-3 mb-2">
							{section.section}
						</p>
						{section.items.map((item) => (
							<button
								key={item.key}
								onClick={() => onNavigate(item.key)}
								className={`w-full text-left px-4 py-2.5 rounded-sm text-sm font-medium transition-all mb-0.5
                  ${
										activePage === item.key
											? "bg-[#4284F4]/30 border border-[#4284F4] text-white shadow-sm"
											: " bg-inherit  text-[#808B96] hover:text-white/70 hover:bg-white/5"
									}`}
							>
								{item.label}
							</button>
						))}
					</div>
				))}
			</nav>

			{/* Footer user */}
			<div className="border-t border-white/10 px-5 py-4">
				<p className="text-white font-semibold text-sm">Dr. Adeyemi Bolaji</p>
				<span
					className="inline-block mt-1.5 border border-[#4284F4] bg-[#4284F4]/30 text-[#4284F4] text-[10px] font-bold
          tracking-wide px-2.5 py-1 rounded-md uppercase"
				>
					Lecturers CSC Dept.
				</span>
			</div>
		</aside>
	);
}
