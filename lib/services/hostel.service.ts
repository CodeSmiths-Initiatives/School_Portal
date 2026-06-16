const DEV_INTERNAL_SECRET =
	"iums-local-registration-secret-change-before-production";

export type HostelGender = "Female" | "Male" | "Mixed";
export type HostelStatus = "active" | "inactive" | "maintenance";
export type HostelBedStatus =
	| "available"
	| "reserved"
	| "allocated"
	| "maintenance"
	| "inactive";
export type HostelComplaintStatus =
	| "Open"
	| "In Progress"
	| "Resolved"
	| "Escalated";
export type HostelComplaintPriority = "Low" | "Medium" | "High" | "Critical";

export type HostelBed = {
	id: string;
	numericId?: number;
	label: string;
	price: number;
	currency: string;
	status: HostelBedStatus;
	reservedUntil?: string;
};

export type HostelRoom = {
	id: string;
	numericId?: number;
	roomNumber: string;
	block: string;
	floor: string;
	capacity: number;
	status: string;
	wardenNote: string;
	available: number;
	occupied: number;
	beds: HostelBed[];
	updatedAt: string;
	hostelId: string;
	hostelName: string;
};

export type Hostel = {
	id: string;
	numericId?: number;
	name: string;
	code: string;
	gender: HostelGender;
	warden: string;
	fee: number;
	currency: string;
	amenities: string[];
	status: HostelStatus;
	totalBeds: number;
	availableBeds: number;
	updatedAt: string;
};

export type HostelAllocation = {
	id: string;
	numericId?: number;
	allocationNumber: string;
	studentName: string;
	studentEmail: string;
	studentIdentifier: string;
	level: string;
	status: "reserved" | "allocated" | "cancelled" | "expired";
	paymentStatus: "pending" | "paid" | "review" | "failed";
	allocatedBy: string;
	note: string;
	hostelId: string;
	hostelName: string;
	roomId: string;
	roomNumber: string;
	bedId: string;
	bedLabel: string;
	invoiceNumber: string;
	invoiceStatus: string;
	amount: number;
	currency: string;
	updatedAt: string;
};

export type HostelComplaint = {
	id: string;
	numericId?: number;
	category: string;
	issue: string;
	description: string;
	priority: HostelComplaintPriority;
	status: HostelComplaintStatus;
	assignedTo: string;
	resolutionNote: string;
	studentName: string;
	studentIdentifier: string;
	hostelName: string;
	roomNumber: string;
	bedLabel: string;
	updatedAt: string;
	createdAt: string;
};

export type HostelPayload = {
	college: {
		id: number | string;
		name: string;
		slug: string;
		code: string;
	};
	hostels: Hostel[];
	rooms: HostelRoom[];
	allocations: HostelAllocation[];
	complaints: HostelComplaint[];
	generatedAt: string;
};

export type CreateHostelInput = {
	name: string;
	code?: string;
	gender: HostelGender;
	warden?: string;
	fee: number;
	currency?: string;
	amenities?: string[];
	status?: HostelStatus;
};

export type CreateHostelRoomInput = {
	hostelId: string;
	roomNumber: string;
	block?: string;
	floor?: string;
	capacity: number;
	price: number;
	status?: "active" | "inactive" | "maintenance";
	wardenNote?: string;
};

export type UpdateHostelInput = Partial<CreateHostelInput>;

export type UpdateHostelRoomInput = Partial<
	Omit<CreateHostelRoomInput, "hostelId">
>;

export type UpdateHostelBedInput = {
	status?: HostelBedStatus;
	price?: number;
};

export type ReserveHostelBedInput = {
	bedId: string;
	studentId?: string;
	studentName: string;
	studentEmail?: string;
	studentIdentifier: string;
	level?: string;
};

export type InitializeHostelPaymentInput = {
	allocationId: string;
	reference: string;
	accessCode: string;
	channel: string;
};

export type VerifyHostelPaymentInput = {
	allocationId: string;
	reference: string;
	amount: number;
	currency: string;
	channel?: string;
	paidAt?: string;
	verifiedAt: string;
	rawGatewayResponse?: unknown;
};

export type CreateHostelComplaintInput = {
	allocationId: string;
	category: string;
	issue: string;
	description?: string;
	priority: HostelComplaintPriority;
};

export type UpdateHostelComplaintInput = {
	status: HostelComplaintStatus;
	priority: HostelComplaintPriority;
	assignedTo?: string;
	resolutionNote?: string;
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
		throw new Error(await parseError(response, "Hostel request failed."));
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}

export async function getHostelData(
	collegeSlug: string,
	studentIdentifier?: string,
) {
	const params = new URLSearchParams({ collegeSlug });

	if (studentIdentifier) {
		params.set("studentIdentifier", studentIdentifier);
	}

	return internalFetch<HostelPayload>(`/api/internal/hostels?${params.toString()}`);
}

export async function createHostel(
	collegeSlug: string,
	input: CreateHostelInput,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<{ hostel: Hostel }>(
		`/api/internal/hostels?${params.toString()}`,
		{ method: "POST", body: input },
	);
}

export async function updateHostel(
	collegeSlug: string,
	hostelId: string | number,
	input: UpdateHostelInput,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<{ hostel: Hostel }>(
		`/api/internal/hostels/${hostelId}?${params.toString()}`,
		{ method: "PATCH", body: input },
	);
}

export async function createHostelRoom(
	collegeSlug: string,
	input: CreateHostelRoomInput,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<{ room: HostelRoom }>(
		`/api/internal/hostel-rooms?${params.toString()}`,
		{ method: "POST", body: input },
	);
}

export async function updateHostelRoom(
	collegeSlug: string,
	roomId: string | number,
	input: UpdateHostelRoomInput,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<{ room: HostelRoom }>(
		`/api/internal/hostel-rooms/${roomId}?${params.toString()}`,
		{ method: "PATCH", body: input },
	);
}

export async function deleteHostelRoom(
	collegeSlug: string,
	roomId: string | number,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<void>(
		`/api/internal/hostel-rooms/${roomId}?${params.toString()}`,
		{ method: "DELETE" },
	);
}

export async function updateHostelBed(
	collegeSlug: string,
	bedId: string | number,
	input: UpdateHostelBedInput,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<{ bed: HostelBed }>(
		`/api/internal/hostel-beds/${bedId}?${params.toString()}`,
		{ method: "PATCH", body: input },
	);
}

export async function reserveHostelBed(
	collegeSlug: string,
	input: ReserveHostelBedInput,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<{ allocation: HostelAllocation }>(
		`/api/internal/hostel-reservations?${params.toString()}`,
		{ method: "POST", body: input },
	);
}

export async function initializeHostelPaymentRecord(
	collegeSlug: string,
	input: InitializeHostelPaymentInput,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<{ ok: true }>(
		`/api/internal/hostel-payments/initialize?${params.toString()}`,
		{ method: "POST", body: input },
	);
}

export async function verifyHostelPaymentRecord(
	collegeSlug: string,
	input: VerifyHostelPaymentInput,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<{ allocation: HostelAllocation }>(
		`/api/internal/hostel-payments/verify?${params.toString()}`,
		{ method: "POST", body: input },
	);
}

export async function createHostelComplaint(
	collegeSlug: string,
	input: CreateHostelComplaintInput,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<{ complaint: HostelComplaint }>(
		`/api/internal/hostel-complaints?${params.toString()}`,
		{ method: "POST", body: input },
	);
}

export async function updateHostelComplaint(
	collegeSlug: string,
	complaintId: string | number,
	input: UpdateHostelComplaintInput,
) {
	const params = new URLSearchParams({ collegeSlug });

	return internalFetch<{ complaint: HostelComplaint }>(
		`/api/internal/hostel-complaints/${complaintId}?${params.toString()}`,
		{ method: "PATCH", body: input },
	);
}
