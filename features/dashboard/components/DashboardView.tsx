"use client";

import { Application } from "../types/dashboard.types";
import {
	COLOR_MAP,
	DEPARTMENT_BREAKDOWN,
	STAT_CARDS,
} from "../utils/dashboard";

function StatCard({ label, value, sublabel, color }: (typeof STAT_CARDS)[0]) {
	const c = COLOR_MAP[color];
	return (
		<div
			className={`bg-white rounded-xl border-t-4 ${c.border} shadow-sm p-5 flex flex-col gap-2 min-w-0`}
		>
			<p className="text-[10px] font-bold tracking-widest text-[#8a9ab5] uppercase">
				{label}
			</p>
			<p className={`text-4xl font-light ${c.value}`}>{value}</p>
			<p className="text-xs text-[#8a9ab5]">{sublabel}</p>
		</div>
	);
}

export default function DashboardView({
	applications,
}: {
	applications: Application[];
}) {
	const maxDept = Math.max(...DEPARTMENT_BREAKDOWN.map((d) => d.count), 1);

	return (
		<div className="flex flex-col gap-6">
			{/* Stat cards row */}
			<div className="grid grid-cols-5 gap-4">
				{STAT_CARDS.map((card, i) => (
					<StatCard key={i} {...card} />
				))}
			</div>

			{/* Bottom panels */}
			<div className="grid grid-cols-2 gap-4">
				{/* Recent Applications */}
				<div className="bg-white rounded-xl border border-[#dce6f2] shadow-sm overflow-hidden">
					<div className="bg-[#dde8f5] px-5 py-3 border-b border-[#c8d8ec]">
						<p className="text-xs font-bold text-[#4a5a7a]">
							Recent Application
						</p>
					</div>
					<div className="divide-y divide-[#f0f4fb]">
						{applications.length === 0 ? (
							<p className="text-xs text-[#8a9ab5] px-5 py-6 text-center">
								No applications yet
							</p>
						) : (
							applications.map((app) => (
								<div
									key={app.ref}
									className="flex items-center justify-between px-5 py-3"
								>
									<div>
										<p className="text-sm font-semibold text-[#1a2b52]">
											{app.name}
										</p>
										<p className="text-[10px] text-[#8a9ab5] mt-0.5">
											{app.ref} · {app.firstChoice}
										</p>
									</div>
									<span
										className={`text-[10px] font-bold px-3 py-1 rounded-full
                    ${
											app.status === "Admitted"
												? "bg-green-100 text-green-700"
												: app.status === "Rejected"
													? "bg-red-100 text-red-700"
													: "bg-yellow-100 text-yellow-700"
										}`}
									>
										{app.status}
									</span>
								</div>
							))
						)}
					</div>
				</div>

				{/* Department Breakdown */}
				<div className="bg-white rounded-xl border border-[#dce6f2] shadow-sm overflow-hidden">
					<div className="bg-[#dde8f5] px-5 py-3 border-b border-[#c8d8ec]">
						<p className="text-xs font-bold text-[#4a5a7a]">
							Department Breakdown
						</p>
					</div>
					<div className="px-5 py-4 flex flex-col gap-3">
						{DEPARTMENT_BREAKDOWN.map((dept) => (
							<div key={dept.department} className="flex items-center gap-3">
								<p className="text-xs text-[#4a5a7a] w-32 shrink-0">
									{dept.department}
								</p>
								<div className="flex-1 bg-[#dde8f5] rounded-full h-1.5 overflow-hidden">
									<div
										className="h-full bg-[#3d5a9e] rounded-full"
										style={{ width: `${(dept.count / maxDept) * 100}%` }}
									/>
								</div>
								<span className="text-xs font-bold text-[#1a2b52] w-4 text-right">
									{dept.count}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
