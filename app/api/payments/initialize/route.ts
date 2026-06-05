import {
	APPLICATION_PAYMENT_TOTAL_KOBO,
	PAYSTACK_CHANNELS,
} from "@/lib/services/paystack.service";
import { recordPaymentInitialized } from "@/lib/services/payment-persistence.service";
import { NextResponse } from "next/server";
import { z } from "zod";

const initializeRequestSchema = z.object({
	email: z.email("Enter a valid applicant email address"),
	username: z.string().trim().min(1).optional(),
	method: z.enum(["card", "bank_transfer", "ussd"]),
	collegeSlug: z.string().trim().min(1).optional(),
	studentId: z.string().trim().min(1).optional(),
	applicationId: z.string().trim().min(1).optional(),
	applicationNumber: z.string().trim().min(1).optional(),
	module: z
		.enum(["admission", "hostel", "tuition", "result", "transcript", "other"])
		.default("admission"),
});

function createReference() {
	const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
	return `ADM-${Date.now()}-${randomPart}`;
}

interface PaystackInitializeResponse {
	status: boolean;
	message: string;
	data?: {
		access_code?: string;
		reference?: string;
	};
}

export async function POST(request: Request) {
	const secretKey = process.env.PAYSTACK_SECRET_KEY;

	if (!secretKey) {
		return NextResponse.json(
			{ error: "Server payment configuration is missing." },
			{ status: 500 },
		);
	}

	let payload: unknown;

	try {
		payload = await request.json();
	} catch {
		return NextResponse.json(
			{ error: "Invalid payment request payload." },
			{ status: 400 },
		);
	}

	const parsed = initializeRequestSchema.safeParse(payload);

	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.issues[0]?.message ?? "Invalid payment details." },
			{ status: 400 },
		);
	}

	const reference = createReference();
	const subaccount = process.env.PAYSTACK_SUBACCOUNT_CODE?.trim();

	try {
		const paystackResponse = await fetch(
			"https://api.paystack.co/transaction/initialize",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${secretKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					amount: APPLICATION_PAYMENT_TOTAL_KOBO,
					email: parsed.data.email,
					reference,
					currency: "NGN",
					channels: [...PAYSTACK_CHANNELS[parsed.data.method]],
					metadata: {
						custom_fields: [
							{
								display_name: "Portal",
								variable_name: "portal",
								value: "School Portal",
							},
							{
								display_name: "Applicant Username",
								variable_name: "applicant_username",
								value: parsed.data.username ?? "Not provided",
							},
							{
								display_name: "College Slug",
								variable_name: "college_slug",
								value: parsed.data.collegeSlug ?? "Not selected",
							},
							{
								display_name: "Application Number",
								variable_name: "application_number",
								value: parsed.data.applicationNumber ?? "Not created",
							},
							{
								display_name: "Payment Category",
								variable_name: "payment_category",
								value: "Application Fee",
							},
						],
					},
					...(subaccount ? { subaccount } : {}),
				}),
				cache: "no-store",
			},
		);

		const paystackResult =
			(await paystackResponse.json()) as PaystackInitializeResponse;

		if (
			!paystackResponse.ok ||
			!paystackResult.status ||
			!paystackResult.data?.access_code
		) {
			return NextResponse.json(
				{
					error:
						paystackResult.message ||
						"Unable to initialize a secure payment session.",
				},
				{ status: 502 },
			);
		}

		const persistence = await recordPaymentInitialized({
			reference: paystackResult.data.reference ?? reference,
			accessCode: paystackResult.data.access_code,
			amount: APPLICATION_PAYMENT_TOTAL_KOBO,
			currency: "NGN",
			email: parsed.data.email,
			username: parsed.data.username,
			module: parsed.data.module,
			description:
				parsed.data.module === "admission"
					? "Application Fee"
					: `${parsed.data.module} payment`,
			collegeSlug: parsed.data.collegeSlug,
			studentId: parsed.data.studentId,
			applicationId: parsed.data.applicationId,
			applicationNumber: parsed.data.applicationNumber,
			gateway: "paystack",
			channel: parsed.data.method,
		});

		return NextResponse.json({
			payment: {
				accessCode: paystackResult.data.access_code,
				reference: paystackResult.data.reference ?? reference,
				invoiceNumber: persistence.invoiceNumber,
				persistence,
			},
		});
	} catch {
		return NextResponse.json(
			{ error: "Unable to reach Paystack right now. Please try again." },
			{ status: 502 },
		);
	}
}
