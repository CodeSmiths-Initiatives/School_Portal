"use client";

import { Input } from "@/components/ui/input";
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
	const [form, setForm] = useState<CreateAccountFormData>({
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
		agreeToTerms: false,
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;
		setForm((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onNext(form);
	};

	return (
		<div className="bg-white rounded-2xl shadow-sm border border-[#e4eaf4] p-8 w-full max-w-2xl mx-auto">
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
			<p className="text-[#808B96] text-sm font-semibold mb-8">
				Set up your applicant credentials to get started with the application
				process.
			</p>

			<form onSubmit={handleSubmit} className="flex flex-col gap-5">
				{/* Username */}
				<div>
					<label className="block text-xs font-bold tracking-widest text-[#1a2a4a] uppercase mb-1.5">
						Username
					</label>
					<Input
						type="text"
						name="username"
						value={form.username}
						onChange={handleChange}
						placeholder="e.g john.doe2025"
						className="inputClass"
						required
					/>
					<p className="text-[#808B96] text-xs font-semibold mt-1">
						Choose a unique username (letters, numbers, dots)
					</p>
				</div>

				{/* Email */}
				<div>
					<label className="block text-xs font-bold tracking-widest text-[#1a2a4a] uppercase mb-1.5">
						Email Address
					</label>
					<Input
						type="email"
						name="email"
						value={form.email}
						onChange={handleChange}
						placeholder="Your@email.com"
						className="inputClass"
						required
					/>
				</div>

				{/* Password */}
				<div>
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
							className={`${"inputClass"} pr-16`}
							required
						/>
						<button
							type="button"
							onClick={() => setShowPassword((v) => !v)}
							className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#4a6fa5] hover:text-[#c9922a] transition"
						>
							{showPassword ? "Hide" : "Show"}
						</button>
					</div>
					<p className="text-[#808B96] text-xs font-semibold mt-1">
						Use 8+ characters with numbers and symbols
					</p>
				</div>

				{/* Confirm Password */}
				<div>
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
							className={`${"inputClass"} pr-16`}
							required
						/>
						<button
							type="button"
							onClick={() => setShowConfirm((v) => !v)}
							className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#4a6fa5] hover:text-[#c9922a] transition"
						>
							{showConfirm ? "Hide" : "Show"}
						</button>
					</div>
				</div>

				{/* Terms */}
				<div className="flex items-start gap-3">
					<Input
						type="checkbox"
						name="agreeToTerms"
						id="terms"
						checked={form.agreeToTerms}
						onChange={handleChange}
						className="mt-0.5 w-4 h-4 accent-[#4a6fa5] shrink-0"
						required
					/>
					<label
						htmlFor="terms"
						className="text-xs text-gray-400 leading-relaxed"
					>
						I agree to the{" "}
						<a
							href="#"
							className="text-[#B7770D] hover:underline font-semibold"
						>
							Terms &amp; Conditions
						</a>{" "}
						and{" "}
						<a
							href="#"
							className="text-[#B7770D] hover:underline font-semibold"
						>
							Privacy Policy
						</a>{" "}
						of the university admissions portal
					</label>
				</div>

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
					<a
						href="#"
						className="text-[#B7770D] font-semibold hover:text-[#c9922a] transition"
					>
						Sign in
					</a>
				</p>
			</form>
		</div>
	);
}
