"use client";

import {
	resetPasswordSchema,
	toFieldErrors,
	type ResetPasswordInput,
} from "@/lib/validation";
import Link from "next/link";
import { useState } from "react";
import AuthPasswordField from "./AuthPasswordField";
import AuthSubmitButton from "./AuthSubmitButton";
import AuthTextField from "./AuthTextField";

const initialForm: ResetPasswordInput = {
	code: "",
	password: "",
	confirmPassword: "",
};

export default function ResetPasswordForm() {
	const [form, setForm] = useState<ResetPasswordInput>(initialForm);
	const [errors, setErrors] = useState<Partial<Record<keyof ResetPasswordInput, string>>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [success, setSuccess] = useState("");

	function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
		const { name, value } = event.target;
		const field = name as keyof ResetPasswordInput;
		setForm((current) => ({ ...current, [field]: value }));
		if (errors[field]) {
			setErrors((current) => ({ ...current, [field]: undefined }));
		}
	}

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		const result = resetPasswordSchema.safeParse(form);

		if (!result.success) {
			setSuccess("");
			setErrors(toFieldErrors<keyof ResetPasswordInput>(result.error));
			return;
		}

		setErrors({});
		setIsSubmitting(true);
		await new Promise((resolve) => setTimeout(resolve, 500));
		setIsSubmitting(false);
		setSuccess("Password validated. Strapi reset endpoint can be connected next.");
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
			<AuthTextField
				label="Reset Code"
				name="code"
				value={form.code}
				placeholder="Paste reset code"
				error={errors.code}
				hint="Use the code from your password reset email."
				onChange={handleChange}
			/>
			<AuthPasswordField
				label="New Password"
				name="password"
				value={form.password}
				placeholder="Create new password"
				error={errors.password}
				hint="Use 8-15 characters with uppercase, number, and special character."
				onChange={handleChange}
			/>
			<AuthPasswordField
				label="Confirm Password"
				name="confirmPassword"
				value={form.confirmPassword}
				placeholder="Repeat new password"
				error={errors.confirmPassword}
				onChange={handleChange}
			/>

			{success && (
				<p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
					{success}
				</p>
			)}

			<AuthSubmitButton isSubmitting={isSubmitting}>Reset Password</AuthSubmitButton>

			<p className="text-center text-xs text-[#6f7f98]">
				Need a new reset code?{" "}
				<Link
					href="/forgot-password"
					className="font-bold text-[#B7770D] hover:underline"
				>
					Request another
				</Link>
			</p>
		</form>
	);
}
