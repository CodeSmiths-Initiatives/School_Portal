import type { AdmissionApplicationSummary } from "@/lib/services/admission-application.service";

const DEV_INTERNAL_SECRET =
	"iums-local-registration-secret-change-before-production";

export type CollegeAdminPermission = {
	id: number | string;
	key: string;
	module: string;
	action: string;
	label: string;
	description?: string;
};

export type CollegeAdminRole = {
	id: number | string;
	documentId?: string;
	name: string;
	code: string;
	description?: string;
	roleType: "system" | "custom";
	tenantScope: "platform" | "college";
	scopeType: "college" | "faculty" | "department" | "course" | "self" | "platform";
	permissions: CollegeAdminPermission[];
	createdAt?: string;
	updatedAt?: string;
};

export type CollegeAdminStudentRecord = {
	id: string;
	username: string;
	email: string;
	confirmed: boolean;
	blocked: boolean;
	role: {
		name: string;
		code: string;
	};
	assignment: {
		id?: number | string;
		scopeType?: string;
		status?: string;
		isPrimary?: boolean;
	};
	createdAt?: string;
	updatedAt?: string;
	hasApplicationRecord: boolean;
	hasAdmissionData: boolean;
	application: AdmissionApplicationSummary | null;
};

export type CollegeAdminStudentPayload = {
	college: {
		id: number | string;
		name: string;
		slug: string;
		code: string;
		status?: string;
	};
	students: CollegeAdminStudentRecord[];
	count: number;
	withApplicationRecord?: number;
	withAdmissionData: number;
	generatedAt: string;
};

export type CollegeAdminRolesPayload = {
	college: {
		id: number | string;
		name: string;
		slug: string;
		code: string;
	};
	roles: CollegeAdminRole[];
	permissions: CollegeAdminPermission[];
};

export type CollegeAdminReportPayload = {
	college: {
		id: number | string;
		name: string;
		slug: string;
		code: string;
	};
	summary: {
		totalStudents: number;
		totalApplications: number;
		submittedApplications: number;
		draftApplications: number;
		totalPaid: number;
		totalPending: number;
		totalInvoices: number;
		activeStaff: number;
	};
	charts: {
		admissionStatus: Array<{ label: string; value: number }>;
		paymentStatus: Array<{ label: string; value: number }>;
		monthlyAdmissions: Array<{ label: string; value: number }>;
		monthlyPayments: Array<{ label: string; value: number }>;
	};
	generatedAt: string;
};

export type CollegeRoleMutationInput = {
	name: string;
	description?: string;
	scopeType: "college" | "faculty" | "department" | "course";
	permissionKeys: string[];
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

	if (configured) {
		return configured;
	}

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
		method?: "GET" | "POST" | "PATCH";
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
		throw new Error(await parseError(response, "College admin request failed."));
	}

	return response.json() as Promise<T>;
}

export async function listCollegeAdminStudents(collegeSlug: string) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<CollegeAdminStudentPayload>(
		`/api/internal/college-admin/students?${params.toString()}`,
	);
}

export async function getCollegeAdminRoles(collegeSlug: string) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<CollegeAdminRolesPayload>(
		`/api/internal/college-admin/roles?${params.toString()}`,
	);
}

export async function createCollegeAdminRole(
	collegeSlug: string,
	input: CollegeRoleMutationInput,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<{ role: CollegeAdminRole }>(
		`/api/internal/college-admin/roles?${params.toString()}`,
		{
			method: "POST",
			body: input,
		},
	);
}

export async function updateCollegeAdminRole(
	collegeSlug: string,
	roleId: string | number,
	input: CollegeRoleMutationInput,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<{ role: CollegeAdminRole }>(
		`/api/internal/college-admin/roles/${roleId}?${params.toString()}`,
		{
			method: "PATCH",
			body: input,
		},
	);
}

export async function getCollegeAdminReports(input: {
	collegeSlug: string;
	from?: string;
	to?: string;
}) {
	const params = new URLSearchParams({ collegeSlug: input.collegeSlug });

	if (input.from) params.set("from", input.from);
	if (input.to) params.set("to", input.to);

	return internalFetch<CollegeAdminReportPayload>(
		`/api/internal/college-admin/reports?${params.toString()}`,
	);
}
