"use client";
import { Download, Megaphone } from "lucide-react";
import { ResultRow } from "../types/dashboard.types";
import { MOCK_RESULTS } from "../utils/dashboard";

function CombinedPill({ value, cutoff }: { value: number; cutoff: number }) {
	const pass = value >= cutoff;
	return (
		<span
			className={`text-xs font-bold px-3 py-1 rounded-md
      ${pass ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600"}`}
		>
			{value}%
		</span>
	);
}

function VerdictPill({ verdict }: { verdict: ResultRow["verdict"] }) {
	const map = {
		Admitted: "bg-green-100 text-green-700 border border-green-200",
		Pending: "bg-amber-100 text-amber-700 border border-amber-200",
		Rejected: "bg-red-100 text-red-700 border border-red-200",
	};
	return (
		<span
			className={`text-[11px] font-bold px-3 py-1 rounded-md ${map[verdict]}`}
		>
			{verdict}
		</span>
	);
}

export default function ResultView() {
	const results: ResultRow[] = MOCK_RESULTS;

	function exportCsv() {
		const header = "REF,NAME,ADMITTED TO,COMBINED,CUT-OFF,GPA,VERDICT\n";
		const rows = results
			.map(
				(r) =>
					`${r.ref},${r.name},${r.admittedTo},${r.combined}%,${r.cutoff}%,${r.gpa},${r.verdict}`,
			)
			.join("\n");
		const blob = new Blob([header + rows], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "admission-results.csv";
		a.click();
		URL.revokeObjectURL(url);
	}

	return (
		<div className="flex flex-col gap-5">
			{/* Section heading */}
			<div>
				<h2 className="text-base font-bold text-[#1a2b52]">
					Transfer Requests
				</h2>
				<p className="text-xs text-[#8a9ab5] mt-0.5">
					Review and approve or reject department transfers from application
				</p>
			</div>

			{/* Action buttons */}
			<div className="flex items-center gap-3">
				<button
					className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
          bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 transition-colors"
				>
					<Megaphone size={14} />
					Publish Results
				</button>
				<button
					onClick={exportCsv}
					className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
            bg-[#dde8f5] text-[#3d5a9e] border border-[#c8d8ec] hover:bg-[#c8d8ec] transition-colors"
				>
					<Download size={14} />
					Export CSV
				</button>
			</div>

			{/* Results table */}
			<div className="bg-white rounded-xl border border-[#dce6f2] shadow-sm overflow-hidden">
				{/* Header */}
				<div
					className="grid grid-cols-[100px_1fr_1fr_100px_100px_100px_120px]
          bg-[#eef3fb] px-5 py-3 border-b border-[#dce6f2]"
				>
					{[
						"REF",
						"NAME",
						"ADMITTED TO",
						"COMBINED",
						"CUT-OFF",
						"GPA",
						"VERDICT",
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
				{results.map((row, i) => (
					<div
						key={i}
						className="grid grid-cols-[100px_1fr_1fr_100px_100px_100px_120px]
              px-5 py-3.5 items-center border-b border-[#f0f4fb] hover:bg-[#fafbff] transition-colors"
					>
						<span className="text-xs text-[#8a9ab5] font-mono">{row.ref}</span>
						<span className="text-sm font-bold text-[#1a2b52]">{row.name}</span>
						<span className="text-sm text-[#4a5a7a]">
							{row.admittedTo || "—"}
						</span>
						<CombinedPill value={row.combined} cutoff={row.cutoff} />
						<span className="text-sm text-[#4a5a7a]">{row.cutoff}%</span>
						<span
							className={`text-sm font-bold ${row.gpa >= 3.5 ? "text-[#3d5a9e]" : "text-[#4a5a7a]"}`}
						>
							{row.gpa.toFixed(2)}
						</span>
						<VerdictPill verdict={row.verdict} />
					</div>
				))}
			</div>

			{/* Scoring Formula box */}
			<div className="bg-white rounded-2xl border border-[#dce6f2] shadow-sm p-6 mt-2">
				<div className="flex items-center gap-2 mb-4">
					<div className="w-5 h-5 rounded bg-[#3d5a9e]" />
					<h3 className="text-base font-bold text-[#1a2b52]">
						Scoring Formula
					</h3>
				</div>
				<ul className="flex flex-col gap-2.5">
					{[
						{
							bold: "O-Level:",
							text: "A1=6pts → F9=0pts → converted to % of max possible point",
						},
						{ bold: "JAMB:", text: "Raw score ÷ 400 × 100" },
						{ bold: "Combined Score =", text: "O-Level × 40% + JAMB × 60%" },
						{ bold: "GPA:", text: "mapped from combined % (5.0 scale)" },
						{
							bold: "Auto-routing:",
							text: "If below 1st choice cut-off → automatically checked against alternative course",
						},
					].map((item, i) => (
						<li
							key={i}
							className="flex items-start gap-2 text-sm text-[#4a5a7a] leading-relaxed"
						>
							<span className="w-1.5 h-1.5 rounded-full bg-[#1a2b52] mt-2 flex-shrink-0" />
							<span>
								<strong className="text-[#1a2b52]">{item.bold}</strong>{" "}
								{item.text}
							</span>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
