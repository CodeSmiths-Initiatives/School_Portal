"use client";

import { usePortal } from "@/features/courses/utils/UsePortal";
import CourseHeader from "@/features/courses/components/CourseHeader";
import SideBar from "@/features/courses/components/SideBar";
import AllocateToLevels from "@/features/courses/views/AllocateToLevels";
import CourseDefinition from "@/features/courses/views/CourseDefinition";
import DefineNewCourse from "@/features/courses/views/DefineNewCourse";
import HodApproval from "@/features/courses/views/HodApproval";
import Timetable from "@/features/courses/views/Timetable";

export default function Page() {
	const {
		activePage,
		setActivePage,
		activeRole,
		setActiveRole,
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
		updateCourseStatus,
	} = usePortal();
	return (
		<div className="min-h-screen flex flex-col bg-[#f0f4fb]">
			<CourseHeader />

			{/* FIX: main must be INSIDE this flex div, not after it */}
			<div className="flex flex-1">
				<SideBar
					activePage={activePage}
					activeRole={activeRole}
					onNavigate={setActivePage}
					onRoleChange={setActiveRole}
				/>

				{/* ← main moved inside the flex container so it sits beside the sidebar */}
				<main className="flex-1 bg-[#f5f5f0] p-8 overflow-y-auto">
					{activePage === "courses-definitions" && (
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
							onDefineNew={() => setActivePage("define-new-course")}
						/>
					)}

					{activePage === "define-new-course" && (
						<DefineNewCourse
							onSave={(course) => {
								addCourse(course);
								setActivePage("courses-definitions");
							}}
							onCancel={() => setActivePage("courses-definitions")}
						/>
					)}

					{activePage === "allocate-to-levels" && (
						<AllocateToLevels courses={courses} />
					)}

					{activePage === "timetable" && <Timetable />}

					{activePage === "hod-approval" && (
						<HodApproval
							courses={courses}
							onUpdateStatus={updateCourseStatus}
						/>
					)}
				</main>
			</div>
			{/* ← closing tag for the flex wrapper — now wraps BOTH sidebar and main */}
		</div>
	);
}
