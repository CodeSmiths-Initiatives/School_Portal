import {
	AuthShell,
	SignInForm,
} from "@/features/auth/components";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Staff Sign In | School Portal",
	description: "Secure staff access for the school portal.",
};

export default function StaffSignInPage() {
	return (
		<AuthShell
			title="Sign in to the staff portal"
			subtitle="Access internal operations, approvals, notices, and role-based tools provisioned by the superadmin."
			rail={{
				badge: "Internal Access",
				titleStart: "Manage",
				titleAccent: "Staff",
				titleEnd: "Operations",
				description:
					"Sign in with your assigned staff credentials to access internal tasks, academic operations, and institution workflows.",
				activePortal: "staff",
				items: [
					{ label: "Step #1", value: "Open assigned work queue" },
					{ label: "Step #2", value: "Process approvals and tasks" },
					{ label: "Step #3", value: "Review internal notices" },
				],
			}}
			footer={
				<>
					Need student access instead?{" "}
					<Link href="/signin" className="font-bold text-[#B7770D] hover:underline">
						Student login
					</Link>
				</>
			}
		>
			<SignInForm audience="staff" />
		</AuthShell>
	);
}
