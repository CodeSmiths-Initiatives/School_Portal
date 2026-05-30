import {
	AuthShell,
	ForgotPasswordForm,
} from "@/features/auth/components";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Staff Forgot Password | School Portal",
	description: "Reset your staff portal password.",
};

export default function StaffForgotPasswordPage() {
	return (
		<AuthShell
			title="Reset staff password"
			subtitle="Use your assigned staff email to verify identity and continue the internal password reset flow."
			rail={{
				badge: "Staff Support",
				titleStart: "Restore",
				titleAccent: "Staff",
				titleEnd: "Access",
				description:
					"Verify your staff identity, reset your password securely, and return to your internal dashboard access.",
				activePortal: "staff",
				items: [
					{ label: "Step #1", value: "Confirm staff email address" },
					{ label: "Step #2", value: "Validate reset code" },
					{ label: "Step #3", value: "Create a new password" },
				],
			}}
			footer={
				<>
					Back to staff access?{" "}
					<Link
						href="/staff/signin"
						className="font-bold text-[#B7770D] hover:underline"
					>
						Staff sign in
					</Link>
				</>
			}
		>
			<ForgotPasswordForm audience="staff" />
		</AuthShell>
	);
}
