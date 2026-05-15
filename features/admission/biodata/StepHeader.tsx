"use client";

import { BookOpen, FileCheck } from "lucide-react";
import { BioStep } from "../types/biostep.types";
import { IoPersonSharp } from "react-icons/io5";
import { MdCall } from "react-icons/md";
import { RiGraduationCapFill } from "react-icons/ri";

const STEP_META: Record<
	BioStep,
	{ icon: React.ReactNode; title: string; subtitle: string }
> = {
	1: {
		icon: <IoPersonSharp size={32} color="#8153E1" />,
		title: "Personal Bio Data",
		subtitle: "Enter your personal details exactly as on official documents",
	},
	2: {
		icon: <MdCall size={32} color="red" />,
		title: "Contact & Guardian Information",
		subtitle: "Provide accurate contact details for correspondence",
	},
	3: {
		icon: <BookOpen size={32} />,
		title: "O-Level Result Validation",
		subtitle: "Select your subject category and enter your WAEC/NECO grades",
	},
	4: {
		icon: <RiGraduationCapFill size={32} color="#3E3276" />,
		title: "Programme Of Study",
		subtitle: "Select your preferred course and JAMB information",
	},
	5: {
		icon: <FileCheck size={32} color="#3E3276" />,
		title: "Declaration",
		subtitle: "Review and confirm all information before final submission",
	},
};

export default function StepHeader({ step }: { step: BioStep }) {
	const meta = STEP_META[step];
	return (
		<div className="bg-[#15295a] px-12 py-8 border border-[#c9952a]/10 rounded-t-2xl rounded-x-2xl flex items-center gap-6">
			<div className="w-12 h-12 rounded-xl bg-[#c9952a]/20 border border-[#c9952a]/40 flex items-center justify-between text-[#c9952a] shrink-0">
				<h3>{meta.icon}</h3>
			</div>
			<div>
				<h2 className=" text-gray-200 text-2xl font-semibold tracking-wide">
					{meta.title}
				</h2>
				<p className="text-gray-200 font-semibold text-sm mt-0.5">
					{meta.subtitle}
				</p>
			</div>
		</div>
	);
}
