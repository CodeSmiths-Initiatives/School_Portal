import { updateAdmissionApplicationRecord } from "@/lib/services/admission-application.service";
import { admissionApplicationUpdateRequestSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

type AdmissionApplicationRouteContext = {
	params: Promise<{ applicationId: string }>;
};

export async function PATCH(
	request: Request,
	{ params }: AdmissionApplicationRouteContext,
) {
	const { applicationId } = await params;
	let payload: unknown;

	try {
		payload = await request.json();
	} catch {
		return NextResponse.json(
			{ error: "Invalid admission application update payload." },
			{ status: 400 },
		);
	}

	const parsed = admissionApplicationUpdateRequestSchema.safeParse(payload);

	if (!parsed.success) {
		return NextResponse.json(
			{
				error:
					parsed.error.issues[0]?.message ??
					"Invalid admission application update details.",
			},
			{ status: 400 },
		);
	}

	try {
		const application = await updateAdmissionApplicationRecord(
			applicationId,
			parsed.data,
		);

		return NextResponse.json({ application });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Unable to update admission application.",
			},
			{ status: 500 },
		);
	}
}
