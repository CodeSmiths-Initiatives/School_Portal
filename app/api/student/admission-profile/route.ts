import {
	getStudentAdmissionProfile,
} from "@/lib/services/student-admission-profile.service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const collegeSlug = searchParams.get("collegeSlug")?.trim();

	if (!collegeSlug) {
		return NextResponse.json(
			{ error: "College slug is required." },
			{ status: 400 },
		);
	}

	try {
		const result = await getStudentAdmissionProfile(collegeSlug);
		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Unable to load admission profile.",
			},
			{ status: 500 },
		);
	}
}
