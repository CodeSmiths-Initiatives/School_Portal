"use client";

import { useState } from "react";
import { PaymentMethod, PaymentFormData } from "../types/payment.types";
import { formatCardNumber, formatExpiry, formatCvv } from "../utils/formatters";
import { FeeBreakdown } from "../types/payment.types";
import FeeBreakdownCard from "./FeeBreakdownCard";
import BankTransferFields from "./BankTransferField";
import CardPaymentFields from "./CardPaymentField";
import UssdFields from "./UssdField";
import PaymentMethodTabs from "./PaymentMethodTabs";
import { on } from "events";

const FEE: FeeBreakdown = {
	programme: "Undergraduate",
	applicationFee: 15000,
	bankCharges: 1500,
};

const initialData: PaymentFormData = {
	method: "card",
	card: { cardNumber: "", expiryDate: "", cvv: "", nameOnCard: "" },
	bankTransfer: { bankName: "", accountNumber: "", reference: "" },
	ussd: { network: "" },
};

export function usePaymentForm(onNext: () => void, onBack: () => void) {
	const [formData, setFormData] = useState<PaymentFormData>(initialData);
	const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	function setMethod(method: PaymentMethod) {
		setFormData((prev) => ({ ...prev, method }));
		setErrors({});
	}

	function handleCardChange(
		field: keyof PaymentFormData["card"],
		raw: string,
	): void {
		let value = raw;
		if (field === "cardNumber") value = formatCardNumber(raw);
		if (field === "expiryDate") value = formatExpiry(raw);
		if (field === "cvv") value = formatCvv(raw);

		setFormData((prev) => ({
			...prev,
			card: { ...prev.card, [field]: value },
		}));
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
	}

	function handleUssdChange(network: string) {
		setFormData((prev) => ({ ...prev, ussd: { network } }));
		if (errors.network) setErrors((prev) => ({ ...prev, network: undefined }));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const validationErrors = validatePaymentForm(formData);
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			return;
		}
		setIsSubmitting(true);
		// TODO: call payment _services API here
		await new Promise((r) => setTimeout(r, 1800));
		setIsSubmitting(false);
		setIsSuccess(true);
		// TODO: advance to step 4 (confirmation)
		onNext(); // FIX: now actually calls the callback and advances to step 3
	}

	return {
		formData,
		errors,
		isSubmitting,
		isSuccess,
		setMethod,
		handleCardChange,
		handleUssdChange,
		handleSubmit,
	};
}

export function validatePaymentForm(
	data: PaymentFormData,
): Partial<Record<string, string>> {
	const errors: Partial<Record<string, string>> = {};

	if (data.method === "card") {
		const digits = data.card.cardNumber.replace(/\s/g, "");
		if (!digits) errors.cardNumber = "Card number is required";
		else if (digits.length < 15)
			errors.cardNumber = "Enter a valid card number";

		if (!data.card.expiryDate) errors.expiryDate = "Expiry date is required";
		else if (!/^\d{2}\/\d{2}$/.test(data.card.expiryDate))
			errors.expiryDate = "Use MM/YY format";

		if (!data.card.cvv) errors.cvv = "CVV is required";
		else if (data.card.cvv.length < 3) errors.cvv = "Invalid CVV";

		if (!data.card.nameOnCard.trim())
			errors.nameOnCard = "Name on card is required";
	}

	if (data.method === "ussd") {
		if (!data.ussd.network) errors.network = "Select a network";
	}

	return errors;
}

type PaymentProps = {
	onNext: () => void;
	onBack: () => void;
};

export default function Payment({ onNext, onBack }: PaymentProps) {
	const {
		formData,
		errors,
		isSubmitting,
		setMethod,
		handleCardChange,
		handleUssdChange,
		handleSubmit,
	} = usePaymentForm(onNext, onBack);

	const total = FEE.applicationFee + FEE.bankCharges;

	return (
		<div className="surface-card mx-auto w-full max-w-2xl p-5 sm:p-6 lg:p-8">
			{/*Progress bar */}
			<div className="mb-6">
				<div className="h-2 w-full bg-[#e4eaf4] rounded-full overflow-hidden">
					<div className="h-full w-3/4 bg-[#B7770D] rounded-full transition-all duration-500"></div>
				</div>
			</div>

			{/*Step label */}
			<p className="text-[#B7770D] text-xs font-semibold tracking-wide uppercase mb-2">
				Step 3 of 4
			</p>
			<h3 className="text-gray-800 text-2xl font-semibold mb-1">
				Application Payment
			</h3>
			<p className="text-[#808B96] text-xs font-semibold mb-6 leading-relaxed">
				Pay your non-refundable application fees to submit your application
			</p>

			<FeeBreakdownCard fee={FEE} />

			<form onSubmit={handleSubmit} className="flex flex-col gap-0">
				<PaymentMethodTabs active={formData.method} onChange={setMethod} />

				{formData.method === "card" && (
					<CardPaymentFields
						card={formData.card}
						errors={errors}
						onChange={handleCardChange}
					/>
				)}
				{formData.method === "bank_transfer" && <BankTransferFields />}
				{formData.method === "ussd" && (
					<UssdFields
						network={formData.ussd.network}
						error={errors.network}
						onChange={handleUssdChange}
						amount={total}
					/>
				)}

				<button
					type="submit"
					disabled={isSubmitting}
					className="w-full mt-6 py-4 rounded-xl bg-[#2E86C1] hover:bg-[#3a5f95] active:bg-[#2a4f85]
            text-white font-semibold text-sm tracking-wide
            transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
            shadow-md shadow-[#3d5a9e]/30 hover:shadow-lg hover:shadow-[#3d5a9e]/40
            hover:-translate-y-0.5 flex items-center justify-center gap-2"
				>
					{isSubmitting ? (
						<>
							<svg
								className="animate-spin h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8v8H4z"
								/>
							</svg>
							Processing payment…
						</>
					) : (
						<>🔒 Complete Payment &amp; Submit Application</>
					)}
				</button>
				{/* Go Back */}
				{/* <button
					type="button"
					onClick={handleBack}
					className="w-full py-3.5 rounded-xl bg-[#2E86C1] hover:bg-[#3d5a9e]
              text-white font-semibold text-sm tracking-wide
              transition-all duration-200
              shadow-sm hover:shadow-md hover:shadow-[#3d5a9e]/30"
				>
					Go Back
				</button> */}
			</form>
		</div>
	);
}
