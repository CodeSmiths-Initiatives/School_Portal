"use client";

import { loginSchema, toFieldErrors, type LoginInput } from "@/lib/validation";
import Link from "next/link";
import { useState } from "react";
import AuthPasswordField from "./AuthPasswordField";
import AuthSubmitButton from "./AuthSubmitButton";
import AuthTextField from "./AuthTextField";

const initialForm: LoginInput = {
	identifier: "",
	password: "",
};

export default function SignInForm() {
	const [form, setForm] = useState<LoginInput>(initialForm);
	const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>(
		{},
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [success, setSuccess] = useState("");

	function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
		const { name, value } = event.target;
		const field = name as keyof LoginInput;
		setForm((current) => ({ ...current, [field]: value }));
		if (errors[field]) {
			setErrors((current) => ({ ...current, [field]: undefined }));
		}
	}

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		const result = loginSchema.safeParse(form);

		if (!result.success) {
			setSuccess("");
			setErrors(toFieldErrors<keyof LoginInput>(result.error));
			return;
		}

		setErrors({});
		setIsSubmitting(true);
		await new Promise((resolve) => setTimeout(resolve, 500));
		setIsSubmitting(false);
		setSuccess("Credentials validated. Strapi sign-in can be connected next.");
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
			<AuthTextField
				label="Email or Username"
				name="identifier"
				value={form.identifier}
				placeholder="you@example.com"
				error={errors.identifier}
				hint="Use the email or username linked to your portal account."
				onChange={handleChange}
			/>
			<AuthPasswordField
				label="Password"
				name="password"
				value={form.password}
				placeholder="Enter password"
				error={errors.password}
				onChange={handleChange}
			/>

			<div className="flex items-center justify-end">
				<Link
					href="/forgot-password"
					className="text-xs font-semibold text-[#B7770D] transition hover:underline"
				>
					Forgot password?
				</Link>
			</div>

			{success && (
				<p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
					{success}
				</p>
			)}

			<AuthSubmitButton isSubmitting={isSubmitting}>Sign In</AuthSubmitButton>

			<p className="text-center text-xs text-[#6f7f98]">
				Need a new account?{" "}
				<Link href="/" className="font-bold text-[#B7770D] hover:underline">
					Continue admission
				</Link>
			</p>
		</form>
	);
}
