"use client";

import {
	initializeAdmissionPayment,
	resumeAdmissionPayment,
	verifyAdmissionPayment,
	type PaystackPaymentMethod,
	type VerifiedPaymentSummary,
} from "@/lib/services/paystack.service";
import { useCallback, useState } from "react";

export type PaymentFlowStatus =
	| "idle"
	| "preparing"
	| "verifying"
	| "cancelled"
	| "failed";

interface StartPaymentArgs {
	email: string;
	username?: string;
	method: PaystackPaymentMethod;
	onVerified: (payment: VerifiedPaymentSummary) => void;
}

export function useAdmissionPaystackPayment() {
	const [status, setStatus] = useState<PaymentFlowStatus>("idle");
	const [message, setMessage] = useState("");

	const reset = useCallback(() => {
		setStatus("idle");
		setMessage("");
	}, []);

	const startPayment = useCallback(
		async ({ email, username, method, onVerified }: StartPaymentArgs) => {
			setStatus("preparing");
			setMessage("Preparing secure checkout...");

			try {
				const payment = await initializeAdmissionPayment({
					email,
					username,
					method,
				});

				await resumeAdmissionPayment(payment.accessCode, {
					onSuccess: async (transaction) => {
						const reference = transaction.reference ?? payment.reference;
						setStatus("verifying");
						setMessage("Payment received. Confirming with Paystack...");

						try {
							const verifiedPayment =
								await verifyAdmissionPayment(reference);
							reset();
							onVerified(verifiedPayment);
						} catch (error) {
							setStatus("failed");
							setMessage(
								error instanceof Error
									? error.message
									: "We could not verify this payment yet. Please try again.",
							);
						}
					},
					onCancel: () => {
						setStatus("cancelled");
						setMessage(
							"Payment was cancelled before completion. You can try again or go back.",
						);
					},
					onError: (error) => {
						setStatus("failed");
						setMessage(
							error instanceof Error
								? error.message
								: "Paystack could not start the checkout. Please try again.",
						);
					},
				});
			} catch (error) {
				setStatus("failed");
				setMessage(
					error instanceof Error
						? error.message
						: "Unable to start payment right now. Please try again.",
				);
			}
		},
		[reset],
	);

	return {
		status,
		message,
		reset,
		startPayment,
	};
}
