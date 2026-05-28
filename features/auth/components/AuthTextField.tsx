"use client";

import FieldFeedback from "@/components/forms/FieldFeedback";
import { Input } from "@/components/ui/input";

type AuthTextFieldProps = {
	label: string;
	name: string;
	value: string;
	type?: "text" | "email";
	placeholder?: string;
	error?: string;
	hint?: string;
	onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function AuthTextField({
	label,
	name,
	value,
	type = "text",
	placeholder,
	error,
	hint,
	onChange,
}: AuthTextFieldProps) {
	const feedbackId = `${name}-feedback`;

	return (
		<div>
			<label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[#1a2a4a]">
				{label}
			</label>
			<Input
				type={type}
				name={name}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				aria-invalid={Boolean(error)}
				aria-describedby={feedbackId}
				className={`inputClass ${error ? "inputError" : ""}`}
			/>
			<FieldFeedback id={feedbackId} message={error} hint={hint} />
		</div>
	);
}
