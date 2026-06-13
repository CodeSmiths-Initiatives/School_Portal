"use client";

import {
	BadgeCheck,
	BookOpenCheck,
	CalendarDays,
	Layers3,
	PanelLeftClose,
	PanelLeftOpen,
	ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState, type ElementType } from "react";
import AllocateToLevels from "@/features/courses/views/AllocateToLevels";
import CourseDefinition from "@/features/courses/views/CourseDefinition";
import HodApproval from "@/features/courses/views/HodApproval";
import Timetable from "@/features/courses/views/Timetable";
import { usePortal } from "@/features/courses/utils/UsePortal";
import type { NavPage } from "@/features/courses/types/course.types";
import {
	hasPermissions,
	type PermissionKey,
	type UserPermissionKey,
} from "@/lib/rbac";

type CourseModuleWorkspaceProps = {
	permissions: UserPermissionKey[];
	collegeName: string;
};

type CourseMenuItem = {
	label: string;
	description: string;
	view: NavPage;
	icon: ElementType;
	requiredPermissions: PermissionKey[];
	permissionMode?: "all" | "any";
};

const COURSE_MENU: CourseMenuItem[] = [
	{
		label: "Course Catalogue",
		description: "Published courses and semester filters",
		view: "courses-definitions",
		icon: BookOpenCheck,
		requiredPermissions: ["courses.view"],
	},
	{
		label: "Level Allocation",
		description: "Assign approved courses to levels",
		view: "allocate-to-levels",
		icon: Layers3,
		requiredPermissions: ["courses.assign_staff"],
	},
	{
		label: "Timetable",
		description: "Review weekly course schedule",
		view: "timetable",
		icon: CalendarDays,
		requiredPermissions: ["courses.view"],
	},
	{
		label: "HOD Approval",
		description: "Approve or reject submitted courses",
		view: "hod-approval",
		icon: BadgeCheck,
		requiredPermissions: ["courses.approve", "courses.reject"],
		permissionMode: "any",
	},
];

const COURSE_SUMMARY = [
	{ label: "Active Courses", value: "42", note: "Current session" },
	{ label: "Pending Review", value: "08", note: "Academic approval queue" },
	{ label: "Departments", value: "06", note: "College-scoped catalogue" },
];

function can(
	permissions: UserPermissionKey[],
	requiredPermissions: PermissionKey[],
	mode: "all" | "any" = "all",
) {
	return hasPermissions(permissions, requiredPermissions, { mode });
}

export default function CourseModuleWorkspace({
	permissions,
	collegeName,
}: CourseModuleWorkspaceProps) {
	const {
		activePage,
		setActivePage,
		courses,
		filteredCourses,
		stats,
		searchQuery,
		setSearchQuery,
		typeFilter,
		setTypeFilter,
		statusFilter,
		setStatusFilter,
		activeLevel,
		setActiveLevel,
		addCourse,
		updateCourse,
		updateCourseStatus,
		deleteCourse,
	} = usePortal();
	const [isCollapsed, setIsCollapsed] = useState(false);

	const visibleMenu = useMemo(
		() =>
			COURSE_MENU.filter((item) =>
				can(permissions, item.requiredPermissions, item.permissionMode),
			),
		[permissions],
	);
	const canCreateCourse = can(permissions, ["courses.create"]);
	const canAssignCourse = can(permissions, ["courses.assign_staff"]);
	const canManageTimetable = can(permissions, ["courses.update"], "any");
	const canReviewCourses = can(
		permissions,
		["courses.approve", "courses.reject"],
		"any",
	);

	useEffect(() => {
		if (
			visibleMenu.length > 0 &&
			!visibleMenu.some((item) => item.view === activePage)
		) {
			setActivePage(visibleMenu[0].view);
		}
	}, [activePage, setActivePage, visibleMenu]);

	const activeMenuItem =
		visibleMenu.find((item) => item.view === activePage) ?? visibleMenu[0];

	return (
		<div className="rounded-[1.5rem] border border-[#dbe5f1] bg-white p-3 shadow-sm sm:p-4 xl:p-5">
			<div className="grid items-start gap-5 lg:grid-cols-[auto_minmax(0,1fr)]">
				<aside
					className={`h-fit shrink-0 overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white shadow-sm transition-all duration-300 lg:sticky lg:top-0 ${
						isCollapsed ? "lg:w-[4.75rem]" : "lg:w-64"
					}`}
				>
					<div className="flex items-center justify-between gap-3 bg-[#0D2B55] px-4 py-4 text-white">
						<div className={isCollapsed ? "lg:hidden" : ""}>
							<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#E4A11B]">
								Course Menu
							</p>
							<p className="mt-1 text-sm font-semibold text-white/90">
								Academic tools
							</p>
						</div>
						<button
							type="button"
							onClick={() => setIsCollapsed((current) => !current)}
							className="flex size-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
							aria-label={isCollapsed ? "Expand course menu" : "Collapse course menu"}
						>
							{isCollapsed ? (
								<PanelLeftOpen className="size-4" />
							) : (
								<PanelLeftClose className="size-4" />
							)}
						</button>
					</div>

					<nav className="space-y-2 p-3">
						{visibleMenu.map((item) => {
							const Icon = item.icon;
							const isActive = activeMenuItem?.view === item.view;

							return (
								<button
									key={item.view}
									type="button"
									onClick={() => setActivePage(item.view)}
									className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
										isActive
											? "border border-[#E4A11B]/50 bg-[#fff7e8] text-[#0D2B55]"
											: "text-[#354762] hover:bg-[#f6f9fd]"
									}`}
								>
									<span
										className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
											isActive
												? "bg-[#E4A11B]/15 text-[#B7770D]"
												: "bg-[#eef4fb] text-[#557090]"
										}`}
									>
										<Icon className="size-4.5" />
									</span>
									<span className={isCollapsed ? "lg:hidden" : ""}>
										<span className="block">{item.label}</span>
										<span className="mt-0.5 block text-[11px] font-medium leading-4 text-[#71839e]">
											{item.description}
										</span>
									</span>
								</button>
							);
						})}
					</nav>
				</aside>

				<div className="min-w-0 space-y-5">
					<section className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-5">
						<div className="flex flex-wrap items-start justify-between gap-4">
							<div>
								<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B7770D]">
									{collegeName}
								</p>
								<h2 className="mt-2 text-2xl font-bold text-[#0D2B55]">
									Course Management
								</h2>
								<p className="mt-2 max-w-3xl text-sm leading-6 text-[#60728f]">
									Manage college-scoped course catalogue, level allocation,
									timetable, and approval workflows from one role-aware module.
								</p>
							</div>
							<div className="flex items-center gap-3 rounded-2xl border border-[#dbe5f1] bg-white px-4 py-3">
								<div className="flex size-11 items-center justify-center rounded-xl bg-[#eef8f1] text-[#16803c]">
									<ShieldCheck className="size-5" />
								</div>
								<div>
									<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8495af]">
										Access
									</p>
									<p className="mt-1 text-sm font-bold text-[#0D2B55]">
										Permission controlled
									</p>
								</div>
							</div>
						</div>

						<div className="mt-5 grid gap-3 sm:grid-cols-3">
							{COURSE_SUMMARY.map((item) => (
								<div
									key={item.label}
									className="rounded-2xl border border-[#e3eaf4] bg-white p-4"
								>
									<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8395AF]">
										{item.label}
									</p>
									<p className="mt-2 text-2xl font-bold text-[#0D2B55]">
										{item.value}
									</p>
									<p className="mt-1 text-sm text-[#60728f]">{item.note}</p>
								</div>
							))}
						</div>
					</section>

					<section className="min-w-0 rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4 shadow-sm sm:p-5">
						{activePage === "courses-definitions" ? (
							<CourseDefinition
								courses={filteredCourses}
								stats={stats}
								searchQuery={searchQuery}
								onSearch={setSearchQuery}
								typeFilter={typeFilter}
								onTypeFilter={setTypeFilter}
								statusFilter={statusFilter}
								onStatusFilter={setStatusFilter}
								activeLevel={activeLevel}
								onLevelFilter={setActiveLevel}
								onDefineNew={addCourse}
								onUpdateCourse={updateCourse}
								onDeleteCourse={deleteCourse}
								canDefineCourse={canCreateCourse}
							/>
						) : null}

						{activePage === "allocate-to-levels" && canAssignCourse ? (
							<AllocateToLevels
								courses={courses}
								canManageAllocations={canAssignCourse}
							/>
						) : null}

						{activePage === "timetable" ? (
							<Timetable canManageTimetable={canManageTimetable} />
						) : null}

						{activePage === "hod-approval" && canReviewCourses ? (
							<HodApproval
								courses={courses}
								onUpdateStatus={updateCourseStatus}
								canReviewCourses={canReviewCourses}
							/>
						) : null}
					</section>
				</div>
			</div>
		</div>
	);
}
