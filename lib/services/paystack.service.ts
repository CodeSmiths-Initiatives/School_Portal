import { paymentMethodSchema } from "@/lib/validation";
import { z } from "zod";

const paymentMethodValueSchema = paymentMethodSchema;

export type PaystackPaymentMethod = z.infer<typeof paymentMethodValueSchema>;

export const APPLICATION_PAYMENT_BREAKDOWN = {
	programme: "Undergraduate",
	applicationFee: 15000,
	bankCharges: 1500,
} as const;

export const APPLICATION_PAYMENT_TOTAL =
	APPLICATION_PAYMENT_BREAKDOWN.applicationFee +
	APPLICATION_PAYMENT_BREAKDOWN.bankCharges;

export const APPLICATION_PAYMENT_TOTAL_KOBO = APPLICATION_PAYMENT_TOTAL * 100;

export const PAYSTACK_CHANNELS: Record<
	PaystackPaymentMethod,
	readonly string[]
> = {
	card: ["card"],
	bank_transfer: ["bank_transfer"],
	ussd: ["ussd"],
};

export interface AdmissionPaymentIntent {
	email: string;
	username?: string;
	method: PaystackPaymentMethod;
}

export interface InitializedPayment {
	accessCode: string;
	reference: string;
}

export interface VerifiedPaymentSummary {
	reference: string;
	amount: number;
	currency: string;
	channel?: string;
	paidAt?: string;
}

export function formatNaira(amount: number) {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		maximumFractionDigits: 0,
	}).format(amount);
}

export async function initializeAdmissionPayment(
	payload: AdmissionPaymentIntent,
) {
	const response = await fetch("/api/payments/initialize", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	const result = (await response.json()) as
		| { payment?: InitializedPayment; error?: string }
		| undefined;

	if (!response.ok || !result?.payment) {
		throw new Error(
			result?.error ??
				"We could not prepare Paystack checkout right now. Please try again.",
		);
	}

	return result.payment;
}

export async function resumeAdmissionPayment(
	accessCode: string,
	handlers: {
		onSuccess: (transaction: { reference?: string; message?: string }) => void | Promise<void>;
		onCancel: () => void;
		onError: (error: unknown) => void;
	},
) {
	const { default: PaystackPop } = await import("@paystack/inline-js");
	const popup = new PaystackPop();

	popup.resumeTransaction(accessCode, {
		onSuccess: handlers.onSuccess,
		onCancel: handlers.onCancel,
		onError: handlers.onError,
	});
}

export async function verifyAdmissionPayment(reference: string) {
	const response = await fetch("/api/payments/verify", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			reference,
			expectedAmount: APPLICATION_PAYMENT_TOTAL_KOBO,
		}),
	});

	const result = (await response.json()) as
		| { payment?: VerifiedPaymentSummary; error?: string }
		| undefined;

	if (!response.ok || !result?.payment) {
		throw new Error(
			result?.error ??
				"We could not confirm your payment yet. Please try again.",
		);
	}

	return result.payment;
}
