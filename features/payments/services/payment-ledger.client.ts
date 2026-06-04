import type { PaymentLedgerResponse } from "@/features/payments/types/payment-ledger.types";

export async function fetchPaymentLedger(collegeSlug: string) {
	const response = await fetch(
		`/api/payments/ledger?collegeSlug=${encodeURIComponent(collegeSlug)}`,
		{
			method: "GET",
			headers: {
				Accept: "application/json",
			},
			cache: "no-store",
		},
	);
	const result = (await response.json()) as
		| { ledger?: PaymentLedgerResponse; error?: string }
		| undefined;

	if (!response.ok || !result?.ledger) {
		throw new Error(result?.error ?? "Unable to load payment ledger.");
	}

	return result.ledger;
}
