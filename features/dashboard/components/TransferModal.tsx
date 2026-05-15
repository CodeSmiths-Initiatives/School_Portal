"use client";

import { X, ArrowLeftRight } from "lucide-react";
import { TransferRequest } from "../types/dashboard.types";
import { DEPARTMENTS } from "../utils/dashboard";

interface Props {
	transfer: TransferRequest;
	targetDept: string;
	notes: string;
	onDeptChange: (d: string) => void;
	onNotesChange: (n: string) => void;
	onClose: () => void;
	onReject: () => void;
	onApprove: () => void;
}

export default function TransferModal({
	transfer,
	targetDept,
	notes,
	onDeptChange,
	onNotesChange,
	onClose,
	onReject,
	onApprove,
}: Props) {
	return (
		/* Backdrop */
		<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
			<div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
				{/* Modal header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-[#eef3fb]">
					<div className="flex items-center gap-3">
						<div className="w-9 h-9 rounded-xl bg-[#dde8f5] flex items-center justify-center text-[#3d5a9e]">
							<ArrowLeftRight size={18} />
						</div>
						<h2 className="text-base font-bold text-[#1a2b52]">
							Review Transfer Request
						</h2>
					</div>
					<button
						onClick={onClose}
						className="w-8 h-8 rounded-lg border border-[#dce6f2] flex items-center justify-center
              text-[#8a9ab5] hover:text-[#1a2b52] hover:border-[#8a9ab5] transition-colors"
					>
						<X size={15} />
					</button>
				</div>

				{/* Applicant info */}
				<div className="flex flex-col items-center gap-2 pt-7 pb-5">
					<div className="w-16 h-16 rounded-2xl bg-[#dde8f5] flex items-center justify-center text-[#3d5a9e]">
						<ArrowLeftRight size={28} />
					</div>
					<p className="text-base font-bold text-[#1a2b52] mt-1">
						{transfer.name}
					</p>
					<div className="flex items-center gap-4 text-xs text-[#8a9ab5]">
						<span>{transfer.ref}</span>
						<span>{transfer.initiatedBy}</span>
					</div>
				</div>

				<div className="px-6 pb-6 flex flex-col gap-5">
					{/* Currently in */}
					<div className="bg-[#dde8f5] rounded-xl px-4 py-3 flex items-center gap-2">
						<span className="text-[#3d5a9e] text-sm font-bold">ℹ</span>
						<span className="text-sm text-[#4a5a7a]">
							Currently:{" "}
							<strong className="text-[#3d5a9e]">
								{transfer.currentDepartment}
							</strong>
						</span>
					</div>

					{/* Transfer to */}
					<div className="flex flex-col gap-1.5">
						<label className="text-[10px] font-bold tracking-widest text-[#4a5a7a] uppercase">
							Transfer to Department
						</label>
						<div className="relative">
							<select
								value={targetDept}
								onChange={(e) => onDeptChange(e.target.value)}
								className="w-full appearance-none border border-[#dce6f2] rounded-xl px-4 py-3
                  text-sm text-[#1a2b52] bg-white outline-none focus:border-[#3d5a9e]
                  focus:ring-2 focus:ring-[#3d5a9e]/15 cursor-pointer"
							>
								<option value="">Select department....</option>
								{DEPARTMENTS.map((d) => (
									<option key={d} value={d}>
										{d}
									</option>
								))}
							</select>
							<span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8a9ab5] pointer-events-none text-xs">
								▾
							</span>
						</div>
					</div>

					{/* Officer notes */}
					<div className="flex flex-col gap-1.5">
						<label className="text-[10px] font-bold tracking-widest text-[#4a5a7a] uppercase">
							Officer Notes{" "}
							<span className="font-normal normal-case text-[#8a9ab5]">
								( Optional )
							</span>
						</label>
						<textarea
							value={notes}
							onChange={(e) => onNotesChange(e.target.value)}
							placeholder="Reason or notes for this admin transfer...."
							rows={3}
							className="border border-[#dce6f2] rounded-xl px-4 py-3 text-sm text-[#1a2b52]
                bg-white placeholder:text-[#b0bcd4] outline-none resize-y
                focus:border-[#3d5a9e] focus:ring-2 focus:ring-[#3d5a9e]/15"
						/>
					</div>

					{/* Action buttons */}
					<div className="flex items-center justify-end gap-3 pt-1">
						<button
							onClick={onClose}
							className="px-5 py-2 rounded-xl border border-[#dce6f2] text-sm font-semibold
                text-[#4a5a7a] hover:border-[#8a9ab5] transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={onReject}
							className="px-5 py-2 rounded-xl border-2 border-orange-400 text-sm font-semibold
                text-orange-500 hover:bg-orange-50 transition-colors"
						>
							Reject
						</button>
						<button
							onClick={onApprove}
							disabled={!targetDept}
							className="px-5 py-2 rounded-xl border-2 border-green-400 text-sm font-semibold
                text-green-600 hover:bg-green-50 transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed"
						>
							Approve Transfer
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
