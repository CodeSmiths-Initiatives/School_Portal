import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	getHostelData,
	initializeHostelPaymentRecord,
} from "@/lib/services/hostel.service";
import { z } from "zod";

const requestSchema = z.object({
	allocationId: z.string().trim().min(1, "Allocation is required."),
	email: z.email("A valid student email is required.").optional(),
	channel: z.literal("card").default("card"),
});

interface PaystackInitializeResponse {
	status: boolean;
	message: string;
	data?: {
		access_code?: string;
		reference?: string;
	};
}

function getCollegeSlug(request: Request, fallback?: string) {
	const url = new URL(request.url);
	return url.searchParams.get("collegeSlug") ?? fallback ?? "";
}

function createReference() {
	const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
	return `HST-${Date.now()}-${randomPart}`;
}

function getPaystackCheckoutEmail(email: string) {
	const normalized = email.trim().toLowerCase();

	if (normalized.endsWith(".test")) {
		const localPart = normalized
			.split("@")[0]
			?.replace(/[^a-z0-9._+-]/g, "")
			.slice(0, 48);

		return `${localPart || "student"}+iums-test@example.com`;
	}

	return normalized;
}

export async function POST(request: Request) {
	const secretKey = process.env.PAYSTACK_SECRET_KEY;

	if (!secretKey) {
		return NextResponse.json(
			{ error: "Server payment configuration is missing." },
			{ status: 500 },
		);
	}

	try {
		const session = await getCurrentAuthSession();

		if (!session || session.user.domain !== "student") {
			return NextResponse.json(
				{ error: "Student authentication is required." },
				{ status: 401 },
			);
		}

		const collegeSlug = getCollegeSlug(request, session.user.collegeSlug);

		if (!collegeSlug || session.user.collegeSlug !== collegeSlug) {
			return NextResponse.json(
				{ error: "This payment is outside your college scope." },
				{ status: 403 },
			);
		}

		const payload = requestSchema.safeParse(await request.json());

		if (!payload.success) {
			return NextResponse.json(
				{ error: payload.error.issues[0]?.message ?? "Invalid payment details." },
				{ status: 400 },
			);
		}

		const payerEmail = session.user.email ?? payload.data.email;

		if (!payerEmail) {
			return NextResponse.json(
				{ error: "A valid student email is required for Paystack checkout." },
				{ status: 400 },
			);
		}

		const checkoutEmail = getPaystackCheckoutEmail(payerEmail);

		const studentIdentifier = session.user.email ?? session.user.id;
		const hostelData = await getHostelData(collegeSlug, studentIdentifier);
		const allocation = hostelData.allocations.find(
			(item) => item.id === payload.data.allocationId,
		);

		if (!allocation) {
			return NextResponse.json(
				{ error: "Hostel allocation could not be found for this student." },
				{ status: 404 },
			);
		}

		if (allocation.paymentStatus === "paid") {
			return NextResponse.json(
				{ error: "This hostel invoice has already been paid." },
				{ status: 409 },
			);
		}

		const reference = createReference();
		const amount = Math.round(allocation.amount * 100);
		const subaccount = process.env.PAYSTACK_SUBACCOUNT_CODE?.trim();

		const paystackResponse = await fetch(
			"https://api.paystack.co/transaction/initialize",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${secretKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					amount,
					email: checkoutEmail,
					reference,
					currency: allocation.currency,
					channels: ["card"],
					metadata: {
						student_email: payerEmail,
						custom_fields: [
							{
								display_name: "Payment Category",
								variable_name: "payment_category",
								value: "Hostel Fee",
							},
							{
								display_name: "Invoice Number",
								variable_name: "invoice_number",
								value: allocation.invoiceNumber,
							},
							{
								display_name: "Allocation Number",
								variable_name: "allocation_number",
								value: allocation.allocationNumber,
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
						"Unable to initialize a secure hostel payment session.",
				},
				{ status: 502 },
			);
		}

		await initializeHostelPaymentRecord(collegeSlug, {
			allocationId: allocation.id,
			reference: paystackResult.data.reference ?? reference,
			accessCode: paystackResult.data.access_code,
			channel: payload.data.channel,
		});

		return NextResponse.json({
			payment: {
				accessCode: paystackResult.data.access_code,
				reference: paystackResult.data.reference ?? reference,
			},
		});
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Unable to start hostel payment.",
			},
			{ status: 502 },
		);
	}
}
