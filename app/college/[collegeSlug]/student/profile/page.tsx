import { UserRound } from "lucide-react";
import StudentModuleShell from "@/features/dashboard/components/StudentModuleShell";

export default async function CollegeStudentProfilePage({
	params,
}: {
	params: Promise<{ collegeSlug: string }>;
}) {
	const { collegeSlug } = await params;

	return (
		<StudentModuleShell
			activeMenuKey="profile"
			badge="Student Profile"
			title="Profile workspace"
			description="Placeholder layout for college-scoped student biodata, personal records, contact details, guardian information, and document readiness."
			icon={UserRound}
			collegeSlug={collegeSlug}
			items={[
				"College-scoped personal information",
				"Contact and guardian details",
				"Document readiness",
				"Profile completion history",
			]}
		/>
	);
}
