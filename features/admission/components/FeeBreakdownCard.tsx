"use client";

import { FeeBreakdown } from "../types/payment.types";
import { formatCurrency } from "../utils/formatters";

interface FeeBreakdownCardProps {
	fee: FeeBreakdown;
}

export default function FeeBreakdownCard({ fee }: FeeBreakdownCardProps) {
	const total = fee.applicationFee + fee.bankCharges;

	return (
		<div className="h-full overflow-hidden rounded-2xl border border-[#d8e3f0] bg-white shadow-[0_14px_32px_-28px_rgba(23,48,95,0.45)]">
			{/* Header */}
			<div className="border-b border-[#dce6f2] bg-[#f8fbff] px-5 py-3.5">
				<p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7386a6]">
					Fee Breakdown
				</p>
			</div>

			{/* Rows */}
			<div className="divide-y divide-[#e6eef7]">
				<div className="flex items-center justify-between gap-4 px-5 py-4">
					<span className="text-sm text-[#6a7b95]">Programme</span>
					<span className="text-right text-sm font-semibold text-[#17305f]">
						{fee.programme}
					</span>
				</div>
				<div className="flex items-center justify-between gap-4 px-5 py-4">
					<span className="text-sm text-[#6a7b95]">Application fee</span>
					<span className="text-right text-sm font-semibold text-[#17305f]">
						{formatCurrency(fee.applicationFee)}
					</span>
				</div>
				<div className="flex items-center justify-between gap-4 px-5 py-4">
					<span className="text-sm text-[#6a7b95]">Bank charges</span>
					<span className="text-right text-sm font-semibold text-[#17305f]">
						{formatCurrency(fee.bankCharges)}
					</span>
				</div>
				{/* Total */}
				<div className="flex items-center justify-between gap-4 bg-[#fbfdff] px-5 py-4">
					<span className="text-sm font-bold text-[#17305f]">Total Due</span>
					<span className="text-right text-xl font-bold text-[#c9952a]">
						{formatCurrency(total)}
					</span>
				</div>
			</div>
		</div>
	);
}
