"use client";

import { ArrowLeftRight } from "lucide-react";
import { TransferRow } from "../types/dashboard.types";

interface Props {
	transfers: TransferRow[];
}

function StatusPill({ status }: { status: TransferRow["status"] }) {
	const map = {
		Pending: "bg-amber-100 text-amber-700 border border-amber-200",
		Approved: "bg-green-100 text-green-700 border border-green-200",
		Rejected: "bg-red-100 text-red-700 border border-red-200",
	};
	return (
		<span
			className={`text-[11px] font-bold px-3 py-1 rounded-md ${map[status]}`}
		>
			{status}
		</span>
	);
}

export default function TransferView({ transfers }: Props) {
	const cols = [
		"ID",
		"APPLICANT",
		"FROM",
		"TO",
		"REASON",
		"SCORE",
		"STATUS",
		"ACTIONS",
	];

	return (
		<div className="flex flex-col gap-3">
			{/* Section heading */}
			<div>
				<h2 className="text-base font-bold text-[#1a2b52]">
					Transfer Requests
				</h2>
				<p className="text-xs text-[#8a9ab5] mt-0.5">
					Review and approve or reject department transfers from application
				</p>
			</div>

			{/* Table */}
			<div className="bg-white rounded-xl border border-[#dce6f2] shadow-sm overflow-hidden">
				{/* Header */}
				<div
					className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_80px_100px_100px]
          bg-[#eef3fb] px-5 py-3 border-b border-[#dce6f2]"
				>
					{cols.map((h) => (
						<span
							key={h}
							className="text-[10px] font-bold tracking-widest text-[#8a9ab5] uppercase"
						>
							{h}
						</span>
					))}
				</div>

				{/* Empty state */}
				{transfers.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 gap-3">
						<div className="w-12 h-12 rounded-xl bg-[#dde8f5] flex items-center justify-center text-[#3d5a9e]">
							<ArrowLeftRight size={22} />
						</div>
						<p className="text-sm text-[#8a9ab5]">No transfer requests</p>
					</div>
				) : (
					transfers.map((t) => (
						<div
							key={t.id}
							className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_80px_100px_100px]
                px-5 py-3.5 items-center border-b border-[#f0f4fb] hover:bg-[#fafbff] transition-colors"
						>
							<span className="text-xs text-[#8a9ab5] font-mono">{t.id}</span>
							<span className="text-sm font-bold text-[#1a2b52]">
								{t.applicant}
							</span>
							<span className="text-sm text-[#4a5a7a]">{t.from}</span>
							<span className="text-sm text-[#4a5a7a]">{t.to}</span>
							<span className="text-sm text-[#4a5a7a] truncate pr-2">
								{t.reason}
							</span>
							<span className="text-sm font-bold text-[#1a2b52]">
								{t.score}%
							</span>
							<StatusPill status={t.status} />
							<div className="flex items-center gap-1.5">
								<button
									className="text-xs text-green-600 border border-green-300 px-2 py-1
                  rounded-lg hover:bg-green-50 transition-colors font-semibold"
								>
									Approve
								</button>
								<button
									className="text-xs text-red-500 border border-red-300 px-2 py-1
                  rounded-lg hover:bg-red-50 transition-colors font-semibold"
								>
									Reject
								</button>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
