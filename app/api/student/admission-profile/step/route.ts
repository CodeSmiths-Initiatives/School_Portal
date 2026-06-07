import {
	saveStudentAdmissionProfileStep,
	type StudentAdmissionProfileStep,
} from "@/lib/services/student-admission-profile.service";
import { NextResponse } from "next/server";

const VALID_STEPS = new Set<StudentAdmissionProfileStep>([
	"bioData",
	"contactData",
	"oLevelData",
	"programmeData",
	"declarationData",
]);

function asRecord(value: unknown) {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

export async function PATCH(request: Request) {
	let payload: Record<string, unknown>;

	try {
		payload = asRecord(await request.json());
	} catch {
		return NextResponse.json(
			{ error: "Invalid admission profile step payload." },
			{ status: 400 },
		);
	}

	const collegeSlug =
		typeof payload.collegeSlug === "string" ? payload.collegeSlug.trim() : "";
	const step = typeof payload.step === "string" ? payload.step : "";
	const stepPayload = asRecord(payload.payload);

	if (!collegeSlug) {
		return NextResponse.json(
			{ error: "College slug is required." },
			{ status: 400 },
		);
	}

	if (!VALID_STEPS.has(step as StudentAdmissionProfileStep)) {
		return NextResponse.json(
			{ error: "Valid admission profile step is required." },
			{ status: 400 },
		);
	}

	if (!Object.keys(stepPayload).length) {
		return NextResponse.json(
			{ error: "Admission profile step details are required." },
			{ status: 400 },
		);
	}

	try {
		const result = await saveStudentAdmissionProfileStep({
			collegeSlug,
			step: step as StudentAdmissionProfileStep,
			payload: stepPayload,
		});

		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Unable to save admission profile step.",
			},
			{ status: 500 },
		);
	}
}
