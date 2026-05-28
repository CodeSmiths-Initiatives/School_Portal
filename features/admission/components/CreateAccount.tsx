"use client";

import FieldFeedback from "@/components/forms/FieldFeedback";
import { Input } from "@/components/ui/input";
import { createAccountSchema, toFieldErrors } from "@/lib/validation";
import Link from "next/link";
import { useState } from "react";

export interface CreateAccountFormData {
	username: string;
	email: string;
	password: string;
	confirmPassword: string;
	agreeToTerms: boolean;
}

interface CreateAccountFormProps {
	onNext: (data: CreateAccountFormData) => void;
}

export default function CreateAccount({ onNext }: CreateAccountFormProps) {
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [errors, setErrors] = useState<
		Partial<Record<keyof CreateAccountFormData, string>>
	>({});
	const [form, setForm] = useState<CreateAccountFormData>({
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
		agreeToTerms: false,
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;
		const field = name as keyof CreateAccountFormData;
		setForm((prev) => ({
			...prev,
			[field]: type === "checkbox" ? checked : value,
		}));
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const result = createAccountSchema.safeParse(form);

		if (!result.success) {
			setErrors(
				toFieldErrors<keyof CreateAccountFormData>(result.error),
			);
			return;
		}

		setErrors({});
		onNext(result.data);
	};

	return (
		<div className="surface-card mx-auto w-full max-w-2xl p-5 shadow-xl shadow-[#d9e4f2]/55 sm:p-6 lg:p-8">
			{/* Progress bar */}
			<div className="mb-6">
				<div className="h-2 w-full bg-[#e4eaf4] rounded-full overflow-hidden">
					<div className="h-full w-1/4 bg-[#B7770D] rounded-full transition-all duration-500" />
				</div>
			</div>

			{/* Step label */}
			<p className="text-[#B7770D] text-xs font-bold tracking-wide uppercase mb-2">
				Step 1 of 4
			</p>
			<h3 className="text-[#0d1b3e] text-2xl font-semibold italic mb-1">
				Create Your Account
			</h3>
			<p className="mb-6 text-sm font-semibold text-[#808B96] sm:mb-8">
				Set up your applicant credentials to get started with the application
				process.
			</p>

			<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
				{/* Username */}
				<div className="rounded-lg transition-colors focus-within:bg-[#f8fbff]">
					<label className="block text-xs font-bold tracking-widest text-[#1a2a4a] uppercase mb-1.5">
						Username
					</label>
					<Input
						type="text"
						name="username"
						value={form.username}
						onChange={handleChange}
						placeholder="e.g john.doe2025"
						aria-invalid={Boolean(errors.username)}
						aria-describedby="username-feedback"
						className={`inputClass ${errors.username ? "inputError" : ""}`}
					/>
					<FieldFeedback
						id="username-feedback"
						message={errors.username}
						hint="Choose a unique username using letters, numbers, dots, underscores, or hyphens."
					/>
				</div>

				{/* Email */}
				<div className="rounded-lg transition-colors focus-within:bg-[#f8fbff]">
					<label className="block text-xs font-bold tracking-widest text-[#1a2a4a] uppercase mb-1.5">
						Email Address
					</label>
					<Input
						type="email"
						name="email"
						value={form.email}
						onChange={handleChange}
						placeholder="Your@email.com"
						aria-invalid={Boolean(errors.email)}
						aria-describedby="email-feedback"
						className={`inputClass ${errors.email ? "inputError" : ""}`}
					/>
					<FieldFeedback id="email-feedback" message={errors.email} />
				</div>

				{/* Password */}
				<div className="rounded-lg transition-colors focus-within:bg-[#f8fbff]">
					<label className="block text-xs font-bold tracking-widest text-[#1a2a4a] uppercase mb-1.5">
						Password
					</label>
					<div className="relative">
						<Input
							type={showPassword ? "text" : "password"}
							name="password"
							value={form.password}
							onChange={handleChange}
							placeholder="Create a strong password"
							aria-invalid={Boolean(errors.password)}
							aria-describedby="password-feedback"
							className={`inputClass pr-16 ${errors.password ? "inputError" : ""}`}
						/>
						<button
							type="button"
							onClick={() => setShowPassword((v) => !v)}
							className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#4a6fa5] hover:text-[#c9922a] transition"
						>
							{showPassword ? "Hide" : "Show"}
						</button>
					</div>
					<FieldFeedback
						id="password-feedback"
						message={errors.password}
						hint="Use 8-15 characters with uppercase, number, and special character."
					/>
				</div>

				{/* Confirm Password */}
				<div className="rounded-lg transition-colors focus-within:bg-[#f8fbff]">
					<label className="block text-xs font-bold tracking-widest text-[#1a2a4a] uppercase mb-1.5">
						Confirm Password
					</label>
					<div className="relative">
						<Input
							type={showConfirm ? "text" : "password"}
							name="confirmPassword"
							value={form.confirmPassword}
							onChange={handleChange}
							placeholder="Re-enter your password"
							aria-invalid={Boolean(errors.confirmPassword)}
							aria-describedby="confirm-password-feedback"
							className={`inputClass pr-16 ${errors.confirmPassword ? "inputError" : ""}`}
						/>
						<button
							type="button"
							onClick={() => setShowConfirm((v) => !v)}
							className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#4a6fa5] hover:text-[#c9922a] transition"
						>
							{showConfirm ? "Hide" : "Show"}
						</button>
					</div>
					<FieldFeedback
						id="confirm-password-feedback"
						message={errors.confirmPassword}
					/>
				</div>

				{/* Terms */}
				<div className="flex items-start gap-3 rounded-lg transition-colors focus-within:bg-[#f8fbff]">
					<Input
						type="checkbox"
						name="agreeToTerms"
						id="terms"
						checked={form.agreeToTerms}
						onChange={handleChange}
						aria-invalid={Boolean(errors.agreeToTerms)}
						aria-describedby="terms-feedback"
						className="mt-0.5 w-4 h-4 accent-[#4a6fa5] shrink-0"
					/>
					<label htmlFor="terms" className="text-xs text-gray-400 leading-relaxed">
						I agree to the{" "}
						<Link href="#" className="text-[#B7770D] hover:underline font-semibold">
							Terms &amp; Conditions
						</Link>{" "}
						and{" "}
						<Link href="#" className="text-[#B7770D] hover:underline font-semibold">
							Privacy Policy
						</Link>{" "}
						of the university admissions portal
					</label>
				</div>
				<FieldFeedback
					id="terms-feedback"
					message={errors.agreeToTerms}
				/>

				{/* CTA */}
				<button
					type="submit"
					className="w-full bg-[#2E86C1] hover:bg-[#3a5f95] active:bg-[#2a4f85] text-white font-semibold text-sm tracking-wide rounded-lg py-3.5 transition-colors duration-200 mt-1"
				>
					Continue to Programme Selection
				</button>

				{/* Sign in link */}
				<p className="text-center text-xs text-[#8899bb]">
					Already have an account?{" "}
					<Link
						href="/signin"
						className="text-[#B7770D] font-semibold hover:text-[#c9922a] transition"
					>
						Sign in
					</Link>
				</p>
			</form>
		</div>
	);
}
