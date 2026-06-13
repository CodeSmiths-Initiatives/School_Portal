import type { Course } from "@/features/courses/types/course.types";
import type { CourseCataloguePayload } from "@/lib/services/course-catalogue.service";

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
