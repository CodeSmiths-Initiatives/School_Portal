"use client";

import { CheckCircle, Copy } from "lucide-react";
import { useId, useState } from "react";

const BANK_DETAILS = {
	bankName: "Zenith Bank PLC",
	accountName: "Kwara State University - Admissions",
	accountNumber: "1234567890",
};

function BankDetailRow({
	copied,
	copyKey,
	label,
	onCopy,
	value,
}: {
	copied: string | null;
	copyKey: string;
	label: string;
	onCopy: (text: string, key: string) => void;
	value: string;
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
				onClick={() => onCopy(value, copyKey)}
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

export default function BankTransferFields() {
	const referenceId = useId().replace(/[^a-z0-9]/gi, "").toUpperCase();
	const [copied, setCopied] = useState<string | null>(null);
	const paymentReference = `KSU-ADM-2026-${referenceId.slice(-6).padStart(6, "0")}`;

	function copy(text: string, key: string) {
		navigator.clipboard.writeText(text);
		setCopied(key);
		setTimeout(() => setCopied(null), 2000);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="rounded-xl border border-[#c8d8ec] bg-[#f0f5fb] px-5 py-2">
				<BankDetailRow
					copied={copied}
					copyKey="bank"
					label="Bank Name"
					onCopy={copy}
					value={BANK_DETAILS.bankName}
				/>
				<BankDetailRow
					copied={copied}
					copyKey="name"
					label="Account Name"
					onCopy={copy}
					value={BANK_DETAILS.accountName}
				/>
				<BankDetailRow
					copied={copied}
					copyKey="account"
					label="Account Number"
					onCopy={copy}
					value={BANK_DETAILS.accountNumber}
				/>
				<BankDetailRow
					copied={copied}
					copyKey="ref"
					label="Payment Reference"
					onCopy={copy}
					value={paymentReference}
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
				<span>Lock</span>
				<span>
					Secured with 256-bit SSL encryption. Your card details are protected.
				</span>
			</div>
		</div>
	);
}
