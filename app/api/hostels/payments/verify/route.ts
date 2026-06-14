import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	getHostelData,
	verifyHostelPaymentRecord,
} from "@/lib/services/hostel.service";
import { z } from "zod";

const requestSchema = z.object({
	allocationId: z.string().trim().min(1, "Allocation is required."),
	reference: z.string().trim().min(6, "Payment reference is required."),
	amount: z.number().positive(),
	currency: z.string().trim().min(3).default("NGN"),
});

interface PaystackVerifyResponse {
	status: boolean;
	message: string;
	data?: {
		status?: string;
		reference?: string;
		amount?: number;
		currency?: string;
		channel?: string;
		paid_at?: string;
	};
}

function getCollegeSlug(request: Request, fallback?: string) {
	const url = new URL(request.url);
	return url.searchParams.get("collegeSlug") ?? fallback ?? "";
}

export async function POST(request: Request) {
	const secretKey = process.env.PAYSTACK_SECRET_KEY;

	if (!secretKey) {
		return NextResponse.json(
			{ error: "Server payment verification is not configured." },
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

		const expectedAmount = Math.round(allocation.amount * 100);
		const paystackResponse = await fetch(
			`https://api.paystack.co/transaction/verify/${encodeURIComponent(payload.data.reference)}`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${secretKey}`,
					"Content-Type": "application/json",
				},
				cache: "no-store",
			},
		);

		const paystackResult =
			(await paystackResponse.json()) as PaystackVerifyResponse;

		if (!paystackResponse.ok || !paystackResult.status || !paystackResult.data) {
			return NextResponse.json(
				{
					error:
						paystackResult.message ||
						"Unable to confirm hostel payment with Paystack.",
				},
				{ status: 502 },
			);
		}

		if (paystackResult.data.status !== "success") {
			return NextResponse.json(
				{ error: "Hostel payment has not completed successfully yet." },
				{ status: 409 },
			);
		}

		if (paystackResult.data.amount !== expectedAmount) {
			return NextResponse.json(
				{ error: "Verified amount does not match the hostel invoice." },
				{ status: 409 },
			);
		}

		const verifiedAt = new Date().toISOString();
		const result = await verifyHostelPaymentRecord(collegeSlug, {
			allocationId: allocation.id,
			reference: paystackResult.data.reference ?? payload.data.reference,
			amount: paystackResult.data.amount ?? expectedAmount,
			currency: paystackResult.data.currency ?? allocation.currency,
			channel: paystackResult.data.channel,
			paidAt: paystackResult.data.paid_at,
			verifiedAt,
			rawGatewayResponse: paystackResult.data,
		});

		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Unable to verify hostel payment.",
			},
			{ status: 502 },
		);
	}
}
