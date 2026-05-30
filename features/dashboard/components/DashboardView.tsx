"use client";

import type { Application } from "../types/dashboard.types";
import {
	COLOR_MAP,
	DEPARTMENT_BREAKDOWN,
	STAT_CARDS,
} from "../utils/dashboard";

function StatCard({ label, value, sublabel, color }: (typeof STAT_CARDS)[0]) {
	const palette = COLOR_MAP[color];

	return (
		<div
			className={`min-w-0 rounded-xl border-t-4 ${palette.border} bg-white p-5 shadow-sm`}
		>
			<p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9ab5]">
				{label}
			</p>
			<p className={`mt-2 text-4xl font-light ${palette.value}`}>{value}</p>
			<p className="mt-2 text-xs text-[#8a9ab5]">{sublabel}</p>
		</div>
	);
}

export default function DashboardView({
	applications,
}: {
	applications: Application[];
}) {
	const maxDepartmentCount = Math.max(
		...DEPARTMENT_BREAKDOWN.map((department) => department.count),
		1,
	);

	return (
		<div className="flex flex-col gap-6">
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
				{STAT_CARDS.map((card, index) => (
					<StatCard key={`${card.label}-${index}`} {...card} />
				))}
			</div>

			<div className="grid gap-4 xl:grid-cols-2">
				<div className="overflow-hidden rounded-xl border border-[#dce6f2] bg-white shadow-sm">
					<div className="border-b border-[#c8d8ec] bg-[#dde8f5] px-5 py-3">
						<p className="text-xs font-bold text-[#4a5a7a]">
							Recent applications
						</p>
					</div>
					<div className="divide-y divide-[#f0f4fb]">
						{applications.length === 0 ? (
							<p className="px-5 py-6 text-center text-xs text-[#8a9ab5]">
								No applications yet
							</p>
						) : (
							applications.map((application) => (
								<div
									key={application.ref}
									className="flex items-center justify-between gap-3 px-5 py-3"
								>
									<div>
										<p className="text-sm font-semibold text-[#1a2b52]">
											{application.name}
										</p>
										<p className="mt-0.5 text-[10px] text-[#8a9ab5]">
											{application.ref} · {application.firstChoice}
										</p>
									</div>
									<span
										className={`rounded-full px-3 py-1 text-[10px] font-bold ${
											application.status === "Admitted"
												? "bg-green-100 text-green-700"
												: application.status === "Rejected"
													? "bg-red-100 text-red-700"
													: "bg-yellow-100 text-yellow-700"
										}`}
									>
										{application.status}
									</span>
								</div>
							))
						)}
					</div>
				</div>

				<div className="overflow-hidden rounded-xl border border-[#dce6f2] bg-white shadow-sm">
					<div className="border-b border-[#c8d8ec] bg-[#dde8f5] px-5 py-3">
						<p className="text-xs font-bold text-[#4a5a7a]">
							Department breakdown
						</p>
					</div>
					<div className="flex flex-col gap-3 px-5 py-4">
						{DEPARTMENT_BREAKDOWN.map((department) => (
							<div
								key={department.department}
								className="flex items-center gap-3"
							>
								<p className="w-32 shrink-0 text-xs text-[#4a5a7a]">
									{department.department}
								</p>
								<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#dde8f5]">
									<div
										className="h-full rounded-full bg-[#3d5a9e]"
										style={{
											width: `${(department.count / maxDepartmentCount) * 100}%`,
										}}
									/>
								</div>
								<span className="w-4 text-right text-xs font-bold text-[#1a2b52]">
									{department.count}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
