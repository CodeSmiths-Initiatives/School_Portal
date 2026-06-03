"use client";

import {
	resetPasswordSchema,
	toFieldErrors,
	type ResetPasswordInput,
} from "@/lib/validation";
import { resetPasswordWithCode } from "@/lib/services/auth.service";
import { toast } from "@/lib/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthPasswordField from "./AuthPasswordField";
import AuthSubmitButton from "./AuthSubmitButton";
import AuthTextField from "./AuthTextField";

const initialForm: ResetPasswordInput = {
	code: "",
	password: "",
	confirmPassword: "",
};

export default function ResetPasswordForm() {
	const router = useRouter();
	const [form, setForm] = useState<ResetPasswordInput>(initialForm);
	const [errors, setErrors] = useState<Partial<Record<keyof ResetPasswordInput, string>>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [signInPath, setSignInPath] = useState("/signin");

	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search);
		const code = searchParams.get("code");
		const audience = searchParams.get("audience");

		if (code) {
			setForm((current) => ({ ...current, code }));
		}

		if (audience === "staff") {
			setSignInPath("/staff/signin");
		}
	}, []);

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
			toast.error({
				title: "Check reset details",
				description: "Enter the reset code and matching password values.",
			});
			setErrors(toFieldErrors<keyof ResetPasswordInput>(result.error));
			return;
		}

		setErrors({});
		setIsSubmitting(true);
		try {
			await resetPasswordWithCode(result.data);
		} catch {
			setIsSubmitting(false);
			toast.error({
				title: "Invalid reset code",
				description: "Request a new password reset email and try again.",
			});
			return;
		}
		setIsSubmitting(false);
		toast.success({
			title: "Password reset successfully",
			description: "Redirecting to sign in.",
		});
		window.setTimeout(() => router.replace(signInPath), 900);
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

			<AuthSubmitButton isSubmitting={isSubmitting}>Reset Password</AuthSubmitButton>

			<p className="text-center text-xs text-[#6f7f98]">
				Need a new reset code?{" "}
				<Link
					href={signInPath === "/staff/signin" ? "/staff/forgot-password" : "/forgot-password"}
					className="font-bold text-[#B7770D] hover:underline"
				>
					Request another
				</Link>
			</p>
		</form>
	);
}
