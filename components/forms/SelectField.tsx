"use client";

import { FaChevronDown } from "react-icons/fa6";

interface SelectOption {
	value: string;
	label: string;
}

interface SelectFieldProps {
	label: string;
	value: string;
	options: SelectOption[];
	placeholder?: string;
	required?: boolean;
	error?: string;
	onChange: (value: string) => void;
}

export default function SelectField({
	label,
	value,
	options,
	placeholder = "--- Select ---",
	required,
	error,
	onChange,
}: SelectFieldProps) {
	return (
		<div className="flex flex-col gap-2">
			<label className="text-sm font-semibold tracking-tight text-gray-800 uppercase">
				{label}
				{required && <span className="text-[#c9952a] ml-0.5">*</span>}
			</label>
			<div className="relative">
				<select
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className={`w-full appearance-none border-2 border-gray-300 rounded-sm px-4 py-3.5 text-sm bg-white outline-none
            transition-all cursor-pointer pr-10
            focus:border-[#c9952a] focus:ring-2 focus:ring-[#c9952a]/20 focus:bg-white
            ${value ? "text-[#1a2b52] font-medium" : "text-[#a0aec0]"}
            ${error ? "border-red-400 bg-red-50" : "border-[#c8d8ec] bg-[#f0f5fb]"}`}
				>
					<option value="" disabled>
						{placeholder}
					</option>
					{options.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
				<FaChevronDown
					size={15}
					className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8a9ab5] pointer-events-none"
				/>
			</div>
			{error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
		</div>
	);
}
