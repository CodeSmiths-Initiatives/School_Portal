import { z } from "zod";

const requiredText = (label: string) =>
	z.string().trim().min(1, `${label} is required`);

const phoneSchema = z
	.string()
	.trim()
	.regex(/^[+\d][\d\s-]{7,19}$/, "Enter a valid phone number");

const scoreStringSchema = (label: string, max: number) =>
	z
		.string()
		.trim()
		.min(1, `${label} is required`)
		.refine((value) => /^\d+$/.test(value), `${label} must be a number`)
		.refine((value) => Number(value) <= max, `${label} cannot exceed ${max}`);

export const programmeSelectionSchema = z.object({
	programmeType: z.enum(["undergraduate", "topup", "distance"], {
		error: "Select a programme type",
	}),
	facultyId: requiredText("Faculty"),
	entrySession: requiredText("Entry session"),
});

export const admissionApplicationRequestSchema = z.object({
	collegeSlug: requiredText("College"),
	account: z.object({
		username: requiredText("Username"),
		email: z.email("Enter a valid applicant email address"),
	}),
	programme: programmeSelectionSchema,
});

export const admissionApplicationDraftRequestSchema = z.object({
	collegeSlug: requiredText("College"),
	account: z.object({
		username: requiredText("Username"),
		email: z.email("Enter a valid applicant email address"),
	}),
});

export const admissionApplicationStepSchema = z.enum([
	"account",
	"programme",
	"payment",
	"biodata",
	"contact",
	"olevel",
	"programme_details",
	"declaration",
	"submitted",
]);

export const admissionApplicationUpdateRequestSchema = z.object({
	collegeSlug: requiredText("College"),
	currentStep: admissionApplicationStepSchema.optional(),
	completedStep: admissionApplicationStepSchema.optional(),
	account: z
		.object({
			username: requiredText("Username").optional(),
			email: z.email("Enter a valid applicant email address").optional(),
		})
		.optional(),
	programme: programmeSelectionSchema.optional(),
	formData: z.record(z.string(), z.unknown()).optional(),
	status: z
		.enum([
			"draft",
			"payment_pending",
			"submitted",
			"under_review",
			"approved",
			"rejected",
			"cancelled",
		])
		.optional(),
	paymentStatus: z
		.enum(["not_started", "pending", "paid", "failed", "cancelled", "refunded"])
		.optional(),
});

export const admissionApplicationListQuerySchema = z.object({
	collegeSlug: requiredText("College"),
	email: z.email("Enter a valid applicant email address").optional(),
	status: z.string().trim().optional(),
	paymentStatus: z.string().trim().optional(),
	currentStep: admissionApplicationStepSchema.optional(),
	from: z.string().trim().optional(),
	to: z.string().trim().optional(),
	search: z.string().trim().optional(),
	limit: z.coerce.number().int().min(1).max(500).optional().default(100),
});

export const oLevelSubjectSchema = z.object({
	subject: z.string().trim(),
	grade: z.string().trim(),
	compulsory: z.boolean().optional(),
});

export const biodataSchema = z
	.object({
		passportPhoto: z.unknown().nullable(),
		surname: requiredText("Surname"),
		firstName: requiredText("First name"),
		otherName: z.string().trim().optional().default(""),
		dateOfBirth: requiredText("Date of birth"),
		gender: requiredText("Gender"),
		maritalStatus: requiredText("Marital status"),
		religion: z.string().trim().optional().default(""),
		nationality: requiredText("Nationality"),
		stateOfOrigin: requiredText("State of origin"),
		lga: requiredText("LGA"),
		nin: z.string().trim().regex(/^\d{11}$/, "NIN must be exactly 11 digits"),

		phone: phoneSchema,
		altPhone: z.string().trim().optional().default(""),
		email: z.string().trim().email("Enter a valid email address"),
		confirmEmail: z.string().trim().email("Confirm with a valid email address"),
		address: requiredText("Address"),
		city: z.string().trim().optional().default(""),
		state: z.string().trim().optional().default(""),
		postalCode: z.string().trim().optional().default(""),
		guardianName: requiredText("Next of kin name"),
		guardianRelationship: requiredText("Next of kin relationship"),
		guardianPhone: phoneSchema,
		guardianEmail: z.string().trim().email("Enter a valid email").or(z.literal("")),
		guardianAddress: z.string().trim().optional().default(""),
		bloodGroup: z.string().trim().optional().default(""),
		genotype: z.string().trim().optional().default(""),
		disability: z.string().trim().optional().default(""),

		examType: requiredText("Exam type"),
		examYear: requiredText("Exam year"),
		examNumber: requiredText("Exam number"),
		centreNumber: requiredText("Centre number"),
		subjectCategory: z.enum(["science", "arts", "social"]),
		subjects: z
			.array(oLevelSubjectSchema)
			.refine(
				(subjects) => subjects.filter((subject) => subject.grade).length >= 5,
				"Enter grades for at least 5 subjects",
			),
		examType2: z.string().trim().optional().default(""),
		examYear2: z.string().trim().optional().default(""),
		examNumber2: z.string().trim().optional().default(""),
		centreNumber2: z.string().trim().optional().default(""),
		subjects2: z.array(oLevelSubjectSchema).optional().default([]),

		faculty: requiredText("Faculty"),
		department: requiredText("Department"),
		programmeType: requiredText("Programme type"),
		entryMode: requiredText("Entry mode"),
		utmeScore: z.string().trim().optional().default(""),
		utmeYear: z.string().trim().optional().default(""),
		jambRegNumber: requiredText("JAMB registration number"),
		jambScore: scoreStringSchema("JAMB score", 400),
		jambYear: z.string().trim().optional().default(""),
		secondChoiceProgramme: z.string().trim().optional().default(""),
		secondarySchoolName: z.string().trim().optional().default(""),
		yearOfGraduation: z.string().trim().optional().default(""),
		schoolAddress: z.string().trim().optional().default(""),
		interestedInCisco: z.string().trim().optional().default(""),

		agreedToDeclaration: z.literal(true, {
			error: "You must accept the declaration",
		}),
		agreedToTerms: z.literal(true, {
			error: "You must agree to the terms",
		}),
		agreedToAccuracy: z.literal(true, {
			error: "You must confirm the accuracy of your information",
		}),
		declarationDate: requiredText("Declaration date"),
		signature: requiredText("Signature"),
	})
	.refine((data) => data.email === data.confirmEmail, {
		message: "Email addresses do not match",
		path: ["confirmEmail"],
	});

export type ProgrammeSelectionInput = z.infer<typeof programmeSelectionSchema>;
export type AdmissionApplicationRequestInput = z.infer<
	typeof admissionApplicationRequestSchema
>;
export type AdmissionApplicationDraftRequestInput = z.infer<
	typeof admissionApplicationDraftRequestSchema
>;
export type AdmissionApplicationUpdateRequestInput = z.infer<
	typeof admissionApplicationUpdateRequestSchema
>;
export type AdmissionApplicationListQueryInput = z.infer<
	typeof admissionApplicationListQuerySchema
>;
export type AdmissionApplicationStep = z.infer<typeof admissionApplicationStepSchema>;
export type BiodataInput = z.infer<typeof biodataSchema>;
