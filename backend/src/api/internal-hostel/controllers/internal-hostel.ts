type StrapiContext = {
	params?: Record<string, string | undefined>;
	request: {
		body?: unknown;
		header: Record<string, string | undefined>;
		query?: Record<string, string | undefined>;
	};
	unauthorized: (message?: string) => unknown;
	badRequest: (message?: string) => unknown;
	notFound?: (message?: string) => unknown;
	conflict?: (message?: string) => unknown;
	body: unknown;
	status?: number;
};

const DEV_INTERNAL_SECRET =
	"iums-local-registration-secret-change-before-production";
const BED_STATUSES = ["available", "reserved", "allocated", "maintenance", "inactive"] as const;
const COMPLAINT_STATUSES = ["Open", "In Progress", "Resolved", "Escalated"] as const;
const COMPLAINT_PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
const BED_RESERVATION_CONFLICT = "BED_RESERVATION_CONFLICT";

function getInternalSecret() {
	const configured =
		process.env.PORTAL_INTERNAL_API_SECRET ?? process.env.PORTAL_REGISTRATION_SECRET;

	if (configured) return configured;
	if (process.env.NODE_ENV === "production") return null;

	return DEV_INTERNAL_SECRET;
}

function getHeader(ctx: StrapiContext, name: string) {
	const lowerName = name.toLowerCase();
	return ctx.request.header[lowerName] ?? ctx.request.header[name];
}

function authorize(ctx: StrapiContext) {
	const expectedSecret = getInternalSecret();
	const providedSecret = getHeader(ctx, "x-portal-internal-secret");

	return Boolean(expectedSecret && providedSecret === expectedSecret);
}

function asString(value: unknown, fallback = "") {
	return typeof value === "string" ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback = 0) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : fallback;
	}
	return fallback;
}

function asRecord(value: unknown) {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function asArray(value: unknown) {
	return Array.isArray(value) ? value : [];
}

function normalizeCode(value: string) {
	return value
		.trim()
		.toUpperCase()
		.replace(/[^A-Z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function normalizeEnum<T extends string>(
	value: unknown,
	options: readonly T[],
	fallback: T,
) {
	const text = asString(value);
	return options.includes(text as T) ? (text as T) : fallback;
}

function relationId(value: unknown) {
	const record = asRecord(value);
	return typeof record.id === "number" ? record.id : undefined;
}

function getRecordId(record: Record<string, unknown>) {
	return asString(record.documentId) || String(record.id ?? "");
}

function createReservationConflict(message: string) {
	const error = new Error(message);
	error.name = BED_RESERVATION_CONFLICT;
	return error;
}

async function findCollegeBySlug(collegeSlug: string) {
	return strapi.db.query("api::college.college").findOne({
		where: { slug: collegeSlug, status: "active" },
	});
}

async function createAuditLog(input: {
	collegeId?: number;
	entityType: string;
	action: string;
	eventType?: "created" | "updated" | "deleted" | "login" | "exported" | "settings" | "payment";
	entityId?: string;
	summary: string;
	metadata?: Record<string, unknown>;
}) {
	try {
		await strapi.db.query("api::audit-log.audit-log").create({
			data: {
				action: input.action,
				eventType: input.eventType ?? "updated",
				entityType: input.entityType,
				entityId: input.entityId,
				summary: input.summary,
				metadata: input.metadata ?? {},
				occurredAt: new Date().toISOString(),
				...(input.collegeId ? { college: input.collegeId } : {}),
			},
		});
	} catch (error) {
		strapi.log.warn(
			`[internal-hostel] Audit write failed: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		);
	}
}

function mapBed(bed: Record<string, unknown>) {
	return {
		id: getRecordId(bed),
		numericId: bed.id,
		label: asString(bed.label),
		price: asNumber(bed.price),
		currency: asString(bed.currency, "NGN"),
		status: asString(bed.status, "available"),
		reservedUntil: asString(bed.reservedUntil) || undefined,
	};
}

function mapRoom(room: Record<string, unknown>) {
	const beds = asArray(room.beds).map((bed) => mapBed(asRecord(bed)));
	const available = beds.filter((bed) => bed.status === "available").length;

	return {
		id: getRecordId(room),
		numericId: room.id,
		roomNumber: asString(room.roomNumber),
		block: asString(room.block),
		floor: asString(room.floor),
		capacity: asNumber(room.capacity, beds.length),
		status: asString(room.status, "active"),
		wardenNote: asString(room.wardenNote),
		available,
		occupied: beds.filter((bed) => ["reserved", "allocated"].includes(bed.status)).length,
		beds,
		updatedAt: asString(room.updatedAt),
		hostelId: getRecordId(asRecord(room.hostel)),
		hostelName: asString(asRecord(room.hostel).name),
	};
}

function mapHostel(hostel: Record<string, unknown>, rooms?: Record<string, unknown>[]) {
	const mappedRooms = (rooms ?? asArray(hostel.rooms).map(asRecord)).map(mapRoom);
	const totalBeds = mappedRooms.reduce((sum, room) => sum + room.beds.length, 0);
	const availableBeds = mappedRooms.reduce((sum, room) => sum + room.available, 0);

	return {
		id: getRecordId(hostel),
		numericId: hostel.id,
		name: asString(hostel.name),
		code: asString(hostel.code),
		gender: asString(hostel.gender, "Mixed"),
		warden: asString(hostel.warden),
		fee: asNumber(hostel.fee),
		currency: asString(hostel.currency, "NGN"),
		amenities: asArray(hostel.amenities).map((item) => asString(item)).filter(Boolean),
		status: asString(hostel.status, "active"),
		totalBeds,
		availableBeds,
		updatedAt: asString(hostel.updatedAt),
	};
}

function mapAllocation(allocation: Record<string, unknown>) {
	const hostel = asRecord(allocation.hostel);
	const room = asRecord(allocation.room);
	const bed = asRecord(allocation.bed);
	const invoice = asRecord(allocation.invoice);

	return {
		id: getRecordId(allocation),
		numericId: allocation.id,
		allocationNumber: asString(allocation.allocationNumber),
		studentName: asString(allocation.studentName),
		studentEmail: asString(allocation.studentEmail),
		studentIdentifier: asString(allocation.studentIdentifier),
		level: asString(allocation.level),
		status: asString(allocation.status, "reserved"),
		paymentStatus: asString(allocation.paymentStatus, "pending"),
		allocatedBy: asString(allocation.allocatedBy),
		note: asString(allocation.note),
		hostelId: getRecordId(hostel),
		hostelName: asString(hostel.name),
		roomId: getRecordId(room),
		roomNumber: asString(room.roomNumber),
		bedId: getRecordId(bed),
		bedLabel: asString(bed.label),
		invoiceNumber: asString(invoice.invoiceNumber),
		invoiceStatus: asString(invoice.status, "pending"),
		amount: asNumber(invoice.amount, asNumber(bed.price)),
		currency: asString(invoice.currency, "NGN"),
		updatedAt: asString(allocation.updatedAt),
	};
}

function mapComplaint(complaint: Record<string, unknown>) {
	const allocation = asRecord(complaint.allocation);
	const hostel = asRecord(complaint.hostel);
	const room = asRecord(complaint.room);
	const bed = asRecord(complaint.bed);

	return {
		id: getRecordId(complaint),
		numericId: complaint.id,
		category: asString(complaint.category),
		issue: asString(complaint.issue),
		description: asString(complaint.description),
		priority: asString(complaint.priority, "Medium"),
		status: asString(complaint.status, "Open"),
		assignedTo: asString(complaint.assignedTo),
		resolutionNote: asString(complaint.resolutionNote),
		studentName: asString(allocation.studentName),
		studentIdentifier: asString(allocation.studentIdentifier),
		hostelName: asString(hostel.name),
		roomNumber: asString(room.roomNumber),
		bedLabel: asString(bed.label),
		updatedAt: asString(complaint.updatedAt),
		createdAt: asString(complaint.createdAt),
	};
}

async function findHostelForCollege(hostelId: string, collegeId: number) {
	return strapi.db.query("api::hostel.hostel").findOne({
		where: {
			$or: [{ documentId: hostelId }, { id: asNumber(hostelId) }],
			college: collegeId,
			status: { $ne: "archived" },
		},
		populate: { college: true },
	});
}

async function findRoomForCollege(roomId: string, collegeId: number) {
	return strapi.db.query("api::hostel-room.hostel-room").findOne({
		where: {
			$or: [{ documentId: roomId }, { id: asNumber(roomId) }],
			college: collegeId,
			status: { $ne: "archived" },
		},
		populate: { hostel: true, college: true, beds: true },
	});
}

async function findBedForCollege(bedId: string, collegeId: number) {
	return strapi.db.query("api::hostel-bed.hostel-bed").findOne({
		where: {
			$or: [{ documentId: bedId }, { id: asNumber(bedId) }],
			college: collegeId,
		},
		populate: { hostel: true, room: true, college: true },
	});
}

function createInvoiceNumber(reference: string) {
	const suffix = reference.split("-").slice(-1)[0] ?? reference.slice(-6);
	return `INV-HOS-${Date.now()}-${suffix}`;
}

function createAllocationNumber(collegeCode: string) {
	const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
	return `HST-${normalizeCode(collegeCode || "COL")}-${Date.now()}-${randomPart}`;
}

function createLedgerNumber(reference: string, type: string) {
	const suffix = reference.split("-").slice(-1)[0] ?? reference.slice(-6);
	return `LED-${type.toUpperCase()}-${Date.now()}-${suffix}`;
}

function parseHostelPayload(body: unknown) {
	const payload = asRecord(body);
	const name = asString(payload.name);

	return {
		name,
		code: normalizeCode(asString(payload.code) || name),
		gender: normalizeEnum(payload.gender, ["Female", "Male", "Mixed"] as const, "Mixed"),
		warden: asString(payload.warden),
		fee: Math.max(0, asNumber(payload.fee)),
		currency: asString(payload.currency, "NGN").toUpperCase(),
		amenities: asArray(payload.amenities).map((item) => asString(item)).filter(Boolean),
		status: normalizeEnum(payload.status, ["active", "inactive", "maintenance"] as const, "active"),
	};
}

function parseHostelUpdatePayload(body: unknown) {
	const payload = asRecord(body);
	const data: Record<string, unknown> = {};

	if ("name" in payload) data.name = asString(payload.name);
	if ("code" in payload) data.code = normalizeCode(asString(payload.code));
	if ("gender" in payload) {
		data.gender = normalizeEnum(payload.gender, ["Female", "Male", "Mixed"] as const, "Mixed");
	}
	if ("warden" in payload) data.warden = asString(payload.warden);
	if ("fee" in payload) data.fee = Math.max(0, asNumber(payload.fee));
	if ("currency" in payload) data.currency = asString(payload.currency, "NGN").toUpperCase();
	if ("amenities" in payload) {
		data.amenities = asArray(payload.amenities).map((item) => asString(item)).filter(Boolean);
	}
	if ("status" in payload) {
		data.status = normalizeEnum(payload.status, ["active", "inactive", "maintenance"] as const, "active");
	}

	return data;
}

function parseRoomPayload(body: unknown) {
	const payload = asRecord(body);

	return {
		hostelId: asString(payload.hostelId),
		roomNumber: asString(payload.roomNumber).toUpperCase(),
		block: asString(payload.block),
		floor: asString(payload.floor),
		capacity: Math.max(0, asNumber(payload.capacity)),
		price: Math.max(0, asNumber(payload.price)),
		status: normalizeEnum(payload.status, ["active", "inactive", "maintenance"] as const, "active"),
		wardenNote: asString(payload.wardenNote),
	};
}

function parseRoomUpdatePayload(body: unknown) {
	const payload = asRecord(body);
	const data: Record<string, unknown> = {};

	if ("roomNumber" in payload) data.roomNumber = asString(payload.roomNumber).toUpperCase();
	if ("block" in payload) data.block = asString(payload.block);
	if ("floor" in payload) data.floor = asString(payload.floor);
	if ("capacity" in payload) data.capacity = Math.max(1, asNumber(payload.capacity, 1));
	if ("status" in payload) {
		data.status = normalizeEnum(payload.status, ["active", "inactive", "maintenance"] as const, "active");
	}
	if ("wardenNote" in payload) data.wardenNote = asString(payload.wardenNote);

	return data;
}

function parseReservePayload(body: unknown) {
	const payload = asRecord(body);

	return {
		bedId: asString(payload.bedId),
		studentId: asString(payload.studentId),
		studentName: asString(payload.studentName, "Current Student"),
		studentEmail: asString(payload.studentEmail),
		studentIdentifier: asString(
			payload.studentIdentifier,
			asString(payload.studentEmail),
		),
		level: asString(payload.level),
	};
}

function parsePaymentInitializePayload(body: unknown) {
	const payload = asRecord(body);

	return {
		allocationId: asString(payload.allocationId),
		reference: asString(payload.reference),
		accessCode: asString(payload.accessCode),
		channel: asString(payload.channel, "card"),
	};
}

function parsePaymentVerifyPayload(body: unknown) {
	const payload = asRecord(body);

	return {
		allocationId: asString(payload.allocationId),
		reference: asString(payload.reference),
		amount: Math.max(0, asNumber(payload.amount)),
		currency: asString(payload.currency, "NGN"),
		channel: asString(payload.channel),
		paidAt: asString(payload.paidAt),
		verifiedAt: asString(payload.verifiedAt, new Date().toISOString()),
		rawGatewayResponse: payload.rawGatewayResponse,
	};
}

function parseComplaintPayload(body: unknown) {
	const payload = asRecord(body);

	return {
		allocationId: asString(payload.allocationId),
		category: asString(payload.category),
		issue: asString(payload.issue),
		description: asString(payload.description),
		priority: normalizeEnum(payload.priority, COMPLAINT_PRIORITIES, "Medium"),
	};
}

function parseComplaintUpdatePayload(body: unknown) {
	const payload = asRecord(body);

	return {
		status: normalizeEnum(payload.status, COMPLAINT_STATUSES, "Open"),
		priority: normalizeEnum(payload.priority, COMPLAINT_PRIORITIES, "Medium"),
		assignedTo: asString(payload.assignedTo),
		resolutionNote: asString(payload.resolutionNote),
	};
}

async function listPayload(college: Record<string, unknown>, studentIdentifier?: string) {
	const collegeId = asNumber(college.id);
	const [hostels, rooms, allocations, complaints] = await Promise.all([
		strapi.db.query("api::hostel.hostel").findMany({
			where: { college: collegeId, status: { $ne: "archived" } },
			orderBy: [{ name: "asc" }],
			limit: 500,
		}),
		strapi.db.query("api::hostel-room.hostel-room").findMany({
			where: { college: collegeId, status: { $ne: "archived" } },
			populate: { hostel: true, beds: true },
			orderBy: [{ roomNumber: "asc" }],
			limit: 1000,
		}),
		strapi.db.query("api::hostel-allocation.hostel-allocation").findMany({
			where: {
				college: collegeId,
				status: { $ne: "cancelled" },
				...(studentIdentifier ? { studentIdentifier } : {}),
			},
			populate: { hostel: true, room: true, bed: true, invoice: true },
			orderBy: [{ updatedAt: "desc" }],
			limit: studentIdentifier ? 20 : 1000,
		}),
		strapi.db.query("api::hostel-complaint.hostel-complaint").findMany({
			where: {
				college: collegeId,
				...(studentIdentifier
					? { allocation: { studentIdentifier } }
					: {}),
			},
			populate: { allocation: true, hostel: true, room: true, bed: true },
			orderBy: [{ updatedAt: "desc" }],
			limit: studentIdentifier ? 50 : 1000,
		}),
	]);
	const roomsByHostel = new Map<string, Record<string, unknown>[]>();

	for (const room of rooms as Record<string, unknown>[]) {
		const hostelId = String(relationId(room.hostel) ?? "");
		roomsByHostel.set(hostelId, [...(roomsByHostel.get(hostelId) ?? []), room]);
	}

	return {
		college: {
			id: college.id,
			name: college.name,
			slug: college.slug,
			code: college.code,
		},
		hostels: (hostels as Record<string, unknown>[]).map((hostel) =>
			mapHostel(hostel, roomsByHostel.get(String(hostel.id)) ?? []),
		),
		rooms: (rooms as Record<string, unknown>[]).map(mapRoom),
		allocations: (allocations as Record<string, unknown>[]).map(mapAllocation),
		complaints: (complaints as Record<string, unknown>[]).map(mapComplaint),
		generatedAt: new Date().toISOString(),
	};
}

export default {
	async list(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Hostel access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const college = await findCollegeBySlug(collegeSlug);

		if (!college?.id) {
			return ctx.notFound?.("College could not be found.") ?? ctx.badRequest("College could not be found.");
		}

		ctx.body = await listPayload(
			college as Record<string, unknown>,
			asString(ctx.request.query?.studentIdentifier),
		);
	},

	async createHostel(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Hostel access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const college = await findCollegeBySlug(collegeSlug);
		const payload = parseHostelPayload(ctx.request.body);

		if (!college?.id || !payload.name || !payload.code) {
			return ctx.badRequest("College, hostel name, and code are required.");
		}

		const duplicate = await strapi.db.query("api::hostel.hostel").findOne({
			where: { college: college.id, code: payload.code, status: { $ne: "archived" } },
		});

		if (duplicate?.id) {
			ctx.body = { hostel: mapHostel(duplicate as Record<string, unknown>, []) };
			return;
		}

		let hostel;

		try {
			hostel = await strapi.db.query("api::hostel.hostel").create({
				data: { ...payload, college: college.id },
			});
		} catch (error) {
			const existing = await strapi.db.query("api::hostel.hostel").findOne({
				where: { college: college.id, code: payload.code, status: { $ne: "archived" } },
			});

			if (existing?.id) {
				ctx.body = { hostel: mapHostel(existing as Record<string, unknown>, []) };
				return;
			}

			throw error;
		}

		await createAuditLog({
			collegeId: college.id,
			entityType: "hostel",
			action: "hostel.created",
			eventType: "created",
			entityId: String(hostel.id),
			summary: `Created hostel ${payload.name}`,
			metadata: { collegeSlug, code: payload.code },
		});

		ctx.status = 201;
		ctx.body = { hostel: mapHostel(hostel as Record<string, unknown>, []) };
	},

	async updateHostel(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Hostel access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const hostelId = asString(ctx.params?.id);
		const college = await findCollegeBySlug(collegeSlug);
		const payload = parseHostelUpdatePayload(ctx.request.body);

		if (!college?.id || !hostelId) {
			return ctx.badRequest("College slug and hostel id are required.");
		}

		const existing = await findHostelForCollege(hostelId, college.id);

		if (!existing?.id) {
			return ctx.notFound?.("Hostel could not be found for this college.") ??
				ctx.badRequest("Hostel could not be found for this college.");
		}

		const hostel = await strapi.db.query("api::hostel.hostel").update({
			where: { id: existing.id },
			data: payload,
		});

		await createAuditLog({
			collegeId: college.id,
			entityType: "hostel",
			action: "hostel.updated",
			eventType: "updated",
			entityId: String(existing.id),
			summary: `Updated hostel ${asString(hostel.name, asString(existing.name))}`,
			metadata: { collegeSlug, hostelId },
		});

		const rooms = await strapi.db.query("api::hostel-room.hostel-room").findMany({
			where: { college: college.id, hostel: existing.id, status: { $ne: "archived" } },
			populate: { hostel: true, beds: true },
			limit: 500,
		});

		ctx.body = { hostel: mapHostel(hostel as Record<string, unknown>, rooms as Record<string, unknown>[]) };
	},

	async createRoom(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Hostel access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const college = await findCollegeBySlug(collegeSlug);
		const payload = parseRoomPayload(ctx.request.body);

		if (!college?.id || !payload.hostelId || !payload.roomNumber || payload.capacity < 1) {
			return ctx.badRequest("College, hostel, room number, and capacity are required.");
		}

		const hostel = await findHostelForCollege(payload.hostelId, college.id);

		if (!hostel?.id) {
			return ctx.notFound?.("Hostel could not be found for this college.") ??
				ctx.badRequest("Hostel could not be found for this college.");
		}

		const duplicate = await strapi.db.query("api::hostel-room.hostel-room").findOne({
			where: {
				college: college.id,
				hostel: hostel.id,
				roomNumber: payload.roomNumber,
				status: { $ne: "archived" },
			},
		});

		if (duplicate?.id) {
			const existingRoom = await findRoomForCollege(String(duplicate.id), college.id);
			ctx.body = { room: mapRoom(existingRoom as Record<string, unknown>) };
			return;
		}

		let room;
		const bedPrice = payload.price || asNumber(hostel.fee);

		try {
			room = await strapi.db.query("api::hostel-room.hostel-room").create({
				data: {
					roomNumber: payload.roomNumber,
					block: payload.block,
					floor: payload.floor,
					capacity: payload.capacity,
					status: payload.status,
					wardenNote: payload.wardenNote,
					college: college.id,
					hostel: hostel.id,
				},
			});

			for (let index = 1; index <= payload.capacity; index += 1) {
				await strapi.db.query("api::hostel-bed.hostel-bed").create({
					data: {
						label: `Bed ${index}`,
						price: bedPrice,
						currency: asString(hostel.currency, "NGN"),
						status: payload.status === "maintenance" ? "maintenance" : "available",
						college: college.id,
						hostel: hostel.id,
						room: room.id,
					},
				});
			}
		} catch (error) {
			const existing = await strapi.db.query("api::hostel-room.hostel-room").findOne({
				where: {
					college: college.id,
					hostel: hostel.id,
					roomNumber: payload.roomNumber,
					status: { $ne: "archived" },
				},
			});

			if (existing?.id) {
				const existingRoom = await findRoomForCollege(String(existing.id), college.id);
				ctx.body = { room: mapRoom(existingRoom as Record<string, unknown>) };
				return;
			}

			throw error;
		}

		const savedRoom = await findRoomForCollege(String(room.id), college.id);

		await createAuditLog({
			collegeId: college.id,
			entityType: "hostel-room",
			action: "hostel-room.created",
			eventType: "created",
			entityId: String(room.id),
			summary: `Created room ${payload.roomNumber}`,
			metadata: { collegeSlug, hostelId: payload.hostelId, beds: payload.capacity },
		});

		ctx.status = 201;
		ctx.body = { room: mapRoom(savedRoom as Record<string, unknown>) };
	},

	async updateRoom(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Hostel access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const roomId = asString(ctx.params?.id);
		const college = await findCollegeBySlug(collegeSlug);
		const payload = parseRoomUpdatePayload(ctx.request.body);

		if (!college?.id || !roomId) {
			return ctx.badRequest("College slug and room id are required.");
		}

		const existing = await findRoomForCollege(roomId, college.id);

		if (!existing?.id) {
			return ctx.notFound?.("Room could not be found for this college.") ??
				ctx.badRequest("Room could not be found for this college.");
		}

		const previousBeds = asArray(existing.beds).map(asRecord);
		const room = await strapi.db.query("api::hostel-room.hostel-room").update({
			where: { id: existing.id },
			data: payload,
		});

		const nextCapacity = asNumber(payload.capacity, asNumber(existing.capacity, previousBeds.length));
		const hostel = asRecord(existing.hostel);
		const bedPrice = asNumber(hostel.fee);

		for (let index = previousBeds.length + 1; index <= nextCapacity; index += 1) {
			await strapi.db.query("api::hostel-bed.hostel-bed").create({
				data: {
					label: `Bed ${index}`,
					price: bedPrice,
					currency: asString(hostel.currency, "NGN"),
					status: payload.status === "maintenance" ? "maintenance" : "available",
					college: college.id,
					hostel: relationId(existing.hostel),
					room: existing.id,
				},
			});
		}

		if (payload.status === "maintenance") {
			await strapi.db.query("api::hostel-bed.hostel-bed").updateMany({
				where: {
					college: college.id,
					room: existing.id,
					status: { $in: ["available", "reserved"] },
				},
				data: { status: "maintenance" },
			});
		}

		await createAuditLog({
			collegeId: college.id,
			entityType: "hostel-room",
			action: "hostel-room.updated",
			eventType: "updated",
			entityId: String(existing.id),
			summary: `Updated room ${asString(room.roomNumber, asString(existing.roomNumber))}`,
			metadata: { collegeSlug, roomId },
		});

		const savedRoom = await findRoomForCollege(String(existing.id), college.id);
		ctx.body = { room: mapRoom(savedRoom as Record<string, unknown>) };
	},

	async updateBed(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Hostel access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const bedId = asString(ctx.params?.id);
		const college = await findCollegeBySlug(collegeSlug);
		const payload = asRecord(ctx.request.body);

		if (!college?.id || !bedId) {
			return ctx.badRequest("College slug and bed id are required.");
		}

		const existing = await findBedForCollege(bedId, college.id);

		if (!existing?.id) {
			return ctx.notFound?.("Bed could not be found for this college.") ??
				ctx.badRequest("Bed could not be found for this college.");
		}

		const status = normalizeEnum(payload.status, BED_STATUSES, "available");
		const bed = await strapi.db.query("api::hostel-bed.hostel-bed").update({
			where: { id: existing.id },
			data: {
				status,
				price: Math.max(0, asNumber(payload.price, asNumber(existing.price))),
			},
		});

		await createAuditLog({
			collegeId: college.id,
			entityType: "hostel-bed",
			action: "hostel-bed.updated",
			eventType: "updated",
			entityId: String(existing.id),
			summary: `Updated bed ${asString(existing.label)}`,
			metadata: { collegeSlug, status },
		});

		ctx.body = { bed: mapBed(bed as Record<string, unknown>) };
	},

	async reserve(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Hostel access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const college = await findCollegeBySlug(collegeSlug);
		const payload = parseReservePayload(ctx.request.body);

		if (!college?.id || !payload.bedId || !payload.studentIdentifier) {
			return ctx.badRequest("College, bed, and student details are required.");
		}

		const existingAllocation = await strapi.db.query("api::hostel-allocation.hostel-allocation").findOne({
			where: {
				college: college.id,
				studentIdentifier: payload.studentIdentifier,
				status: { $in: ["reserved", "allocated"] },
			},
			populate: { hostel: true, room: true, bed: true, invoice: true },
		});

		if (existingAllocation?.id) {
			ctx.body = { allocation: mapAllocation(existingAllocation as Record<string, unknown>) };
			return;
		}

		const bed = await findBedForCollege(payload.bedId, college.id);

		if (!bed?.id) {
			return ctx.notFound?.("Bed could not be found for this college.") ??
				ctx.badRequest("Bed could not be found for this college.");
		}

		if (asString(bed.status) !== "available") {
			return ctx.conflict?.("This bed is no longer available.") ??
				ctx.badRequest("This bed is no longer available.");
		}

		const hostel = asRecord(bed.hostel);
		const room = asRecord(bed.room);
		const allocationNumber = createAllocationNumber(asString(college.code));
		const invoiceNumber = createInvoiceNumber(allocationNumber);
		const reservedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
		let allocation: Record<string, unknown> | null = null;
		let invoice: Record<string, unknown> | null = null;

		await strapi.db.transaction(async ({ trx }) => {
			const reservedBeds = await strapi.db.connection("hostel_beds")
				.transacting(trx)
				.where({ id: bed.id, status: "available" })
				.update({
					status: "reserved",
					reserved_until: reservedUntil,
					updated_at: new Date(),
				});

			if (reservedBeds !== 1) {
				throw createReservationConflict("This bed is no longer available.");
			}

			invoice = await strapi.db.query("api::payment-invoice.payment-invoice").create({
				data: {
					invoiceNumber,
					module: "hostel",
					description: `${asString(hostel.name)} ${asString(room.roomNumber)} ${asString(bed.label)} hostel fee`,
					amount: asNumber(bed.price, asNumber(hostel.fee)),
					currency: asString(bed.currency, "NGN"),
					status: "pending",
					payerName: payload.studentName,
					payerEmail: payload.studentEmail,
					payerIdentifier: payload.studentIdentifier,
					metadata: {
						collegeSlug,
						allocationNumber,
						bedId: bed.id,
						reservationStrategy:
							"Atomic conditional update flips one available bed to reserved before creating allocation.",
					},
					college: college.id,
					...(payload.studentId ? { payer: payload.studentId } : {}),
				},
			});

			allocation = await strapi.db.query("api::hostel-allocation.hostel-allocation").create({
				data: {
					allocationNumber,
					studentName: payload.studentName,
					studentEmail: payload.studentEmail,
					studentIdentifier: payload.studentIdentifier,
					level: payload.level,
					status: "reserved",
					paymentStatus: "pending",
					allocatedBy: "Student self-service",
					note: "Bed reserved pending hostel fee payment.",
					college: college.id,
					...(payload.studentId ? { student: payload.studentId } : {}),
					hostel: relationId(bed.hostel),
					room: relationId(bed.room),
					bed: bed.id,
					invoice: invoice.id,
				},
			});
		});

		const savedAllocation = await strapi.db.query("api::hostel-allocation.hostel-allocation").findOne({
			where: { id: allocation?.id },
			populate: { hostel: true, room: true, bed: true, invoice: true },
		});

		await createAuditLog({
			collegeId: college.id,
			entityType: "hostel-allocation",
			action: "hostel-bed.reserved",
			eventType: "created",
			entityId: String(allocation?.id ?? ""),
			summary: `Reserved hostel bed for ${payload.studentIdentifier}`,
			metadata: {
				collegeSlug,
				hostelId: relationId(bed.hostel),
				hostelName: asString(hostel.name),
				roomId: relationId(bed.room),
				roomNumber: asString(room.roomNumber),
				bedId: payload.bedId,
				bedLabel: asString(bed.label),
				studentIdentifier: payload.studentIdentifier,
				allocationNumber,
				invoiceNumber,
			},
		});

		await createAuditLog({
			collegeId: college.id,
			entityType: "payment-invoice",
			action: "hostel-invoice.created",
			eventType: "payment",
			entityId: String(invoice?.id ?? ""),
			summary: `Raised hostel invoice ${invoiceNumber} for ${payload.studentIdentifier}`,
			metadata: {
				collegeSlug,
				module: "hostel",
				allocationId: allocation?.id,
				allocationNumber,
				hostelId: relationId(bed.hostel),
				roomId: relationId(bed.room),
				bedId: payload.bedId,
				invoiceNumber,
				amount: asNumber(invoice?.amount),
				currency: asString(invoice?.currency, "NGN"),
			},
		});

		ctx.status = 201;
		ctx.body = { allocation: mapAllocation(savedAllocation as Record<string, unknown>) };
	},

	async initializePayment(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Hostel access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const college = await findCollegeBySlug(collegeSlug);
		const payload = parsePaymentInitializePayload(ctx.request.body);

		if (!college?.id || !payload.allocationId || !payload.reference || !payload.accessCode) {
			return ctx.badRequest("College, allocation, reference, and access code are required.");
		}

		const allocation = await strapi.db.query("api::hostel-allocation.hostel-allocation").findOne({
			where: {
				$or: [{ documentId: payload.allocationId }, { id: asNumber(payload.allocationId) }],
				college: college.id,
			},
			populate: { invoice: true, student: true },
		});

		if (!allocation?.id) {
			return ctx.notFound?.("Hostel allocation could not be found.") ??
				ctx.badRequest("Hostel allocation could not be found.");
		}

		const invoice = asRecord(allocation.invoice);
		const existing = await strapi.db.query("api::payment-transaction.payment-transaction").findOne({
			where: { reference: payload.reference },
		});

		if (!existing?.id) {
			await strapi.db.query("api::payment-transaction.payment-transaction").create({
				data: {
					reference: payload.reference,
					gateway: "paystack",
					accessCode: payload.accessCode,
					channel: payload.channel,
					amount: asNumber(invoice.amount),
					currency: asString(invoice.currency, "NGN"),
					status: "initialized",
					gatewayStatus: "initialized",
					gatewayMessage: "Paystack hostel checkout initialized",
					metadata: {
						collegeSlug,
						allocationNumber: asString(allocation.allocationNumber),
						invoiceNumber: asString(invoice.invoiceNumber),
					},
					college: college.id,
					invoice: relationId(allocation.invoice),
					payer: relationId(allocation.student),
				},
			});
		}

		await createAuditLog({
			collegeId: college.id,
			entityType: "hostel-payment",
			action: "hostel-payment.initialized",
			eventType: "payment",
			entityId: String(allocation.id),
			summary: `Initialized hostel payment ${payload.reference}`,
			metadata: { collegeSlug, allocationId: payload.allocationId },
		});

		ctx.body = { ok: true };
	},

	async verifyPayment(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Hostel access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const college = await findCollegeBySlug(collegeSlug);
		const payload = parsePaymentVerifyPayload(ctx.request.body);

		if (!college?.id || !payload.allocationId || !payload.reference || !payload.amount) {
			return ctx.badRequest("College, allocation, reference, and amount are required.");
		}

		const allocation = await strapi.db.query("api::hostel-allocation.hostel-allocation").findOne({
			where: {
				$or: [{ documentId: payload.allocationId }, { id: asNumber(payload.allocationId) }],
				college: college.id,
			},
			populate: { hostel: true, room: true, bed: true, invoice: true, student: true },
		});

		if (!allocation?.id) {
			return ctx.notFound?.("Hostel allocation could not be found.") ??
				ctx.badRequest("Hostel allocation could not be found.");
		}

		const invoice = asRecord(allocation.invoice);
		const expectedAmount = Math.round(asNumber(invoice.amount) * 100);

		if (expectedAmount !== payload.amount) {
			return ctx.badRequest("Verified amount does not match the hostel invoice.");
		}

		if (asString(allocation.paymentStatus) === "paid" && asString(invoice.status) === "paid") {
			ctx.body = { allocation: mapAllocation(allocation as Record<string, unknown>) };
			return;
		}

		let transaction = await strapi.db.query("api::payment-transaction.payment-transaction").findOne({
			where: { reference: payload.reference },
		});

		await strapi.db.transaction(async () => {
			if (transaction?.id) {
				transaction = await strapi.db.query("api::payment-transaction.payment-transaction").update({
					where: { id: transaction.id },
					data: {
						status: "success",
						gatewayStatus: "success",
						gatewayMessage: "Paystack hostel transaction verified",
						channel: payload.channel,
						paidAt: payload.paidAt,
						verifiedAt: payload.verifiedAt,
						rawGatewayResponse: payload.rawGatewayResponse,
					},
				});
			} else {
				transaction = await strapi.db.query("api::payment-transaction.payment-transaction").create({
					data: {
						reference: payload.reference,
						gateway: "paystack",
						channel: payload.channel,
						amount: payload.amount / 100,
						currency: payload.currency,
						status: "success",
						gatewayStatus: "success",
						gatewayMessage: "Paystack hostel transaction verified",
						paidAt: payload.paidAt,
						verifiedAt: payload.verifiedAt,
						rawGatewayResponse: payload.rawGatewayResponse,
						metadata: {
							collegeSlug,
							allocationNumber: asString(allocation.allocationNumber),
							invoiceNumber: asString(invoice.invoiceNumber),
						},
						college: college.id,
						invoice: relationId(allocation.invoice),
						payer: relationId(allocation.student),
					},
				});
			}

			await strapi.db.query("api::payment-invoice.payment-invoice").update({
				where: { id: relationId(allocation.invoice) },
				data: {
					status: "paid",
					paidAt: payload.paidAt || payload.verifiedAt,
				},
			});

			await strapi.db.query("api::hostel-allocation.hostel-allocation").update({
				where: { id: allocation.id },
				data: {
					status: "allocated",
					paymentStatus: "paid",
					note: "Hostel payment verified through Paystack.",
				},
			});

			await strapi.db.query("api::hostel-bed.hostel-bed").update({
				where: { id: relationId(allocation.bed) },
				data: {
					status: "allocated",
					reservedUntil: null,
				},
			});

			await strapi.db.query("api::payment-ledger-entry.payment-ledger-entry").create({
				data: {
					entryNumber: createLedgerNumber(payload.reference, "payment"),
					entryType: "payment",
					direction: "credit",
					amount: payload.amount / 100,
					currency: payload.currency,
					module: "hostel",
					description: "Hostel payment verified",
					reference: payload.reference,
					postedAt: payload.verifiedAt,
					metadata: {
						collegeSlug,
						channel: payload.channel,
						paidAt: payload.paidAt,
					},
					college: college.id,
					invoice: relationId(allocation.invoice),
					transaction: transaction?.id,
					payer: relationId(allocation.student),
				},
			});
		});

		const savedAllocation = await strapi.db.query("api::hostel-allocation.hostel-allocation").findOne({
			where: { id: allocation.id },
			populate: { hostel: true, room: true, bed: true, invoice: true },
		});

		await createAuditLog({
			collegeId: college.id,
			entityType: "hostel-payment",
			action: "hostel-payment.verified",
			eventType: "payment",
			entityId: String(allocation.id),
			summary: `Verified hostel payment ${payload.reference}`,
			metadata: { collegeSlug, invoiceNumber: asString(invoice.invoiceNumber) },
		});

		ctx.body = { allocation: mapAllocation(savedAllocation as Record<string, unknown>) };
	},

	async createComplaint(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Hostel access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const college = await findCollegeBySlug(collegeSlug);
		const payload = parseComplaintPayload(ctx.request.body);

		if (!college?.id || !payload.allocationId || !payload.category || !payload.issue) {
			return ctx.badRequest("Allocation, category, and issue are required.");
		}

		const allocation = await strapi.db.query("api::hostel-allocation.hostel-allocation").findOne({
			where: {
				$or: [{ documentId: payload.allocationId }, { id: asNumber(payload.allocationId) }],
				college: college.id,
				status: { $in: ["reserved", "allocated"] },
			},
			populate: { hostel: true, room: true, bed: true, student: true },
		});

		if (!allocation?.id) {
			return ctx.notFound?.("Hostel allocation could not be found.") ??
				ctx.badRequest("Hostel allocation could not be found.");
		}

		const complaint = await strapi.db.query("api::hostel-complaint.hostel-complaint").create({
			data: {
				category: payload.category,
				issue: payload.issue,
				description: payload.description,
				priority: payload.priority,
				status: "Open",
				assignedTo: "Maintenance Desk",
				college: college.id,
				student: relationId(allocation.student),
				allocation: allocation.id,
				hostel: relationId(allocation.hostel),
				room: relationId(allocation.room),
				bed: relationId(allocation.bed),
			},
			populate: { allocation: true, hostel: true, room: true, bed: true },
		});

		await createAuditLog({
			collegeId: college.id,
			entityType: "hostel-complaint",
			action: "hostel-complaint.created",
			eventType: "created",
			entityId: String(complaint.id),
			summary: `Created hostel complaint ${payload.issue}`,
			metadata: { collegeSlug, allocationId: payload.allocationId },
		});

		ctx.status = 201;
		ctx.body = { complaint: mapComplaint(complaint as Record<string, unknown>) };
	},

	async updateComplaint(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Hostel access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const complaintId = asString(ctx.params?.id);
		const college = await findCollegeBySlug(collegeSlug);
		const payload = parseComplaintUpdatePayload(ctx.request.body);

		if (!college?.id || !complaintId) {
			return ctx.badRequest("College slug and complaint id are required.");
		}

		const existing = await strapi.db.query("api::hostel-complaint.hostel-complaint").findOne({
			where: {
				$or: [{ documentId: complaintId }, { id: asNumber(complaintId) }],
				college: college.id,
			},
		});

		if (!existing?.id) {
			return ctx.notFound?.("Complaint could not be found for this college.") ??
				ctx.badRequest("Complaint could not be found for this college.");
		}

		const complaint = await strapi.db.query("api::hostel-complaint.hostel-complaint").update({
			where: { id: existing.id },
			data: {
				status: payload.status,
				priority: payload.priority,
				assignedTo: payload.assignedTo || "Maintenance Desk",
				resolutionNote: payload.resolutionNote,
			},
			populate: { allocation: true, hostel: true, room: true, bed: true },
		});

		await createAuditLog({
			collegeId: college.id,
			entityType: "hostel-complaint",
			action: "hostel-complaint.updated",
			eventType: "updated",
			entityId: String(existing.id),
			summary: `Updated hostel complaint ${complaintId}`,
			metadata: { collegeSlug, status: payload.status },
		});

		ctx.body = { complaint: mapComplaint(complaint as Record<string, unknown>) };
	},
};
