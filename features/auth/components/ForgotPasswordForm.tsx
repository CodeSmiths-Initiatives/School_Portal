"use client";

import {
	forgotPasswordSchema,
	resetPasswordSchema,
	toFieldErrors,
	type ForgotPasswordInput,
	type ResetPasswordInput,
} from "@/lib/validation";
import Link from "next/link";
import { useState } from "react";
import AuthPasswordField from "./AuthPasswordField";
import AuthSubmitButton from "./AuthSubmitButton";
import AuthTextField from "./AuthTextField";

const initialForm: ForgotPasswordInput = {
	email: "",
};

const initialResetForm: ResetPasswordInput = {
	code: "",
	password: "",
	confirmPassword: "",
};

export default function ForgotPasswordForm() {
	const [form, setForm] = useState<ForgotPasswordInput>(initialForm);
	const [errors, setErrors] = useState<
		Partial<Record<keyof ForgotPasswordInput, string>>
	>({});
	const [resetForm, setResetForm] = useState<ResetPasswordInput>(initialResetForm);
	const [resetErrors, setResetErrors] = useState<
		Partial<Record<keyof ResetPasswordInput, string>>
	>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [success, setSuccess] = useState("");
	const [otpSent, setOtpSent] = useState(false);

	function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
		const { name, value } = event.target;
		const field = name as keyof ForgotPasswordInput;
		setForm((current) => ({ ...current, [field]: value }));
		if (errors[field]) {
			setErrors((current) => ({ ...current, [field]: undefined }));
		}
	}

	function handleResetChange(event: React.ChangeEvent<HTMLInputElement>) {
		const { name, value } = event.target;
		const field = name as keyof ResetPasswordInput;
		setResetForm((current) => ({ ...current, [field]: value }));
		if (resetErrors[field]) {
			setResetErrors((current) => ({ ...current, [field]: undefined }));
		}
	}

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();

		if (!otpSent) {
			const result = forgotPasswordSchema.safeParse(form);

			if (!result.success) {
				setSuccess("");
				setErrors(toFieldErrors<keyof ForgotPasswordInput>(result.error));
				return;
			}

			setErrors({});
			setIsSubmitting(true);
			await new Promise((resolve) => setTimeout(resolve, 500));
			setIsSubmitting(false);
			setOtpSent(true);
			setSuccess("OTP sent. Set your new password below.");
			return;
		}

		const result = resetPasswordSchema.safeParse(resetForm);

		if (!result.success) {
			setSuccess("");
			setResetErrors(toFieldErrors<keyof ResetPasswordInput>(result.error));
			return;
		}

		setResetErrors({});
		setIsSubmitting(true);
		await new Promise((resolve) => setTimeout(resolve, 500));
		setIsSubmitting(false);
		setSuccess("Password validated. Strapi reset endpoint can be connected next.");
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
			{!otpSent ? (
				<AuthTextField
					label="Email Address"
					name="email"
					type="email"
					value={form.email}
					placeholder="you@example.com"
					error={errors.email}
					hint="Use the email linked to your applicant account."
					onChange={handleChange}
				/>
			) : (
				<>
					<div className="rounded-lg border border-[#dce6f2] bg-[#f8fbff] px-3 py-2 text-xs font-medium text-[#5e718d]">
						Resetting password for <span className="font-bold text-[#0d1b3e]">{form.email}</span>
					</div>
					<AuthTextField
						label="OTP Code"
						name="code"
						value={resetForm.code}
						placeholder="Enter OTP"
						error={resetErrors.code}
						hint="Use the OTP sent to your email."
						onChange={handleResetChange}
					/>
					<AuthPasswordField
						label="New Password"
						name="password"
						value={resetForm.password}
						placeholder="Create new password"
						error={resetErrors.password}
						hint="Use 8-15 characters with uppercase, number, and special character."
						onChange={handleResetChange}
					/>
					<AuthPasswordField
						label="Confirm Password"
						name="confirmPassword"
						value={resetForm.confirmPassword}
						placeholder="Repeat new password"
						error={resetErrors.confirmPassword}
						onChange={handleResetChange}
					/>
				</>
			)}

			{success && (
				<p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
					{success}
				</p>
			)}

			<AuthSubmitButton isSubmitting={isSubmitting}>
				{otpSent ? "Update Password" : "Send OTP"}
			</AuthSubmitButton>

			<p className="text-center text-xs text-[#6f7f98]">
				Remembered your password?{" "}
				<Link href="/signin" className="font-bold text-[#B7770D] hover:underline">
					Back to sign in
				</Link>
			</p>
		</form>
	);
}
