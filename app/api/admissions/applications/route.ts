import {
	createAdmissionApplicationDraftRecord,
	createAdmissionApplicationRecord,
	listAdmissionApplicationRecords,
} from "@/lib/services/admission-application.service";
import {
	admissionApplicationDraftRequestSchema,
	admissionApplicationListQuerySchema,
	admissionApplicationRequestSchema,
} from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const parsed = admissionApplicationListQuerySchema.safeParse({
		collegeSlug: searchParams.get("collegeSlug"),
		email: searchParams.get("email") || undefined,
		status: searchParams.get("status") || undefined,
		paymentStatus: searchParams.get("paymentStatus") || undefined,
		currentStep: searchParams.get("currentStep") || undefined,
		from: searchParams.get("from") || undefined,
		to: searchParams.get("to") || undefined,
		search: searchParams.get("search") || undefined,
		limit: searchParams.get("limit") || undefined,
	});

	if (!parsed.success) {
		return NextResponse.json(
			{
				error:
					parsed.error.issues[0]?.message ??
					"Invalid admission application lookup.",
			},
			{ status: 400 },
		);
	}

	try {
		const applications = await listAdmissionApplicationRecords(parsed.data);
		return NextResponse.json({ applications });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Unable to load admission applications.",
			},
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	let payload: unknown;

	try {
		payload = await request.json();
	} catch {
		return NextResponse.json(
			{ error: "Invalid admission application payload." },
			{ status: 400 },
		);
	}

	const parsed = admissionApplicationRequestSchema.safeParse(payload);

	if (!parsed.success) {
		const draftParsed = admissionApplicationDraftRequestSchema.safeParse(payload);

		if (!draftParsed.success) {
			return NextResponse.json(
				{
					error:
						parsed.error.issues[0]?.message ??
						draftParsed.error.issues[0]?.message ??
						"Invalid admission application details.",
				},
				{ status: 400 },
			);
		}

		const draft = await createAdmissionApplicationDraftRecord(draftParsed.data);
		return NextResponse.json({ application: draft }, { status: 201 });
	}

	const application = await createAdmissionApplicationRecord(parsed.data);

	return NextResponse.json({ application }, { status: 201 });
}
