"use client";

import { ArrowLeftRight, Check, X } from "lucide-react";
import type { Application } from "../types/dashboard.types";

interface Props {
	applications: Application[];
	searchQuery: string;
	onSearch: (query: string) => void;
	departmentFilter: string;
	onDeptFilter: (department: string) => void;
	statusFilter: string;
	onStatusFilter: (status: string) => void;
	onAdmit: (ref: string) => void;
	onReject: (ref: string) => void;
	onTransfer: (application: Application) => void;
}

function ScorePill({ value, color }: { value: number; color: string }) {
	return (
		<span className={`rounded-md px-3 py-1 text-xs font-bold ${color}`}>
			{value}%
		</span>
	);
}

function StatusPill({ status }: { status: Application["status"] }) {
	const palette = {
		Pending: "border border-amber-200 bg-amber-100 text-amber-700",
		Admitted: "border border-green-200 bg-green-100 text-green-700",
		Rejected: "border border-red-200 bg-red-100 text-red-700",
	};

	return (
		<span
			className={`rounded-md px-3 py-1 text-[11px] font-bold ${palette[status]}`}
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
			<div className="flex flex-wrap items-center gap-3">
				<input
					type="text"
					placeholder="Search name or ref..."
					value={searchQuery}
					onChange={(event) => onSearch(event.target.value)}
					className="w-48 rounded-lg border border-[#dce6f2] bg-white px-4 py-2.5 text-sm text-[#1a2b52] outline-none placeholder:text-[#b0bcd4] focus:border-[#3d5a9e]"
				/>
				<input
					type="text"
					placeholder="All Departments"
					value={departmentFilter === "All Departments" ? "" : departmentFilter}
					onChange={(event) =>
						onDeptFilter(event.target.value || "All Departments")
					}
					className="w-44 rounded-lg border border-[#dce6f2] bg-white px-4 py-2.5 text-sm text-[#1a2b52] outline-none placeholder:text-[#b0bcd4] focus:border-[#3d5a9e]"
				/>
				<input
					type="text"
					value={statusFilter}
					onChange={(event) => onStatusFilter(event.target.value)}
					placeholder="Pending"
					className="w-32 rounded-lg border border-[#dce6f2] bg-white px-4 py-2.5 text-sm text-[#1a2b52] outline-none placeholder:text-[#b0bcd4] focus:border-[#3d5a9e]"
				/>
				<button className="flex items-center gap-2 rounded-lg bg-[#3d5a9e] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#2d4a8e]">
					<span className="text-yellow-300">✦</span> Auto-screen all
				</button>
			</div>

			<div className="overflow-hidden rounded-xl border border-[#dce6f2] bg-white shadow-sm">
				<div className="overflow-x-auto">
					<div className="min-w-[980px]">
						<div className="grid grid-cols-[100px_1fr_1fr_1fr_80px_80px_80px_100px_100px] border-b border-[#dce6f2] bg-[#eef3fb] px-5 py-3">
							{[
								"REF",
								"NAME",
								"1st Choice",
								"Alt. Choice",
								"O-Levels",
								"JAMB",
								"Combined",
								"Status",
								"Actions",
							].map((heading) => (
								<span
									key={heading}
									className="text-[10px] font-bold uppercase tracking-widest text-[#8a9ab5]"
								>
									{heading}
								</span>
							))}
						</div>

						{applications.length === 0 ? (
							<p className="py-10 text-center text-sm text-[#8a9ab5]">
								No applications found
							</p>
						) : (
							applications.map((application) => (
								<div
									key={application.ref}
									className="grid grid-cols-[100px_1fr_1fr_1fr_80px_80px_80px_100px_100px] items-center border-b border-[#f0f4fb] px-5 py-3.5 transition-colors hover:bg-[#fafbff]"
								>
									<span className="font-mono text-xs text-[#8a9ab5]">
										{application.ref}
									</span>
									<span className="text-sm font-bold text-[#1a2b52]">
										{application.name}
									</span>
									<span className="text-sm text-[#4a5a7a]">
										{application.firstChoice}
									</span>
									<span className="text-sm text-[#4a5a7a]">
										{application.altChoice}
									</span>
									<ScorePill
										value={application.olevels}
										color={
											application.olevels >= 70
												? "bg-green-100 text-green-700"
												: "bg-orange-100 text-orange-600"
										}
									/>
									<ScorePill
										value={application.jambs}
										color={
											application.jambs >= 70
												? "bg-green-100 text-green-700"
												: "bg-orange-100 text-orange-600"
										}
									/>
									<ScorePill
										value={application.combined}
										color={
											application.combined >= 70
												? "bg-green-100 text-green-700"
												: "bg-orange-100 text-orange-600"
										}
									/>
									<StatusPill status={application.status} />

									<div className="flex items-center gap-1.5">
										<button
											onClick={() => onAdmit(application.ref)}
											className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-green-400 text-green-500 transition-colors hover:bg-green-50"
										>
											<Check size={14} />
										</button>
										<button
											onClick={() => onReject(application.ref)}
											className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-red-400 text-red-500 transition-colors hover:bg-red-50"
										>
											<X size={14} />
										</button>
										<button
											onClick={() => onTransfer(application)}
											className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-blue-400 text-blue-500 transition-colors hover:bg-blue-50"
										>
											<ArrowLeftRight size={13} />
										</button>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
