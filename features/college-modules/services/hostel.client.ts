import type {
	CreateHostelComplaintInput,
	CreateHostelInput,
	CreateHostelRoomInput,
	Hostel,
	HostelAllocation,
	HostelBed,
	HostelComplaint,
	HostelRoom,
	HostelPayload,
	ReserveHostelBedInput,
	UpdateHostelBedInput,
	UpdateHostelComplaintInput,
	UpdateHostelInput,
	UpdateHostelRoomInput,
	VerifyHostelPaymentInput,
} from "@/lib/services/hostel.service";

type HostelPaymentInitializeInput = {
	allocationId: string;
	email?: string;
	channel?: "card";
};

type HostelPaymentInitialization = {
	accessCode: string;
	reference: string;
};

async function parseError(response: Response, fallback: string) {
	const payload = (await response.json().catch(() => null)) as
		| { error?: string }
		| null;

	return payload?.error ?? fallback;
}

async function request<T>(
	path: string,
	options?: { method?: "GET" | "POST" | "PATCH"; body?: unknown },
) {
	const response = await fetch(path, {
		method: options?.method ?? "GET",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: options?.body ? JSON.stringify(options.body) : undefined,
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(await parseError(response, "Hostel request failed."));
	}

	return response.json() as Promise<T>;
}

export async function resumeHostelPaystackPayment(
	accessCode: string,
	handlers: {
		onSuccess: (transaction: { reference?: string; message?: string }) => void | Promise<void>;
		onCancel: () => void;
		onError: (error: unknown) => void;
	},
) {
	const { default: PaystackPop } = await import("@paystack/inline-js");
	const popup = new PaystackPop();

	popup.resumeTransaction(accessCode, {
		onSuccess: handlers.onSuccess,
		onCancel: handlers.onCancel,
		onError: handlers.onError,
	});
}

export function loadHostelData(collegeSlug: string) {
	const params = new URLSearchParams({ collegeSlug });
	return request<HostelPayload>(`/api/hostels?${params.toString()}`);
}

export function createHostelRecord(collegeSlug: string, input: CreateHostelInput) {
	const params = new URLSearchParams({ collegeSlug });
	return request<{ hostel: Hostel }>(`/api/hostels?${params.toString()}`, {
		method: "POST",
		body: input,
	});
}

export function updateHostelRecord(
	collegeSlug: string,
	hostelId: string,
	input: UpdateHostelInput,
) {
	const params = new URLSearchParams({ collegeSlug });
	return request<{ hostel: Hostel }>(
		`/api/hostels/${hostelId}?${params.toString()}`,
		{
			method: "PATCH",
			body: input,
		},
	);
}

export function createHostelRoomRecord(
	collegeSlug: string,
	input: CreateHostelRoomInput,
) {
	const params = new URLSearchParams({ collegeSlug });
	return request<{ room: HostelRoom }>(`/api/hostels/rooms?${params.toString()}`, {
		method: "POST",
		body: input,
	});
}

export function updateHostelRoomRecord(
	collegeSlug: string,
	roomId: string,
	input: UpdateHostelRoomInput,
) {
	const params = new URLSearchParams({ collegeSlug });
	return request<{ room: HostelRoom }>(
		`/api/hostels/rooms/${roomId}?${params.toString()}`,
		{
			method: "PATCH",
			body: input,
		},
	);
}

export function updateHostelBedRecord(
	collegeSlug: string,
	bedId: string,
	input: UpdateHostelBedInput,
) {
	const params = new URLSearchParams({ collegeSlug });
	return request<{ bed: HostelBed }>(
		`/api/hostels/beds/${bedId}?${params.toString()}`,
		{
			method: "PATCH",
			body: input,
		},
	);
}

export function reserveHostelBedRecord(
	collegeSlug: string,
	input: ReserveHostelBedInput,
) {
	const params = new URLSearchParams({ collegeSlug });
	return request<{ allocation: HostelAllocation }>(
		`/api/hostels/reserve?${params.toString()}`,
		{
			method: "POST",
			body: input,
		},
	);
}

export function initializeHostelPayment(
	collegeSlug: string,
	input: HostelPaymentInitializeInput,
) {
	const params = new URLSearchParams({ collegeSlug });
	return request<{ payment: HostelPaymentInitialization }>(
		`/api/hostels/payments/initialize?${params.toString()}`,
		{
			method: "POST",
			body: input,
		},
	);
}

export function verifyHostelPayment(
	collegeSlug: string,
	input: Pick<
		VerifyHostelPaymentInput,
		"allocationId" | "reference" | "amount" | "currency"
	>,
) {
	const params = new URLSearchParams({ collegeSlug });
	return request<{ allocation: HostelAllocation }>(
		`/api/hostels/payments/verify?${params.toString()}`,
		{
			method: "POST",
			body: input,
		},
	);
}

export function createHostelComplaintRecord(
	collegeSlug: string,
	input: CreateHostelComplaintInput,
) {
	const params = new URLSearchParams({ collegeSlug });
	return request<{ complaint: HostelComplaint }>(
		`/api/hostels/complaints?${params.toString()}`,
		{
			method: "POST",
			body: input,
		},
	);
}

export function updateHostelComplaintRecord(
	collegeSlug: string,
	complaintId: string,
	input: UpdateHostelComplaintInput,
) {
	const params = new URLSearchParams({ collegeSlug });
	return request<{ complaint: HostelComplaint }>(
		`/api/hostels/complaints/${complaintId}?${params.toString()}`,
		{
			method: "PATCH",
			body: input,
		},
	);
}
