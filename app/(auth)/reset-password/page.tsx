import { AuthShell, ResetPasswordForm } from "@/features/auth/components";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Reset Password | School Portal",
	description: "Set a new password for your school portal account.",
};

export default function ResetPasswordPage() {
	return (
		<AuthShell
			title="Reset password"
			subtitle="Use your reset code and choose a new password that meets the portal security rules."
			rail={{
				badge: "Password Help",
				titleStart: "Restore",
				titleAccent: "Student",
				titleEnd: "Access",
				description:
					"Complete your reset securely, update your password, and return to your student portal access without losing progress.",
				activePortal: "student",
				items: [
					{ label: "Step #1", value: "Paste your reset code" },
					{ label: "Step #2", value: "Choose a strong password" },
					{ label: "Step #3", value: "Sign back into the portal" },
				],
			}}
			footer={
				<>
					Remembered your account?{" "}
					<Link href="/" className="font-bold text-[#B7770D] hover:underline">
						Back to portal
					</Link>
				</>
			}
		>
			<ResetPasswordForm />
		</AuthShell>
	);
}
