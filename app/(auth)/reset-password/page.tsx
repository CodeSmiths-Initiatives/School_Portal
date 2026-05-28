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
