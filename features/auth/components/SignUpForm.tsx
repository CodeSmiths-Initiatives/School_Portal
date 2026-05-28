"use client";

import FieldFeedback from "@/components/forms/FieldFeedback";
import {
	createAccountSchema,
	toFieldErrors,
	type CreateAccountInput,
} from "@/lib/validation";
import Link from "next/link";
import { useState } from "react";
import AuthPasswordField from "./AuthPasswordField";
import AuthSubmitButton from "./AuthSubmitButton";
import AuthTextField from "./AuthTextField";

const initialForm: CreateAccountInput = {
	username: "",
	email: "",
	password: "",
	confirmPassword: "",
	agreeToTerms: true,
};

export default function SignUpForm() {
	const [form, setForm] = useState<CreateAccountInput>(initialForm);
	const [errors, setErrors] = useState<Partial<Record<keyof CreateAccountInput, string>>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [success, setSuccess] = useState("");

	function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
		const { name, value, type, checked } = event.target;
		const field = name as keyof CreateAccountInput;
		setForm((current) => ({
			...current,
			[field]: type === "checkbox" ? checked : value,
		}));
		if (errors[field]) {
			setErrors((current) => ({ ...current, [field]: undefined }));
		}
	}

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		const result = createAccountSchema.safeParse(form);

		if (!result.success) {
			setSuccess("");
			setErrors(toFieldErrors<keyof CreateAccountInput>(result.error));
			return;
		}

		setErrors({});
		setIsSubmitting(true);
		await new Promise((resolve) => setTimeout(resolve, 500));
		setIsSubmitting(false);
		setSuccess("Account details validated. Strapi registration can be connected next.");
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
			<AuthTextField
				label="Username"
				name="username"
				value={form.username}
				placeholder="e.g john.doe2027"
				error={errors.username}
				hint="Letters, numbers, dots, underscores, or hyphens."
				onChange={handleChange}
			/>
			<AuthTextField
				label="Email Address"
				name="email"
				type="email"
				value={form.email}
				placeholder="you@example.com"
				error={errors.email}
				onChange={handleChange}
			/>
			<AuthPasswordField
				label="Password"
				name="password"
				value={form.password}
				placeholder="Create password"
				error={errors.password}
				hint="Use 8-15 characters with uppercase, number, and special character."
				onChange={handleChange}
			/>
			<AuthPasswordField
				label="Confirm Password"
				name="confirmPassword"
				value={form.confirmPassword}
				placeholder="Repeat password"
				error={errors.confirmPassword}
				onChange={handleChange}
			/>

			<label className="flex items-start gap-3 text-xs font-medium leading-5 text-[#6f7f98]">
				<input
					type="checkbox"
					name="agreeToTerms"
					checked={form.agreeToTerms}
					onChange={handleChange}
					className="mt-1 size-4 shrink-0 accent-[#2E86C1]"
				/>
				<span>
					I agree to the admission portal terms and privacy policy.
				</span>
			</label>
			<FieldFeedback message={errors.agreeToTerms} />

			{success && (
				<p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
					{success}
				</p>
			)}

			<AuthSubmitButton isSubmitting={isSubmitting}>Create Account</AuthSubmitButton>

			<p className="text-center text-xs text-[#6f7f98]">
				Already registered?{" "}
				<Link href="/" className="font-bold text-[#B7770D] hover:underline">
					Continue admission
				</Link>
			</p>
		</form>
	);
}
