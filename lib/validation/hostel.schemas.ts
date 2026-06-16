import { z } from "zod";

const MONEY_PATTERN = /^\d+(?:\.\d{1,2})?$/;

function parseMoney(value: unknown) {
	if (typeof value === "number") return value;
	if (typeof value !== "string") return value;

	const normalized = value.replace(/[,\s]/g, "").replace(/^NGN/i, "");
	return MONEY_PATTERN.test(normalized) ? Number(normalized) : Number.NaN;
}

const money = (field: string) =>
	z.preprocess(
		parseMoney,
		z
			.number({ error: `${field} must be a valid amount.` })
			.finite(`${field} must be a valid amount.`)
			.positive(`${field} must be greater than zero.`)
			.max(100_000_000, `${field} is too large.`),
	);

const wholeNumber = (field: string) =>
	z.coerce
		.number({ error: `${field} must be a whole number.` })
		.int(`${field} must be a whole number.`)
		.min(1, `${field} must be at least 1.`)
		.max(500, `${field} cannot exceed 500.`);

export const hostelStatusSchema = z.enum(["active", "inactive", "maintenance"]);
export const hostelGenderSchema = z.enum(["Female", "Male", "Mixed"]);
export const hostelRoomStatusSchema = z.enum(["active", "inactive", "maintenance"]);
export const hostelBedStatusSchema = z.enum([
	"available",
	"reserved",
	"allocated",
	"maintenance",
	"inactive",
]);

export const createHostelSchema = z.object({
	name: z.string().trim().min(2, "Hostel name must be at least 2 characters.").max(120),
	code: z.string().trim().min(2, "Hostel code is required.").max(40).optional(),
	gender: hostelGenderSchema,
	warden: z.string().trim().max(120).optional(),
	fee: money("Hostel fee"),
	currency: z.string().trim().length(3, "Currency must be a 3-letter code.").default("NGN"),
	amenities: z.array(z.string().trim().min(1)).max(50).optional(),
	status: hostelStatusSchema.default("active"),
});

export const updateHostelSchema = createHostelSchema.partial().refine(
	(value) => Object.keys(value).length > 0,
	"At least one hostel field is required.",
);

export const createHostelRoomSchema = z.object({
	hostelId: z.string().trim().min(1, "Hostel is required."),
	roomNumber: z.string().trim().min(1, "Room number is required.").max(40),
	block: z.string().trim().max(80).optional(),
	floor: z.string().trim().max(80).optional(),
	capacity: wholeNumber("Total beds"),
	price: money("Bed price"),
	status: hostelRoomStatusSchema.default("active"),
	wardenNote: z.string().trim().max(1000).optional(),
});

export const updateHostelRoomSchema = createHostelRoomSchema
	.omit({ hostelId: true, price: true })
	.partial()
	.refine((value) => Object.keys(value).length > 0, "At least one room field is required.");

export const updateHostelBedSchema = z.object({
	status: hostelBedStatusSchema.optional(),
	price: money("Bed price").optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one bed field is required.");

export type CreateHostelSchemaInput = z.infer<typeof createHostelSchema>;
export type UpdateHostelSchemaInput = z.infer<typeof updateHostelSchema>;
export type CreateHostelRoomSchemaInput = z.infer<typeof createHostelRoomSchema>;
export type UpdateHostelRoomSchemaInput = z.infer<typeof updateHostelRoomSchema>;
export type UpdateHostelBedSchemaInput = z.infer<typeof updateHostelBedSchema>;
