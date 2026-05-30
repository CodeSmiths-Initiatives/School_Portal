import {
	STRAPI_ENDPOINTS,
	asString,
	strapiGet,
	unwrapStrapiCollection,
	type StrapiCollectionResponse,
	type StrapiRequestOptions,
} from "@/lib/api";

export type CollegeStatus = "active" | "inactive" | "archived";

type StrapiCollege = {
	name?: unknown;
	slug?: unknown;
	code?: unknown;
	status?: unknown;
	contactEmail?: unknown;
	metadata?: unknown;
};

type UnwrappedCollege = ReturnType<typeof unwrapStrapiCollection<StrapiCollege>>[number];

export type CollegeSummary = {
	id: string;
	documentId?: string;
	numericId?: number;
	name: string;
	slug: string;
	code: string;
	status: CollegeStatus;
	contactEmail?: string;
	metadata: Record<string, unknown>;
};

function toCollegeSummary(college: UnwrappedCollege): CollegeSummary {
	const status = asString(college.status, "active");

	return {
		id: college.id,
		documentId: college.documentId,
		numericId: college.numericId,
		name: asString(college.name),
		slug: asString(college.slug),
		code: asString(college.code),
		status: ["active", "inactive", "archived"].includes(status)
			? (status as CollegeStatus)
			: "active",
		contactEmail: asString(college.contactEmail) || undefined,
		metadata:
			college.metadata && typeof college.metadata === "object" && !Array.isArray(college.metadata)
				? (college.metadata as Record<string, unknown>)
				: {},
	};
}

export async function getColleges(options?: StrapiRequestOptions) {
	const response = await strapiGet<StrapiCollectionResponse<StrapiCollege>>(
		STRAPI_ENDPOINTS.colleges,
		{
			...options,
			query: {
				sort: ["name:asc"],
				pagination: { page: 1, pageSize: 100 },
				...options?.query,
			},
		},
	);

	return unwrapStrapiCollection(response.data).map(toCollegeSummary);
}

export async function getActiveColleges(options?: StrapiRequestOptions) {
	return getColleges({
		...options,
		query: {
			filters: { status: { $eq: "active" } },
			...options?.query,
		},
	});
}
