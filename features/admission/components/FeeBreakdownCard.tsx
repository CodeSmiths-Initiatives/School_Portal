"use client";

import { FeeBreakdown } from "../types/payment.types";
import { formatCurrency } from "../utils/formatters";

interface FeeBreakdownCardProps {
	fee: FeeBreakdown;
}

export default function FeeBreakdownCard({ fee }: FeeBreakdownCardProps) {
	const total = fee.applicationFee + fee.bankCharges;

	return (
		<div className="border border-[#c8d8ec] rounded-xl bg-[#f0f5fb] overflow-hidden mb-6">
			{/* Header */}
			<div className="px-5 py-3 border-b border-[#c8d8ec]">
				<p className="text-[10px] font-bold tracking-widest text-[#6b7e9f] uppercase">
					Fee Breakdown
				</p>
			</div>

			{/* Rows */}
			<div className="divide-y divide-[#dde8f2]">
				<div className="flex items-center justify-between px-5 py-3">
					<span className="text-sm text-[#808B96]">Programme</span>
					<span className="text-sm font-medium text-[#1a2b52]">
						{fee.programme}
					</span>
				</div>
				<div className="flex items-center justify-between px-5 py-3">
					<span className="text-sm text-[#808B96]">Application fee</span>
					<span className="text-sm font-medium text-[#1a2b52]">
						{formatCurrency(fee.applicationFee)}
					</span>
				</div>
				<div className="flex items-center justify-between px-5 py-3">
					<span className="text-sm text-[#808B96]">Bank charges</span>
					<span className="text-sm font-medium text-[#1a2b52]">
						{formatCurrency(fee.bankCharges)}
					</span>
				</div>
				{/* Total */}
				<div className="flex items-center justify-between px-5 py-4 bg-white">
					<span className="text-sm font-bold text-[#1a2b52]">Total Due</span>
					<span className="text-base font-bold text-[#c9952a]">
						{formatCurrency(total)}
					</span>
				</div>
			</div>
		</div>
	);
}
