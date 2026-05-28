"use client";

import FieldFeedback from "@/components/forms/FieldFeedback";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type AuthPasswordFieldProps = {
	label: string;
	name: string;
	value: string;
	placeholder?: string;
	error?: string;
	hint?: string;
	onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function AuthPasswordField({
	label,
	name,
	value,
	placeholder,
	error,
	hint,
	onChange,
}: AuthPasswordFieldProps) {
	const [isVisible, setIsVisible] = useState(false);
	const feedbackId = `${name}-feedback`;

	return (
		<div>
			<label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[#1a2a4a]">
				{label}
			</label>
			<div className="relative">
				<Input
					type={isVisible ? "text" : "password"}
					name={name}
					value={value}
					onChange={onChange}
					placeholder={placeholder}
					aria-invalid={Boolean(error)}
					aria-describedby={feedbackId}
					className={`inputClass pr-12 ${error ? "inputError" : ""}`}
				/>
				<button
					type="button"
					onClick={() => setIsVisible((value) => !value)}
					className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-[#4a6fa5] transition hover:bg-white/50 hover:text-[#B7770D]"
					aria-label={isVisible ? "Hide password" : "Show password"}
				>
					{isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
				</button>
			</div>
			<FieldFeedback id={feedbackId} message={error} hint={hint} />
		</div>
	);
}
