import { requirePaidStudentAccess } from "@/lib/auth/student-access";
import type { ReactNode } from "react";

export default async function CollegeStudentLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<unknown>;
}) {
	const { collegeSlug } = (await params) as { collegeSlug: string };
	await requirePaidStudentAccess(collegeSlug);

	return children;
}
