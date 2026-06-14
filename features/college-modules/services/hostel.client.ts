import type {
	CreateHostelComplaintInput,
	CreateHostelInput,
	CreateHostelRoomInput,
	Hostel,
	HostelAllocation,
	HostelComplaint,
	HostelRoom,
	HostelPayload,
	ReserveHostelBedInput,
	UpdateHostelComplaintInput,
} from "@/lib/services/hostel.service";

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
