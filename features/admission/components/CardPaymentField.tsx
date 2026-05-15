"use client";

import { PaymentFormData } from "../types/payment.types";

interface CardPaymentFieldsProps {
	card: PaymentFormData["card"];
	errors: Partial<Record<string, string>>;
	onChange: (field: keyof PaymentFormData["card"], value: string) => void;
}

function Field({
	label,
	error,
	children,
}: {
	label: string;
	error?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<label className="text-[11px] font-bold tracking-widest text-[#2d3f6b] uppercase">
				{label}
			</label>
			{children}
			{error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
		</div>
	);
}

const inputClass = (error?: string) =>
	`w-full border rounded-lg px-4 py-3 text-sm text-[#1a2b52] bg-[#f0f5fb] placeholder:text-[#a0aec0]
   outline-none transition-all focus:bg-white focus:border-[#c9952a] focus:ring-2 focus:ring-[#c9952a]/20
   ${error ? "border-red-400 bg-red-50" : "border-[#c8d8ec]"}`;

export default function CardPaymentFields({
	card,
	errors,
	onChange,
}: CardPaymentFieldsProps) {
	return (
		<div className="flex flex-col gap-4">
			<Field label="Card Number" error={errors.cardNumber}>
				<input
					type="text"
					inputMode="numeric"
					placeholder="0000 0000 0000 000"
					value={card.cardNumber}
					onChange={(e) => onChange("cardNumber", e.target.value)}
					className={inputClass(errors.cardNumber)}
					maxLength={19}
				/>
			</Field>

			<div className="grid grid-cols-2 gap-4">
				<Field label="Expiry Date" error={errors.expiryDate}>
					<input
						type="text"
						inputMode="numeric"
						placeholder="MM/YY"
						value={card.expiryDate}
						onChange={(e) => onChange("expiryDate", e.target.value)}
						className={inputClass(errors.expiryDate)}
						maxLength={5}
					/>
				</Field>
				<Field label="CVV" error={errors.cvv}>
					<input
						type="password"
						inputMode="numeric"
						placeholder="***"
						value={card.cvv}
						onChange={(e) => onChange("cvv", e.target.value)}
						className={inputClass(errors.cvv)}
						maxLength={4}
					/>
				</Field>
			</div>

			<Field label="Name on Card" error={errors.nameOnCard}>
				<input
					type="text"
					placeholder="As printed on card"
					value={card.nameOnCard}
					onChange={(e) => onChange("nameOnCard", e.target.value)}
					className={inputClass(errors.nameOnCard)}
				/>
			</Field>

			{/* Security badge */}
			<div className="flex items-center justify-center gap-2 text-[11px] text-[#808B96] mt-1">
				<span>🔒</span>
				<span>
					Secured with 256-bit SSL encryption. Your card details are protected.
				</span>
			</div>
		</div>
	);
}
