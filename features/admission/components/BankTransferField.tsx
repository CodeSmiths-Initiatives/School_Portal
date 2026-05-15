"use client";

import { Copy, CheckCircle } from "lucide-react";
import { useState } from "react";

const BANK_DETAILS = {
	bankName: "Zenith Bank PLC",
	accountName: "Kwara State University – Admissions",
	accountNumber: "1234567890",
	reference:
		"KSU-ADM-2026-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
};

export default function BankTransferFields() {
	const [copied, setCopied] = useState<string | null>(null);

	function copy(text: string, key: string) {
		navigator.clipboard.writeText(text);
		setCopied(key);
		setTimeout(() => setCopied(null), 2000);
	}

	function Row({
		label,
		value,
		copyKey,
	}: {
		label: string;
		value: string;
		copyKey: string;
	}) {
		return (
			<div className="flex items-center justify-between py-3 border-b border-[#dde8f2] last:border-0">
				<div>
					<p className="text-[10px] font-bold tracking-widest text-[#6b7e9f] uppercase mb-0.5">
						{label}
					</p>
					<p className="text-sm font-semibold text-[#1a2b52]">{value}</p>
				</div>
				<button
					type="button"
					onClick={() => copy(value, copyKey)}
					className="flex items-center gap-1.5 text-xs text-[#3d5a9e] hover:text-[#c9952a] transition-colors font-medium"
				>
					{copied === copyKey ? (
						<CheckCircle size={14} className="text-green-500" />
					) : (
						<Copy size={14} />
					)}
					{copied === copyKey ? "Copied!" : "Copy"}
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="rounded-xl border border-[#c8d8ec] bg-[#f0f5fb] px-5 py-2">
				<Row label="Bank Name" value={BANK_DETAILS.bankName} copyKey="bank" />
				<Row
					label="Account Name"
					value={BANK_DETAILS.accountName}
					copyKey="name"
				/>
				<Row
					label="Account Number"
					value={BANK_DETAILS.accountNumber}
					copyKey="account"
				/>
				<Row
					label="Payment Reference"
					value={BANK_DETAILS.reference}
					copyKey="ref"
				/>
			</div>

			<div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
				<p className="text-xs text-amber-800 leading-relaxed">
					<span className="font-bold">Important:</span> Use the payment
					reference above when making the transfer. Your application will be
					confirmed within 24 hours after payment is received.
				</p>
			</div>

			<div className="flex items-center justify-center gap-2 text-[11px] text-[#808B96]">
				<span>🔒</span>
				<span>
					Secured with 256-bit SSL encryption. Your card details are protected.
				</span>
			</div>
		</div>
	);
}
