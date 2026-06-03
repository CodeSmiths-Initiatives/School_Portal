"use client";

import {
	COLLEGE_ROLE_LABELS,
	STAFF_ROLE_LABELS,
	type StaffRole,
} from "@/lib/auth";
import { loginThroughSessionRoute } from "@/lib/services/session.service";
import { useAuthStore } from "@/lib/store";
import { toast } from "@/lib/toast";
import { loginSchema, toFieldErrors, type LoginInput } from "@/lib/validation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthPasswordField from "./AuthPasswordField";
import AuthSubmitButton from "./AuthSubmitButton";
import AuthTextField from "./AuthTextField";

const initialForm: LoginInput = {
	identifier: "",
	password: "",
};

type SignInFormProps = {
	audience?: "student" | "staff";
};

export default function SignInForm({
	audience = "student",
}: SignInFormProps) {
	const router = useRouter();
	const [form, setForm] = useState<LoginInput>(initialForm);
	const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>(
		{},
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const setSessionSnapshot = useAuthStore((state) => state.setSessionSnapshot);

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
			toast.error({
				title: "Check sign-in details",
				description: "Complete the required fields before signing in.",
			});
			setErrors(toFieldErrors<keyof LoginInput>(result.error));
			return;
		}

		setErrors({});
		setIsSubmitting(true);
		const loginResult = await loginThroughSessionRoute(result.data, audience);
		setIsSubmitting(false);

		if (!loginResult.ok) {
			toast.error({
				title: "Sign in failed",
				description: loginResult.message,
			});
			return;
		}

		const { session } = loginResult;
		const destination = session.destination;
		setSessionSnapshot(session);
		toast.success({
			title: "Login successful",
			description:
				destination.domain === "superadmin"
					? "Redirecting to the superadmin dashboard."
					: destination.domain === "admin"
						? `Redirecting to the ${COLLEGE_ROLE_LABELS.admin} workspace.`
						: destination.domain === "staff"
							? `Redirecting to ${
									STAFF_ROLE_LABELS[destination.role as StaffRole]
								} dashboard.`
							: "Redirecting to the student dashboard.",
		});
		setTimeout(() => {
			router.push(destination.path);
		}, 500);
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
					href={audience === "staff" ? "/staff/forgot-password" : "/forgot-password"}
					className="text-xs font-semibold text-[#B7770D] transition hover:underline"
				>
					Forgot password?
				</Link>
			</div>

			<AuthSubmitButton isSubmitting={isSubmitting}>Sign In</AuthSubmitButton>

			{audience === "student" ? (
				<p className="text-center text-xs text-[#6f7f98]">
					Need a new account?{" "}
					<Link href="/apply" className="font-bold text-[#B7770D] hover:underline">
						Continue admission
					</Link>
				</p>
			) : (
				<p className="text-center text-xs text-[#6f7f98]">
					Student applicant?{" "}
					<Link href="/signin" className="font-bold text-[#B7770D] hover:underline">
						Go to student login
					</Link>
				</p>
			)}
		</form>
	);
}
