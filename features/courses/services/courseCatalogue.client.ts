import type { Course, CourseStatus } from "@/features/courses/types/course.types";
import type {
	CourseAllocationInput,
	CourseAllocationUpdateInput,
	CourseCataloguePayload,
	CourseTimetableInput,
	CourseTimetablePayload,
} from "@/lib/services/course-catalogue.service";

async function parseError(response: Response, fallback: string) {
	const payload = (await response.json().catch(() => null)) as
		| { error?: string }
		| null;

	return payload?.error ?? fallback;
}

export async function loadCourseCatalogue(collegeSlug: string) {
	const params = new URLSearchParams({ collegeSlug });
	const response = await fetch(`/api/courses/catalogue?${params.toString()}`, {
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(await parseError(response, "Unable to load courses."));
	}

	return response.json() as Promise<CourseCataloguePayload>;
}

export async function createCourse(collegeSlug: string, course: Omit<Course, "id">) {
	const params = new URLSearchParams({ collegeSlug });
	const response = await fetch(`/api/courses/catalogue?${params.toString()}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(course),
	});

	if (!response.ok) {
		throw new Error(await parseError(response, "Unable to create course."));
	}

	return response.json() as Promise<{ course: Course }>;
}

export async function updateCourse(
	collegeSlug: string,
	courseId: string,
	course: Omit<Course, "id">,
) {
	const params = new URLSearchParams({ collegeSlug });
	const response = await fetch(
		`/api/courses/catalogue/${encodeURIComponent(courseId)}?${params.toString()}`,
		{
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(course),
		},
	);

	if (!response.ok) {
		throw new Error(await parseError(response, "Unable to update course."));
	}

	return response.json() as Promise<{ course: Course }>;
}

export async function updateCourseStatus(
	collegeSlug: string,
	courseId: string,
	status: CourseStatus,
	note?: string,
) {
	const params = new URLSearchParams({ collegeSlug });
	const response = await fetch(
		`/api/courses/catalogue/${encodeURIComponent(courseId)}/status?${params.toString()}`,
		{
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status, approvalNote: note }),
		},
	);

	if (!response.ok) {
		throw new Error(await parseError(response, "Unable to update course status."));
	}

	return response.json() as Promise<{ course: Course }>;
}

export async function deleteCourse(collegeSlug: string, courseId: string) {
	const params = new URLSearchParams({ collegeSlug });
	const response = await fetch(
		`/api/courses/catalogue/${encodeURIComponent(courseId)}?${params.toString()}`,
		{ method: "DELETE" },
	);

	if (!response.ok) {
		throw new Error(await parseError(response, "Unable to delete course."));
	}
}

export async function loadCourseTimetable(collegeSlug: string) {
	const params = new URLSearchParams({ collegeSlug });
	const response = await fetch(`/api/courses/timetable?${params.toString()}`, {
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(await parseError(response, "Unable to load timetable."));
	}

	return response.json() as Promise<CourseTimetablePayload>;
}

export async function createTimetableSlot(
	collegeSlug: string,
	slot: CourseTimetableInput,
) {
	const params = new URLSearchParams({ collegeSlug });
	const response = await fetch(`/api/courses/timetable?${params.toString()}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(slot),
	});

	if (!response.ok) {
		throw new Error(await parseError(response, "Unable to create timetable slot."));
	}

	return response.json() as Promise<{ slot: CourseTimetablePayload["slots"][number] }>;
}

export async function updateTimetableSlot(
	collegeSlug: string,
	slotId: string,
	slot: CourseTimetableInput,
) {
	const params = new URLSearchParams({ collegeSlug });
	const response = await fetch(
		`/api/courses/timetable/${encodeURIComponent(slotId)}?${params.toString()}`,
		{
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(slot),
		},
	);

	if (!response.ok) {
		throw new Error(await parseError(response, "Unable to update timetable slot."));
	}

	return response.json() as Promise<{ slot: CourseTimetablePayload["slots"][number] }>;
}

export async function deleteTimetableSlot(collegeSlug: string, slotId: string) {
	const params = new URLSearchParams({ collegeSlug });
	const response = await fetch(
		`/api/courses/timetable/${encodeURIComponent(slotId)}?${params.toString()}`,
		{ method: "DELETE" },
	);

	if (!response.ok) {
		throw new Error(await parseError(response, "Unable to delete timetable slot."));
	}
}

export async function createCourseAllocation(
	collegeSlug: string,
	input: CourseAllocationInput,
) {
	const params = new URLSearchParams({ collegeSlug });
	const response = await fetch(`/api/courses/allocations?${params.toString()}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});

	if (!response.ok) {
		throw new Error(
			await parseError(response, "Unable to create course allocation."),
		);
	}

	return response.json() as Promise<{ course: Course }>;
}

export async function updateCourseAllocation(
	collegeSlug: string,
	input: CourseAllocationUpdateInput,
) {
	const params = new URLSearchParams({ collegeSlug });
	const response = await fetch(`/api/courses/allocations?${params.toString()}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});

	if (!response.ok) {
		throw new Error(
			await parseError(response, "Unable to update course allocation."),
		);
	}

	return response.json() as Promise<{ courses: Course[] }>;
}

export async function deleteCourseAllocation(
	collegeSlug: string,
	input: CourseAllocationInput,
) {
	const params = new URLSearchParams({
		collegeSlug,
		courseId: input.courseId,
		level: input.level,
	});
	const response = await fetch(`/api/courses/allocations?${params.toString()}`, {
		method: "DELETE",
	});

	if (!response.ok) {
		throw new Error(
			await parseError(response, "Unable to delete course allocation."),
		);
	}

	return response.json() as Promise<{ course: Course }>;
}
