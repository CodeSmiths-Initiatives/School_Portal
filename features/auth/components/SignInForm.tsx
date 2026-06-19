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
import type { MaintenanceWindow } from "@/lib/services/superadmin-settings.service";
import Link from "next/link";
import { useState } from "react";
import AuthPasswordField from "./AuthPasswordField";
import AuthSubmitButton from "./AuthSubmitButton";
import AuthTextField from "./AuthTextField";

const initialForm: LoginInput = {
	identifier: "",
	password: "",
};

function formatMaintenanceDateTime(value: string) {
	if (!value) {
		return "Not scheduled";
	}

	return new Intl.DateTimeFormat("en-NG", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

type SignInFormProps = {
	audience?: "student" | "staff";
};

export default function SignInForm({
	audience = "student",
}: SignInFormProps) {
	const [form, setForm] = useState<LoginInput>(initialForm);
	const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>(
		{},
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [maintenanceWindow, setMaintenanceWindow] =
		useState<MaintenanceWindow | null>(null);
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

		if (!loginResult.ok) {
			setIsSubmitting(false);
			if (loginResult.maintenance) {
				setMaintenanceWindow(loginResult.maintenance);
				return;
			}
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
							: destination.path.includes("/apply")
								? "Redirecting to continue your admission and payment."
								: "Redirecting to the student dashboard.",
		});
		setTimeout(() => {
			window.location.assign(destination.path);
		}, 500);
	}

	return (
		<>
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
						href={
							audience === "staff" ? "/staff/forgot-password" : "/forgot-password"
						}
						className="text-xs font-semibold text-[#B7770D] transition hover:underline"
					>
						Forgot password?
					</Link>
				</div>

				<AuthSubmitButton isSubmitting={isSubmitting}>Sign In</AuthSubmitButton>

				{audience === "student" ? (
					<p className="text-center text-xs text-[#6f7f98]">
						Need a new account?{" "}
						<Link
							href="/apply"
							className="font-bold text-[#B7770D] hover:underline"
						>
							Continue admission
						</Link>
					</p>
				) : (
					<p className="text-center text-xs text-[#6f7f98]">
						Student applicant?{" "}
						<Link
							href="/signin"
							className="font-bold text-[#B7770D] hover:underline"
						>
							Go to student login
						</Link>
					</p>
				)}
			</form>

			{maintenanceWindow ? (
				<div className="fixed inset-0 z-[260] flex items-end justify-center bg-[#06172f]/60 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-6">
					<div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#d7e2f0] bg-white shadow-[0_26px_70px_rgba(6,24,58,0.28)]">
						<div className="border-b border-[#dbe5f1] bg-[#f8fbff] px-5 py-4">
							<p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#B7770D]">
								Maintenance mode
							</p>
							<h2 className="mt-2 text-xl font-black text-[#06183A]">
								{maintenanceWindow.title}
							</h2>
						</div>
						<div className="space-y-4 px-5 py-5">
							<p className="text-sm font-semibold leading-7 text-[#60728f]">
								{maintenanceWindow.message}
							</p>
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4">
									<p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
										Start at
									</p>
									<p className="mt-2 text-sm font-black text-[#0D2B55]">
										{formatMaintenanceDateTime(maintenanceWindow.startAt)}
									</p>
								</div>
								<div className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4">
									<p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
										End at
									</p>
									<p className="mt-2 text-sm font-black text-[#0D2B55]">
										{formatMaintenanceDateTime(maintenanceWindow.endAt)}
									</p>
								</div>
							</div>
						</div>
						<div className="border-t border-[#dbe5f1] px-5 py-4">
							<button
								type="button"
								onClick={() => setMaintenanceWindow(null)}
								className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white transition hover:bg-[#123a73]"
							>
								OK
							</button>
						</div>
					</div>
				</div>
			) : null}
		</>
	);
}
