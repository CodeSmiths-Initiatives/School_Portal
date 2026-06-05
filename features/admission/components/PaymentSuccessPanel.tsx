"use client";

import { BadgeCheck, Hash, Mail, WalletCards } from "lucide-react";
import Link from "next/link";
import type { PaymentVerificationResult } from "@/features/admission/types/payment.types";
import { formatNaira } from "@/lib/services/paystack.service";

type PaymentSuccessPanelProps = {
	applicantEmail?: string;
	collegeSlug?: string;
	paymentResult: PaymentVerificationResult | null;
};

function ReceiptItem({
	icon: Icon,
	label,
	value,
	breakAll = false,
}: {
	icon: typeof Hash;
	label: string;
	value: string;
	breakAll?: boolean;
}) {
	return (
		<div className="rounded-xl border border-[#dbe5f1] bg-[#fbfdff] px-4 py-3">
			<div className="flex items-center gap-2 text-[#7b8daa]">
				<Icon className="size-3.5" />
				<p className="text-[10px] font-bold uppercase tracking-[0.2em]">
					{label}
				</p>
			</div>
			<p
				className={`mt-2 text-sm font-semibold text-[#17305f] ${
					breakAll ? "break-all" : ""
				}`}
			>
				{value}
			</p>
		</div>
	);
}

export default function PaymentSuccessPanel({
	applicantEmail,
	collegeSlug,
	paymentResult,
}: PaymentSuccessPanelProps) {
	const dashboardHref = collegeSlug
		? `/college/${collegeSlug}/student/dashboard`
		: "/apply";

	return (
		<div className="surface-card w-full max-w-2xl p-5 text-center sm:p-6 lg:p-8">
			<div className="mb-4">
				<div className="h-2 w-full overflow-hidden rounded-full bg-[#e4eaf4]">
					<div className="h-full w-full rounded-full bg-[#c9922a]" />
				</div>
			</div>

			<p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#c9922a]">
				Step 4 of 4
			</p>
			<h3 className="text-xl font-extrabold italic text-[#0d1b3e] sm:text-2xl">
				Payment Successful
			</h3>

			<div className="payment-success-enter mx-auto mt-4 flex max-w-[5rem] items-center justify-center">
				<div className="payment-success-glow relative flex size-[4.25rem] items-center justify-center rounded-full bg-[#edf8ef]">
					<div className="absolute inset-0 rounded-full border border-[#b9e4bf]" />
					<div className="absolute inset-[0.45rem] rounded-full border border-[#dcefe0]" />
					<BadgeCheck className="relative z-10 size-8 text-[#5aa042]" />
				</div>
			</div>

			<p className="mx-auto mt-5 max-w-xl text-sm font-medium leading-7 text-[#4a6fa5]">
				Your application has been submitted successfully. A verified payment
				receipt is now attached to your admission record for review.
			</p>

			<div className="mx-auto mt-6 grid max-w-md gap-4 rounded-2xl border border-[#dbe5f1] bg-[linear-gradient(180deg,#fafdff_0%,#f4f8fe_100%)] p-4 text-left shadow-[0_16px_30px_-28px_rgba(23,48,95,0.45)] sm:p-5">
				<div className="flex items-center justify-between gap-3">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b8daa]">
							Payment confirmed
						</p>
						<p className="mt-1 text-sm font-medium text-[#5f7395]">
							Verified application receipt
						</p>
					</div>
					<span className="rounded-full bg-[#eef8ef] px-3 py-1 text-[11px] font-semibold text-[#2d7f3b]">
						Success
					</span>
				</div>

				<div className="grid gap-3">
					<ReceiptItem
						icon={Hash}
						label="Reference"
						value={paymentResult?.reference || "Awaiting reference"}
						breakAll
					/>

					<div className="grid gap-3 sm:grid-cols-2">
						<ReceiptItem
							icon={WalletCards}
							label="Amount"
							value={formatNaira(paymentResult?.amount ?? 0)}
						/>
						<ReceiptItem
							icon={Mail}
							label="Email"
							value={applicantEmail || "No email available"}
							breakAll
						/>
					</div>
				</div>
			</div>

			<div className="mt-7 flex justify-center">
				<Link
					href={dashboardHref}
					className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#2E86C1] px-5 text-sm font-semibold text-white shadow-md shadow-[#2e86c1]/20 transition hover:bg-[#2a78ae] hover:shadow-lg hover:shadow-[#2e86c1]/25"
				>
					{collegeSlug ? "Go to Student Dashboard" : "Choose College"}
				</Link>
			</div>
		</div>
	);
}
