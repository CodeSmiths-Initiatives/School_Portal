"use client";

import FieldFeedback from "@/components/forms/FieldFeedback";
import {
	APPLICATION_PAYMENT_BREAKDOWN,
	APPLICATION_PAYMENT_TOTAL,
	formatNaira,
	type PaystackPaymentMethod,
	type VerifiedPaymentSummary,
} from "@/lib/services/paystack.service";
import { paymentIntentSchema } from "@/lib/validation";
import {
	ArrowLeft,
	BadgeCheck,
	CircleAlert,
	CreditCard,
	LoaderCircle,
	ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useAdmissionPaystackPayment } from "../hooks/useAdmissionPaystackPayment";
import { PaymentApplicantProfile } from "../types/payment.types";
import FeeBreakdownCard from "./FeeBreakdownCard";

const CARD_PAYMENT_COPY = {
	title: "Card checkout",
	description:
		"Use your debit or credit card in Paystack's secure checkout window.",
	icon: CreditCard,
	hint: "A secure Paystack modal will open for card entry. Card details stay inside Paystack checkout.",
};

function StatusPanel({
	status,
	message,
}: {
	status: "preparing" | "verifying" | "cancelled" | "failed";
	message: string;
}) {
	const config = {
		preparing: {
			icon: LoaderCircle,
			title: "Preparing secure checkout",
			className:
				"border-[#d6e2f3] bg-[#f5f8fd] text-[#36507d]",
			iconClassName: "animate-spin",
		},
		verifying: {
			icon: ShieldCheck,
			title: "Verifying payment",
			className:
				"border-[#d8ebda] bg-[#f4fbf5] text-[#2f6a39]",
			iconClassName: "",
		},
		cancelled: {
			icon: CircleAlert,
			title: "Payment cancelled",
			className:
				"border-[#f2dfb5] bg-[#fff9ea] text-[#8a6112]",
			iconClassName: "",
		},
		failed: {
			icon: CircleAlert,
			title: "Payment needs attention",
			className:
				"border-[#f0d1d7] bg-[#fff7f8] text-[#9a2c46]",
			iconClassName: "",
		},
	}[status];

	const Icon = config.icon;

	return (
		<div
			className={`rounded-xl border px-4 py-3 ${config.className}`}
			role="status"
			aria-live="polite"
		>
			<div className="flex items-start gap-3">
				<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/70">
					<Icon className={`size-4 ${config.iconClassName}`} />
				</div>
				<div className="min-w-0">
					<p className="text-sm font-semibold">{config.title}</p>
					<p className="mt-1 text-xs leading-relaxed opacity-90">{message}</p>
				</div>
			</div>
		</div>
	);
}

type PaymentProps = {
	account?: PaymentApplicantProfile | null;
	onNext: (payment: VerifiedPaymentSummary) => void;
	onBack: () => void;
};

export default function Payment({ account, onNext, onBack }: PaymentProps) {
	const [method] = useState<PaystackPaymentMethod>("card");
	const [localError, setLocalError] = useState<string>("");
	const { status, message, reset, startPayment } = useAdmissionPaystackPayment();

	const paymentCopy = CARD_PAYMENT_COPY;
	const PaymentIcon = paymentCopy.icon;
	const canRetry = status === "failed" || status === "cancelled";
	const ctaLabel =
		status === "preparing"
			? "Preparing checkout..."
			: status === "verifying"
				? "Verifying payment..."
				: `Pay ${formatNaira(APPLICATION_PAYMENT_TOTAL)} with Paystack`;

	const applicantEmail = account?.email?.trim() ?? "";

	async function handlePayment() {
		setLocalError("");
		const validation = paymentIntentSchema.safeParse({
			method,
			email: applicantEmail,
			username: account?.username,
		});

		if (!validation.success) {
			setLocalError(
				validation.error.issues[0]?.message ??
					"Applicant email is required before payment can continue.",
			);
			return;
		}

		await startPayment({
			email: validation.data.email,
			username: validation.data.username,
			method: validation.data.method,
			onVerified: onNext,
		});
	}

	return (
		<div className="surface-card mx-auto w-full max-w-2xl p-5 sm:p-6 lg:p-8">
			<div className="mb-6">
				<div className="h-2 w-full overflow-hidden rounded-full bg-[#e4eaf4]">
					<div className="h-full w-3/4 rounded-full bg-[#B7770D] transition-all duration-500" />
				</div>
			</div>

			<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#B7770D]">
				Step 3 of 4
			</p>
			<h3 className="mb-1 text-2xl font-semibold text-[#0d1b3e]">
				Application Payment
			</h3>
			<p className="mb-6 text-sm font-medium leading-relaxed text-[#6f7f98]">
				Complete the application fee through Paystack. We only mark this step as
				successful after the payment is verified on the server.
			</p>

			<div className="mb-6 grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
				<FeeBreakdownCard fee={APPLICATION_PAYMENT_BREAKDOWN} />

				<div className="flex h-full flex-col rounded-2xl border border-[#d8e3f0] bg-white p-5 shadow-[0_14px_32px_-28px_rgba(23,48,95,0.45)]">
					<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#7b8daa]">
						Applicant
					</p>
					<p className="mt-4 text-base font-semibold text-[#17305f]">
						{account?.username || "New applicant"}
					</p>
					<p className="mt-1 break-all text-sm leading-relaxed text-[#5f7395]">
						{applicantEmail || "Email from account step will appear here"}
					</p>
					<div className="mt-4 inline-flex items-center gap-2 self-start rounded-lg border border-[#dce6f2] bg-[#f8fbff] px-3 py-2 text-xs font-medium text-[#58708f]">
						<ShieldCheck className="size-3.5 text-[#2f6a39]" />
						<span>Secure verification will follow checkout</span>
					</div>
					<div className="mt-auto pt-5">
						<div className="rounded-xl border border-[#dce6f2] bg-[#f8fbff] px-4 py-3.5">
						<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a9ab5]">
							Amount due
						</p>
						<p className="mt-1.5 text-[1.75rem] font-bold leading-none text-[#0d1b3e]">
							{formatNaira(APPLICATION_PAYMENT_TOTAL)}
						</p>
						</div>
					</div>
				</div>
			</div>

			<form
				onSubmit={(event) => {
					event.preventDefault();
					void handlePayment();
				}}
				className="space-y-6"
				noValidate
			>
				<div className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4 sm:p-5">
					<div className="mb-4 flex items-start justify-between gap-3">
						<div>
							<p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1a2b52]">
								Payment route
							</p>
							<p className="mt-1 text-xs text-[#6f7f98]">
								Card payment is enabled for the current MVP checkout flow.
							</p>
						</div>
						<div className="rounded-full border border-[#d8e3f0] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#35527d]">
							Card only
						</div>
					</div>

					<div className="flex items-start gap-3">
						<div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#eef4fb] text-[#1d4776]">
							<PaymentIcon className="size-5" />
						</div>
						<div className="min-w-0">
							<h4 className="text-base font-semibold text-[#17305f]">
								{paymentCopy.title}
							</h4>
							<p className="mt-1 text-sm leading-relaxed text-[#60728f]">
								{paymentCopy.description}
							</p>
							<p className="mt-3 text-xs font-medium leading-relaxed text-[#70819d]">
								{paymentCopy.hint}
							</p>
						</div>
					</div>

					<div className="mt-4 rounded-xl border border-[#d9e6d8] bg-[#f5faf5] px-4 py-3">
						<div className="flex items-start gap-3">
							<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[#2f6a39]">
								<ShieldCheck className="size-4" />
							</div>
							<div>
								<p className="text-sm font-semibold text-[#2f6a39]">
									Secure checkout
								</p>
								<p className="mt-1 text-xs leading-relaxed text-[#4f7757]">
									Checkout opens in Paystack and the application only moves forward
									after our server confirms the transaction reference and amount.
								</p>
							</div>
						</div>
					</div>
				</div>

				{(status !== "idle" || localError) && (
					<div className="space-y-3">
						{status !== "idle" && (
							<StatusPanel
								status={status}
								message={message}
							/>
						)}
						{localError && (
							<FieldFeedback message={localError} />
						)}
					</div>
				)}

				<div className="grid gap-3 pt-1 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_auto]">
					<button
						type="button"
						onClick={() => {
							reset();
							setLocalError("");
							onBack();
						}}
						className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl border border-[#d5e1ef] bg-white px-5 text-sm font-semibold text-[#35527d] transition hover:border-[#b8c9de] hover:bg-[#f8fbff] sm:w-auto"
					>
						<ArrowLeft className="size-4" />
						Back
					</button>

					<button
						type="submit"
						disabled={status === "preparing" || status === "verifying"}
						className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#2E86C1] px-5 text-sm font-semibold text-white shadow-md shadow-[#2e86c1]/20 transition hover:bg-[#2a78ae] hover:shadow-lg hover:shadow-[#2e86c1]/25 disabled:cursor-not-allowed disabled:opacity-70"
					>
						{status === "preparing" || status === "verifying" ? (
							<LoaderCircle className="size-4 animate-spin" />
						) : (
							<BadgeCheck className="size-4" />
						)}
						{ctaLabel}
					</button>

					{canRetry && (
						<button
							type="button"
							onClick={() => {
								reset();
								setLocalError("");
							}}
							className="inline-flex h-13 w-full items-center justify-center rounded-xl border border-[#f0d9ad] bg-[#fff8e9] px-5 text-sm font-semibold text-[#94691a] transition hover:bg-[#fff3d9] sm:w-auto"
						>
							Try again
						</button>
					)}
				</div>

				<p className="mx-auto max-w-xl text-center text-xs leading-relaxed text-[#8193af]">
					Powered by Paystack test checkout for MVP review. Webhook reconciliation
					can be added next for production-grade reliability.
				</p>
			</form>
		</div>
	);
}
