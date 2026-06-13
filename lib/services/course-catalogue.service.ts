import type {
	Course,
	CourseStatus,
	TimelineSlot,
} from "@/features/courses/types/course.types";

const DEV_INTERNAL_SECRET =
	"iums-local-registration-secret-change-before-production";

export type CourseCataloguePayload = {
	college: {
		id: number | string;
		name: string;
		slug: string;
		code: string;
	};
	courses: Course[];
	count: number;
	generatedAt: string;
};
export type CourseTimetablePayload = {
	college: CourseCataloguePayload["college"];
	slots: TimelineSlot[];
	count: number;
	generatedAt: string;
};

export type CourseMutationInput = Omit<Course, "id">;
export type CourseTimetableInput = Omit<TimelineSlot, "id">;
export type CourseAllocationInput = {
	courseId: string;
	level: Course["levels"][number];
};
export type CourseAllocationUpdateInput = CourseAllocationInput & {
	nextCourseId: string;
	nextLevel: Course["levels"][number];
};

function getStrapiBaseUrl() {
	return (
		process.env.STRAPI_API_URL ??
		process.env.NEXT_PUBLIC_STRAPI_API_URL ??
		"http://localhost:1337"
	).replace(/\/$/, "");
}

function getInternalSecret() {
	const configured =
		process.env.PORTAL_INTERNAL_API_SECRET ?? process.env.PORTAL_REGISTRATION_SECRET;

	if (configured) return configured;

	if (process.env.NODE_ENV === "production") {
		throw new Error("PORTAL_INTERNAL_API_SECRET is required in production.");
	}

	return DEV_INTERNAL_SECRET;
}

async function parseError(response: Response, fallback: string) {
	const payload = (await response.json().catch(() => null)) as
		| { error?: { message?: string }; message?: string }
		| null;

	return payload?.error?.message ?? payload?.message ?? fallback;
}

async function internalFetch<T>(
	path: string,
	options?: {
		method?: "GET" | "POST" | "PATCH" | "DELETE";
		body?: unknown;
	},
) {
	const response = await fetch(`${getStrapiBaseUrl()}${path}`, {
		method: options?.method ?? "GET",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			"x-portal-internal-secret": getInternalSecret(),
		},
		body: options?.body ? JSON.stringify(options.body) : undefined,
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(await parseError(response, "Course catalogue request failed."));
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}

export async function getCourseCatalogue(collegeSlug: string) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<CourseCataloguePayload>(
		`/api/internal/course-catalogue?${params.toString()}`,
	);
}

export async function createCourseCatalogueItem(
	collegeSlug: string,
	input: CourseMutationInput,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<{ course: Course }>(
		`/api/internal/course-catalogue?${params.toString()}`,
		{
			method: "POST",
			body: input,
		},
	);
}

export async function updateCourseCatalogueItem(
	collegeSlug: string,
	courseId: string | number,
	input: CourseMutationInput,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<{ course: Course }>(
		`/api/internal/course-catalogue/${courseId}?${params.toString()}`,
		{
			method: "PATCH",
			body: input,
		},
	);
}

export async function updateCourseCatalogueStatus(
	collegeSlug: string,
	courseId: string | number,
	status: CourseStatus,
	note?: string,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<{ course: Course }>(
		`/api/internal/course-catalogue/${courseId}/status?${params.toString()}`,
		{
			method: "PATCH",
			body: { status, approvalNote: note },
		},
	);
}

export async function deleteCourseCatalogueItem(
	collegeSlug: string,
	courseId: string | number,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<void>(
		`/api/internal/course-catalogue/${courseId}?${params.toString()}`,
		{ method: "DELETE" },
	);
}

export async function getCourseTimetable(collegeSlug: string) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<CourseTimetablePayload>(
		`/api/internal/course-timetable?${params.toString()}`,
	);
}

export async function createCourseTimetableSlot(
	collegeSlug: string,
	input: CourseTimetableInput,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<{ slot: TimelineSlot }>(
		`/api/internal/course-timetable?${params.toString()}`,
		{
			method: "POST",
			body: input,
		},
	);
}

export async function updateCourseTimetableSlot(
	collegeSlug: string,
	slotId: string | number,
	input: CourseTimetableInput,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<{ slot: TimelineSlot }>(
		`/api/internal/course-timetable/${slotId}?${params.toString()}`,
		{
			method: "PATCH",
			body: input,
		},
	);
}

export async function deleteCourseTimetableSlot(
	collegeSlug: string,
	slotId: string | number,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<void>(
		`/api/internal/course-timetable/${slotId}?${params.toString()}`,
		{ method: "DELETE" },
	);
}

export async function createCourseAllocation(
	collegeSlug: string,
	input: CourseAllocationInput,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<{ course: Course }>(
		`/api/internal/course-allocations?${params.toString()}`,
		{
			method: "POST",
			body: input,
		},
	);
}

export async function updateCourseAllocation(
	collegeSlug: string,
	input: CourseAllocationUpdateInput,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<{ courses: Course[] }>(
		`/api/internal/course-allocations?${params.toString()}`,
		{
			method: "PATCH",
			body: input,
		},
	);
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

	return internalFetch<{ course: Course }>(
		`/api/internal/course-allocations?${params.toString()}`,
		{ method: "DELETE" },
	);
}
