"use client";

import {
	forgotPasswordSchema,
	resetPasswordSchema,
	toFieldErrors,
	type ForgotPasswordInput,
	type ResetPasswordInput,
} from "@/lib/validation";
import {
	requestPasswordReset,
	resetPasswordWithCode,
} from "@/lib/services/auth.service";
import { toast } from "@/lib/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthPasswordField from "./AuthPasswordField";
import AuthSubmitButton from "./AuthSubmitButton";
import AuthTextField from "./AuthTextField";
import {
	formatResetResendTime,
	getNextResetResendDelay,
	getResetResendStorageKey,
	readResetResendSnapshot,
	writeResetResendSnapshot,
} from "./reset-resend-cooldown";

const initialForm: ForgotPasswordInput = {
	email: "",
};

const initialResetForm: ResetPasswordInput = {
	code: "",
	password: "",
	confirmPassword: "",
};

type ForgotPasswordFormProps = {
	audience?: "student" | "staff";
};

export default function ForgotPasswordForm({
	audience = "student",
}: ForgotPasswordFormProps) {
	const router = useRouter();
	const [form, setForm] = useState<ForgotPasswordInput>(initialForm);
	const [errors, setErrors] = useState<
		Partial<Record<keyof ForgotPasswordInput, string>>
	>({});
	const [resetForm, setResetForm] = useState<ResetPasswordInput>(initialResetForm);
	const [resetErrors, setResetErrors] = useState<
		Partial<Record<keyof ResetPasswordInput, string>>
	>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isResending, setIsResending] = useState(false);
	const [otpSent, setOtpSent] = useState(false);
	const [resendSendCount, setResendSendCount] = useState(0);
	const [resendAvailableAt, setResendAvailableAt] = useState(0);
	const [now, setNow] = useState(0);

	const resendRemainingMs = Math.max(0, resendAvailableAt - now);
	const canResend =
		otpSent && resendRemainingMs === 0 && !isSubmitting && !isResending;
	const signInPath = audience === "staff" ? "/staff/signin" : "/signin";

	useEffect(() => {
		if (!otpSent || !form.email) {
			return;
		}

		const key = getResetResendStorageKey(form.email, audience);
		const snapshot = readResetResendSnapshot(key);

		if (snapshot) {
			setResendSendCount(snapshot.sendCount);
			setResendAvailableAt(snapshot.availableAt);
		}

		setNow(Date.now());
		const intervalId = window.setInterval(() => setNow(Date.now()), 1000);

		return () => window.clearInterval(intervalId);
	}, [audience, form.email, otpSent]);

	function scheduleResendCooldown(email: string, nextSendCount: number) {
		const availableAt = Date.now() + getNextResetResendDelay(nextSendCount);
		const snapshot = {
			sendCount: nextSendCount,
			availableAt,
		};

		setResendSendCount(snapshot.sendCount);
		setResendAvailableAt(snapshot.availableAt);
		setNow(Date.now());
		writeResetResendSnapshot(
			getResetResendStorageKey(email, audience),
			snapshot,
		);
	}

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
				toast.error({
					title: "Enter a valid email",
					description: "Use the email linked to this portal account.",
				});
				setErrors(toFieldErrors<keyof ForgotPasswordInput>(result.error));
				return;
			}

			setErrors({});
			const resendKey = getResetResendStorageKey(result.data.email, audience);
			const existingResend = readResetResendSnapshot(resendKey);
			const currentTime = Date.now();

			if (existingResend && existingResend.availableAt > currentTime) {
				setOtpSent(true);
				setResendSendCount(existingResend.sendCount);
				setResendAvailableAt(existingResend.availableAt);
				setNow(currentTime);
				toast.info({
					title: "Reset code already sent",
					description: `You can request another in ${formatResetResendTime(
						existingResend.availableAt - currentTime,
					)}.`,
				});
				return;
			}

			setIsSubmitting(true);
			try {
				await requestPasswordReset(result.data.email);
			} catch {
				setIsSubmitting(false);
				toast.error({
					title: "Could not send reset code",
					description: "Please check SMTP settings and try again.",
				});
				return;
			}
			setIsSubmitting(false);
			setOtpSent(true);
			scheduleResendCooldown(
				result.data.email,
				(existingResend?.sendCount ?? 0) + 1,
			);
			toast.success({
				title: "Reset code sent",
				description:
					audience === "staff"
						? "Check your staff email and use the latest code."
						: "Check your email and use the latest code.",
			});
			return;
		}

		const result = resetPasswordSchema.safeParse(resetForm);

		if (!result.success) {
			toast.error({
				title: "Check reset details",
				description: "Enter the reset code and matching password values.",
			});
			setResetErrors(toFieldErrors<keyof ResetPasswordInput>(result.error));
			return;
		}

		setResetErrors({});
		setIsSubmitting(true);
		try {
			await resetPasswordWithCode(result.data);
		} catch {
			setIsSubmitting(false);
			toast.error({
				title: "Invalid reset code",
				description: "Use the latest code from your most recent reset email.",
			});
			return;
		}
		setIsSubmitting(false);
		toast.success({
			title: "Password reset successfully",
			description:
				audience === "staff"
					? "Redirecting to staff sign in."
					: "Redirecting to student sign in.",
		});
		window.setTimeout(() => router.replace(signInPath), 900);
	}

	async function handleResendCode() {
		const result = forgotPasswordSchema.safeParse(form);

		if (!result.success || !canResend) {
			return;
		}

		setIsResending(true);
		try {
			await requestPasswordReset(result.data.email);
		} catch {
			setIsResending(false);
			toast.error({
				title: "Could not resend code",
				description: "Please try again in a moment.",
			});
			return;
		}

		const nextSendCount = Math.max(1, resendSendCount + 1);
		scheduleResendCooldown(result.data.email, nextSendCount);
		setResetForm((current) => ({ ...current, code: "" }));
		setIsResending(false);
		toast.success({
			title: "New reset code sent",
			description: "Use only the latest code from your email.",
		});
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
					hint={
						audience === "staff"
							? "Use the email issued for your staff portal access."
							: "Use the email linked to your applicant account."
					}
					onChange={handleChange}
				/>
			) : (
				<>
					<div className="rounded-lg border border-[#dce6f2] bg-[#f8fbff] px-3 py-2 text-xs font-medium text-[#5e718d]">
						Resetting password for <span className="font-bold text-[#0d1b3e]">{form.email}</span>
					</div>
					<AuthTextField
						label="Reset Code"
						name="code"
						value={resetForm.code}
						placeholder="Enter reset code"
						error={resetErrors.code}
						hint="Use the latest code from your most recent reset email."
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

			{otpSent && (
				<div className="flex flex-col gap-3 rounded-lg border border-[#dce6f2] bg-[#f8fbff] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B7770D]">
							Latest code only
						</p>
						<p className="mt-1 text-xs font-medium text-[#526987]">
							Resending creates a new code and expires the previous one.
						</p>
					</div>
					<button
						type="button"
						onClick={handleResendCode}
						disabled={!canResend}
						className="rounded-lg border border-[#B7770D]/35 bg-white px-4 py-2 text-xs font-bold text-[#0d3268] shadow-sm transition hover:border-[#B7770D] hover:text-[#B7770D] disabled:cursor-not-allowed disabled:border-[#dce6f2] disabled:bg-[#eef4fb] disabled:text-[#7f90aa]"
					>
						{isResending
							? "Sending..."
							: resendRemainingMs > 0
								? `Resend in ${formatResetResendTime(resendRemainingMs)}`
								: "Resend code"}
					</button>
				</div>
			)}

			<AuthSubmitButton isSubmitting={isSubmitting}>
				{otpSent ? "Update Password" : "Send Reset Email"}
			</AuthSubmitButton>

			<p className="text-center text-xs text-[#6f7f98]">
				Remembered your password?{" "}
				<Link
					href={audience === "staff" ? "/staff/signin" : "/signin"}
					className="font-bold text-[#B7770D] hover:underline"
				>
					Back to sign in
				</Link>
			</p>
		</form>
	);
}
