"use client";

import { useState } from "react";
import { CutOffEntry } from "../types/dashboard.types";
import { DEFAULT_CUTOFFS, FACULTY_COLORS } from "../utils/dashboard";
import { RotateCcw, Save } from "lucide-react";

function CutOffCard({
	entry,
	onChange,
}: {
	entry: CutOffEntry;
	onChange: (id: string, field: keyof CutOffEntry, value: number) => void;
}) {
	const badgeClass =
		FACULTY_COLORS[entry.faculty] ?? "bg-gray-100 text-gray-600";

	function Field({
		label,
		field,
		value,
	}: {
		label: string;
		field: keyof CutOffEntry;
		value: number;
	}) {
		return (
			<div className="flex flex-col gap-1">
				<label className="text-[9px] font-bold tracking-widest text-[#8a9ab5] uppercase">
					{label}
				</label>
				<input
					type="number"
					value={value}
					onChange={(e) => onChange(entry.id, field, Number(e.target.value))}
					className="border border-[#dce6f2] rounded-lg px-3 py-2 text-sm font-medium
            text-[#1a2b52] bg-white outline-none focus:border-[#3d5a9e]
            focus:ring-2 focus:ring-[#3d5a9e]/10 w-full"
				/>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-2xl border border-[#dce6f2] shadow-sm p-5 flex flex-col gap-4">
			{/* Header */}
			<div className="flex items-start justify-between gap-2">
				<h3 className="text-sm font-bold text-[#1a2b52] leading-snug">
					{entry.department}
				</h3>
				<span
					className={`text-[9px] font-bold tracking-wider px-2.5 py-1 rounded-full
          shrink-0 ${badgeClass}`}
				>
					{entry.faculty}
				</span>
			</div>

			{/* Fields grid 2×2 */}
			<div className="grid grid-cols-2 gap-3">
				<Field label="Min JAMB Score" field="minJamb" value={entry.minJamb} />
				<Field
					label="Min O-Level %"
					field="minOLevel"
					value={entry.minOLevel}
				/>
				<Field
					label="Min Combined %"
					field="minCombined"
					value={entry.minCombined}
				/>
				<Field
					label="Min GPA (5.0 Scale)"
					field="minGpa"
					value={entry.minGpa}
				/>
			</div>
		</div>
	);
}

export default function CutoffView() {
	const [cutoffs, setCutoffs] = useState<CutOffEntry[]>(DEFAULT_CUTOFFS);
	const [saved, setSaved] = useState(false);

	function handleChange(id: string, field: keyof CutOffEntry, value: number) {
		setCutoffs((prev) =>
			prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
		);
		setSaved(false);
	}

	function handleSave() {
		// TODO: POST to API
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	}

	function handleReset() {
		setCutoffs(DEFAULT_CUTOFFS);
		setSaved(false);
	}

	return (
		<div className="flex flex-col gap-5">
			{/* Section heading */}
			<div>
				<h2 className="text-base font-bold text-[#1a2b52]">
					Department Cut-Off Manager
				</h2>
				<p className="text-xs text-[#8a9ab5] mt-0.5">
					Set minimum JAMB score, O-Level %, Combined %, and GPA per department.
				</p>
			</div>

			{/* 4-column card grid */}
			<div className="grid grid-cols-4 gap-4">
				{cutoffs.map((entry) => (
					<CutOffCard key={entry.id} entry={entry} onChange={handleChange} />
				))}
			</div>

			{/* Footer action buttons */}
			<div className="flex items-center gap-3 pt-2">
				<button
					onClick={handleSave}
					className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
            transition-all shadow-sm
            ${
							saved
								? "bg-green-500 text-white"
								: "bg-[#3d5a9e] hover:bg-[#2d4a8e] text-white shadow-[#3d5a9e]/30"
						}`}
				>
					<Save size={14} />
					{saved ? "Saved!" : "Save All Cut-Offs"}
				</button>
				<button
					onClick={handleReset}
					className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
            border-2 border-[#dce6f2] text-[#4a5a7a] hover:border-[#8a9ab5]
            transition-all bg-white"
				>
					<RotateCcw size={14} />
					Reset Defaults
				</button>
			</div>
		</div>
	);
}
