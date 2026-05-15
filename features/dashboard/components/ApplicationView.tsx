"use client";

import { ArrowLeftRight, Check, X } from "lucide-react";
import { Application } from "../types/dashboard.types";

interface Props {
	applications: Application[];
	searchQuery: string;
	onSearch: (q: string) => void;
	departmentFilter: string;
	onDeptFilter: (d: string) => void;
	statusFilter: string;
	onStatusFilter: (s: string) => void;
	onAdmit: (ref: string) => void;
	onReject: (ref: string) => void;
	onTransfer: (app: Application) => void;
}

function ScorePill({ value, color }: { value: number; color: string }) {
	return (
		<span className={`text-xs font-bold px-3 py-1 rounded-md ${color}`}>
			{value}%
		</span>
	);
}

function StatusPill({ status }: { status: Application["status"] }) {
	const map = {
		Pending: "bg-amber-100 text-amber-700 border border-amber-200",
		Admitted: "bg-green-100 text-green-700 border border-green-200",
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

export default function ApplicationView({
	applications,
	searchQuery,
	onSearch,
	departmentFilter,
	onDeptFilter,
	statusFilter,
	onStatusFilter,
	onAdmit,
	onReject,
	onTransfer,
}: Props) {
	return (
		<div className="flex flex-col gap-4">
			{/* Filters row */}
			<div className="flex items-center gap-3">
				<input
					type="text"
					placeholder="Search name or ref..."
					value={searchQuery}
					onChange={(e) => onSearch(e.target.value)}
					className="border border-[#dce6f2] rounded-lg px-4 py-2.5 text-sm text-[#1a2b52]
            bg-white placeholder:text-[#b0bcd4] outline-none focus:border-[#3d5a9e] w-48"
				/>
				<input
					type="text"
					placeholder="All Departments"
					value={departmentFilter === "All Departments" ? "" : departmentFilter}
					onChange={(e) => onDeptFilter(e.target.value || "All Departments")}
					className="border border-[#dce6f2] rounded-lg px-4 py-2.5 text-sm text-[#1a2b52]
            bg-white placeholder:text-[#b0bcd4] outline-none focus:border-[#3d5a9e] w-44"
				/>
				<input
					type="text"
					value={statusFilter}
					onChange={(e) => onStatusFilter(e.target.value)}
					placeholder="Pending"
					className="border border-[#dce6f2] rounded-lg px-4 py-2.5 text-sm text-[#1a2b52]
            bg-white placeholder:text-[#b0bcd4] outline-none focus:border-[#3d5a9e] w-32"
				/>
				<button
					className="flex items-center gap-2 bg-[#3d5a9e] hover:bg-[#2d4a8e] text-white
          text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-sm"
				>
					<span className="text-yellow-300">✦</span> Auto-Screen All
				</button>
			</div>

			{/* Table */}
			<div className="bg-white rounded-xl border border-[#dce6f2] shadow-sm overflow-hidden">
				{/* Header */}
				<div
					className="grid grid-cols-[100px_1fr_1fr_1fr_80px_80px_80px_100px_100px]
          bg-[#eef3fb] px-5 py-3 border-b border-[#dce6f2]"
				>
					{[
						"REF",
						"NAME",
						"1st CHOICE",
						"ALT. CHOICE",
						"O-LEVELS",
						"JAMBS",
						"COMBINED",
						"STATUS",
						"ACTIONS",
					].map((h) => (
						<span
							key={h}
							className="text-[10px] font-bold tracking-widest text-[#8a9ab5] uppercase"
						>
							{h}
						</span>
					))}
				</div>

				{/* Rows */}
				{applications.length === 0 ? (
					<p className="text-sm text-[#8a9ab5] text-center py-10">
						No applications found
					</p>
				) : (
					applications.map((app) => (
						<div
							key={app.ref}
							className="grid grid-cols-[100px_1fr_1fr_1fr_80px_80px_80px_100px_100px]
                px-5 py-3.5 items-center border-b border-[#f0f4fb] hover:bg-[#fafbff] transition-colors"
						>
							<span className="text-xs text-[#8a9ab5] font-mono">
								{app.ref}
							</span>
							<span className="text-sm font-bold text-[#1a2b52]">
								{app.name}
							</span>
							<span className="text-sm text-[#4a5a7a]">{app.firstChoice}</span>
							<span className="text-sm text-[#4a5a7a]">{app.altChoice}</span>
							<ScorePill
								value={app.olevels}
								color={
									app.olevels >= 70
										? "bg-green-100 text-green-700"
										: "bg-orange-100 text-orange-600"
								}
							/>
							<ScorePill
								value={app.jambs}
								color={
									app.jambs >= 70
										? "bg-green-100 text-green-700"
										: "bg-orange-100 text-orange-600"
								}
							/>
							<ScorePill
								value={app.combined}
								color={
									app.combined >= 70
										? "bg-green-100 text-green-700"
										: "bg-orange-100 text-orange-600"
								}
							/>
							<StatusPill status={app.status} />

							{/* Action buttons */}
							<div className="flex items-center gap-1.5">
								<button
									onClick={() => onAdmit(app.ref)}
									className="w-8 h-8 rounded-lg border-2 border-green-400 text-green-500
                    hover:bg-green-50 flex items-center justify-center transition-colors"
								>
									<Check size={14} />
								</button>
								<button
									onClick={() => onReject(app.ref)}
									className="w-8 h-8 rounded-lg border-2 border-red-400 text-red-500
                    hover:bg-red-50 flex items-center justify-center transition-colors"
								>
									<X size={14} />
								</button>
								<button
									onClick={() => onTransfer(app)}
									className="w-8 h-8 rounded-lg border-2 border-blue-400 text-blue-500
                    hover:bg-blue-50 flex items-center justify-center transition-colors"
								>
									<ArrowLeftRight size={13} />
								</button>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
