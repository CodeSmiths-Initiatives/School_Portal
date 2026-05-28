import { AuthShell, SignInForm } from "@/features/auth/components";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Sign In | School Portal",
	description: "Access your school portal account.",
};

export default function SignInPage() {
	return (
		<AuthShell
			title="Sign in to your account"
			subtitle="Access your application, payment status, and admission updates."
			footer={
				<>
					New here?{" "}
					<Link href="/" className="font-bold text-[#B7770D] hover:underline">
						Continue admission
					</Link>
				</>
			}
		>
			<SignInForm />
		</AuthShell>
	);
}
