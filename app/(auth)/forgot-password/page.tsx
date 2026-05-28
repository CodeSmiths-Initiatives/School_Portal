import { AuthShell, ForgotPasswordForm } from "@/features/auth/components";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Forgot Password | School Portal",
	description: "Request a school portal password reset link.",
};

export default function ForgotPasswordPage() {
	return (
		<AuthShell
			title="Forgot password"
			subtitle="Enter your email address and we will prepare the reset flow for your account."
			footer={
				<>
					Remembered it already?{" "}
					<Link
						href="/signin"
						className="font-bold text-[#B7770D] hover:underline"
					>
						Sign in
					</Link>
				</>
			}
		>
			<ForgotPasswordForm />
		</AuthShell>
	);
}
