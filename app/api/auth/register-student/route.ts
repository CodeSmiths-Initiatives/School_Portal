import {
	registerStudentPortalAccount,
	studentPortalRegistrationSchema,
} from "@/lib/services/student-registration.service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	const payload = await request.json().catch(() => null);
	const parsed = studentPortalRegistrationSchema.safeParse(payload);

	if (!parsed.success) {
		return NextResponse.json(
			{
				error:
					parsed.error.issues[0]?.message ??
					"Valid student registration details are required.",
			},
			{ status: 400 },
		);
	}

	try {
		const registration = await registerStudentPortalAccount(parsed.data);

		return NextResponse.json({ registration });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Unable to create the student portal account.",
			},
			{ status: 502 },
		);
	}
}
