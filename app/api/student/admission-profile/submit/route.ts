import {
	submitStudentAdmissionProfile,
} from "@/lib/services/student-admission-profile.service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	let payload: Record<string, unknown>;

	try {
		const body = await request.json();
		payload =
			body && typeof body === "object" && !Array.isArray(body)
				? (body as Record<string, unknown>)
				: {};
	} catch {
		return NextResponse.json(
			{ error: "Invalid admission profile submit payload." },
			{ status: 400 },
		);
	}

	const collegeSlug =
		typeof payload.collegeSlug === "string" ? payload.collegeSlug.trim() : "";

	if (!collegeSlug) {
		return NextResponse.json(
			{ error: "College slug is required." },
			{ status: 400 },
		);
	}

	try {
		const result = await submitStudentAdmissionProfile(collegeSlug);
		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Unable to submit admission profile.",
			},
			{ status: 500 },
		);
	}
}
