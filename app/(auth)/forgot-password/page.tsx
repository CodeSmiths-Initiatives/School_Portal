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
			rail={{
				badge: "Password Help",
				titleStart: "Reset",
				titleAccent: "Student",
				titleEnd: "Access",
				description:
					"Securely verify your student account, create a new password, and return to your admission or dashboard flow.",
				activePortal: "student",
				items: [
					{ label: "Step #1", value: "Confirm your account email" },
					{ label: "Step #2", value: "Enter verification code" },
					{ label: "Step #3", value: "Set a new password" },
				],
			}}
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
