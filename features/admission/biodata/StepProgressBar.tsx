"use client";

import { BioStep } from "../types/biostep.types";
import { STEPS } from "../utils/bioData";

interface StepProgressBarProps {
	currentStep: BioStep;
	onStepClick: (step: BioStep) => void;
}

export default function StepProgressBar({
	currentStep,
	onStepClick,
}: StepProgressBarProps) {
	return (
		<div className="bg-[#15295a] border border-[#c9952a]/40 rounded-2xl px-20 py-5 mb-6">
			<div className="flex items-center justify-between relative">
				{STEPS.map((step) => {
					const isDone = step.number < currentStep;
					const isActive = step.number === currentStep;
					return (
						<button
							key={step.number}
							type="button"
							onClick={() => isDone && onStepClick(step.number as BioStep)}
							className={`flex flex-col items-center gap-2 z-10 transition-all ${isDone ? "cursor-pointer" : "cursor-default"}`}
						>
							<div
								className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border transition-all
                  ${
										isActive
											? "bg-[#c9952a] border-[#c9952a] text-black shadow-lg shadow-[#c9952a]/40"
											: isDone
												? "bg-[#148F77] border-[#148F77] text-white"
												: "bg-transparent border-[#B7770D] text-white"
									}`}
							>
								{isDone ? (
									<svg width="14" height="12" viewBox="0 0 14 12" fill="none">
										<path
											d="M1 6L5 10L13 1"
											stroke="#c9952a"
											strokeWidth="2.5"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								) : (
									step.number
								)}
							</div>
							<span
								className={`text-[12px] font-bold tracking-wide uppercase whitespace-nowrap
                  ${isActive ? "text-[#c9952a]" : isDone ? "text-[#1AFFD2]" : "text-white"}`}
							>
								{step.label}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
