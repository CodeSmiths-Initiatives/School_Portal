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
			rail={{
				badge: "Student Access",
				titleStart: "Student",
				titleAccent: "Portal",
				titleEnd: "Access",
				description:
					"Sign in to continue admission, review payment progress, and stay updated on student-facing notices.",
				activePortal: "student",
				items: [
					{ label: "Step #1", value: "Review application status" },
					{ label: "Step #2", value: "Track payment progress" },
					{ label: "Step #3", value: "Open student updates" },
				],
			}}
			footer={
				<>
					New here?{" "}
					<Link href="/apply" className="font-bold text-[#B7770D] hover:underline">
						Continue admission
					</Link>
				</>
			}
		>
			<SignInForm />
		</AuthShell>
	);
}
