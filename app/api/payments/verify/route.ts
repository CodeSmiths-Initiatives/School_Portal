import { paystackVerificationRequestSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
	const secretKey = process.env.PAYSTACK_SECRET_KEY;

	if (!secretKey) {
		return NextResponse.json(
			{ error: "Server payment verification is not configured." },
			{ status: 500 },
		);
	}

	let payload: unknown;

	try {
		payload = await request.json();
	} catch {
		return NextResponse.json(
			{ error: "Invalid payment verification payload." },
			{ status: 400 },
		);
	}

	const parsed = paystackVerificationRequestSchema.safeParse(payload);

	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.issues[0]?.message ?? "Invalid payment details." },
			{ status: 400 },
		);
	}

	try {
		const paystackResponse = await fetch(
			`https://api.paystack.co/transaction/verify/${encodeURIComponent(parsed.data.reference)}`,
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
						"Unable to confirm payment with Paystack at the moment.",
				},
				{ status: 502 },
			);
		}

		if (paystackResult.data.status !== "success") {
			return NextResponse.json(
				{ error: "Payment has not been completed successfully yet." },
				{ status: 409 },
			);
		}

		if (paystackResult.data.amount !== parsed.data.expectedAmount) {
			return NextResponse.json(
				{ error: "Verified amount does not match the application fee." },
				{ status: 409 },
			);
		}

		return NextResponse.json({
			payment: {
				reference: paystackResult.data.reference ?? parsed.data.reference,
				amount: (paystackResult.data.amount ?? parsed.data.expectedAmount) / 100,
				currency: paystackResult.data.currency ?? "NGN",
				channel: paystackResult.data.channel,
				paidAt: paystackResult.data.paid_at,
			},
		});
	} catch {
		return NextResponse.json(
			{
				error:
					"We could not reach Paystack to verify the transaction right now.",
			},
			{ status: 502 },
		);
	}
}
