"use client";

import {
	Programme,
	ProgrammeType,
} from "@/features/admission/types/programme.types";

interface ProgrammeCardProps {
	programme: Programme;
	isSelected: boolean;
	onSelect: (id: ProgrammeType) => void;
}

export default function ProgrammeCard({
	programme,
	isSelected,
	onSelect,
}: ProgrammeCardProps) {
	return (
		<button
			type="button"
			onClick={() => onSelect(programme.id)}
			className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all duration-200
        ${
					isSelected
						? "border-[#3d5a9e] bg-white shadow-md shadow-[#3d5a9e]/10"
						: "border-[#c8d8ec] bg-[#f0f5fb] hover:border-[#9ab0cc] hover:bg-white"
				}`}
		>
			{/* Custom checkbox */}
			<div
				className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
          ${isSelected ? "border-[#3d5a9e] bg-[#3d5a9e]" : "border-[#c8d8ec] bg-white"}`}
			>
				{isSelected && (
					<svg width="12" height="10" viewBox="0 0 12 10" fill="none">
						<path
							d="M1 5L4.5 8.5L11 1.5"
							stroke="white"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				)}
			</div>

			{/* Text */}
			<div>
				<p
					className={`text-sm font-semibold leading-tight ${
						isSelected ? "text-[#0d1b3e]" : "text-[#2d3f6b]"
					}`}
				>
					{programme.label}
				</p>
				<p className="text-xs text-[#8a9ab5] mt-0.5 leading-relaxed">
					{programme.description}
				</p>
			</div>
		</button>
	);
}
