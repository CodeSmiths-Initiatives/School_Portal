import { z } from "zod";

export const courseSchema = z.object({
	code: z.string().trim().min(2, "Course code is required").max(20),
	department: z.string().trim().min(1, "Department is required"),
	title: z.string().trim().min(3, "Course title is required").max(120),
	description: z.string().trim().min(1, "Description is required").max(500),
	type: z.enum(["Core", "Elective", "Required", "Borrowed", "Carryover"]),
	units: z.coerce.number().int().min(1).max(12),
	levels: z
		.array(z.enum(["100L", "200L", "300L", "400L"]))
		.min(1, "Select at least one level"),
	mode: z.enum(["On-Site", "Online", "Hybrid"]),
	schedule: z.string().trim().min(1, "Schedule is required"),
	lecturer: z.string().trim().min(1, "Lecturer is required"),
	status: z.enum(["Pending", "Approved", "Rejected"]).default("Pending"),
	approvalNote: z.string().trim().optional(),
});

export const timetableSlotSchema = z.object({
	code: z.string().trim().min(2, "Course code is required"),
	title: z.string().trim().min(3, "Course title is required"),
	day: z.string().trim().min(1, "Day is required"),
	time: z.string().trim().min(1, "Time slot is required"),
	room: z.string().trim().min(1, "Venue or room is required"),
	mode: z.enum(["On-Site", "Online", "Hybrid"]),
	level: z.enum(["100L", "200L", "300L", "400L"]),
});

export type CourseInput = z.infer<typeof courseSchema>;
export type TimetableSlotInput = z.infer<typeof timetableSlotSchema>;
