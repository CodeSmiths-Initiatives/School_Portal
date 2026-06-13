import type { Course, Level, TimelineSlot } from "@/features/courses/types/course.types";
import {
	getCourseCatalogue,
	getCourseTimetable,
	type CourseCataloguePayload,
	type CourseTimetablePayload,
} from "@/lib/services/course-catalogue.service";

export type StudentCourseAllocation = {
	level: Level;
	courses: Course[];
	totalUnits: number;
};

export type StudentCourseData = {
	college: CourseCataloguePayload["college"];
	courses: Course[];
	allocations: StudentCourseAllocation[];
	timetableSlots: TimelineSlot[];
	summary: {
		allocatedCourses: number;
		totalUnits: number;
		activeLevels: number;
		timetableSlots: number;
	};
	generatedAt: string;
};

const LEVEL_ORDER: Level[] = ["100L", "200L", "300L", "400L"];

function sortByLevel(left: Level, right: Level) {
	return LEVEL_ORDER.indexOf(left) - LEVEL_ORDER.indexOf(right);
}

function getApprovedAllocatedCourses(courses: Course[]) {
	return courses
		.filter((course) => course.status === "Approved" && course.levels.length > 0)
		.sort((left, right) => {
			const levelCompare = sortByLevel(left.levels[0] ?? "100L", right.levels[0] ?? "100L");

			return levelCompare || left.code.localeCompare(right.code);
		});
}

function getAllocations(courses: Course[]) {
	const byLevel = new Map<Level, Course[]>();

	for (const course of courses) {
		for (const level of course.levels) {
			byLevel.set(level, [...(byLevel.get(level) ?? []), course]);
		}
	}

	return Array.from(byLevel.entries())
		.sort(([left], [right]) => sortByLevel(left, right))
		.map(([level, levelCourses]) => ({
			level,
			courses: levelCourses.sort((left, right) => left.code.localeCompare(right.code)),
			totalUnits: levelCourses.reduce((sum, course) => sum + course.units, 0),
		}));
}

function getStudentTimetableSlots(
	timetable: CourseTimetablePayload,
	courses: Course[],
) {
	const courseIds = new Set(courses.map((course) => course.id));
	const courseCodes = new Set(courses.map((course) => course.code));

	return timetable.slots
		.filter((slot) => {
			if (slot.courseId && courseIds.has(slot.courseId)) {
				return true;
			}

			return courseCodes.has(slot.code);
		})
		.sort((left, right) => {
			const dayCompare = left.day.localeCompare(right.day);
			return dayCompare || left.time.localeCompare(right.time) || sortByLevel(left.level, right.level);
		});
}

export async function getStudentCourseData(
	collegeSlug: string,
): Promise<StudentCourseData> {
	const [catalogue, timetable] = await Promise.all([
		getCourseCatalogue(collegeSlug),
		getCourseTimetable(collegeSlug),
	]);
	const courses = getApprovedAllocatedCourses(catalogue.courses);
	const allocations = getAllocations(courses);
	const timetableSlots = getStudentTimetableSlots(timetable, courses);
	const totalUnits = allocations.reduce(
		(sum, allocation) => sum + allocation.totalUnits,
		0,
	);

	return {
		college: catalogue.college,
		courses,
		allocations,
		timetableSlots,
		summary: {
			allocatedCourses: courses.length,
			totalUnits,
			activeLevels: allocations.length,
			timetableSlots: timetableSlots.length,
		},
		generatedAt: new Date().toISOString(),
	};
}
