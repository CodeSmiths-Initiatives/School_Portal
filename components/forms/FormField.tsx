"use client";

import { InputHTMLAttributes, ReactNode } from "react";
import { Input } from "../ui/input";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
	label: string;
	required?: boolean;
	error?: string;
	hint?: string;
	rightElement?: ReactNode;
}

export default function FormField({
	label,
	required,
	error,
	hint,
	rightElement,
	className = "",
	...props
}: FormFieldProps) {
	return (
		<div className="flex flex-col gap-2">
			<label className="text-sm font-semibold tracking-tight text-gray-800 uppercase">
				{label}
				{required && <span className="text-[#B7770B] ml-0.5">*</span>}
			</label>
			<div className="relative flex items-center">
				<Input
					{...props}
					className={`w-full border-2 border-gray-500 rounded-sm px-4 py-6 text-sm text-[#1a2b52] bg-white
            placeholder:text-gray-400 outline-none transition-all
            focus:bg-white focus:border-[#c9952a] focus:ring-2 focus:ring-[#c9952a]/15
            ${error ? "border-red-400 bg-red-50" : "border-[#bcc2ca]"}
            ${rightElement ? "pr-12" : ""} ${className}`}
				/>
				{rightElement && (
					<div className="absolute right-3 flex items-center">
						{rightElement}
					</div>
				)}
			</div>
			{hint && !error && <p className="text-[11px] text-[#8a9ab5]">{hint}</p>}
			{error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
		</div>
	);
}
