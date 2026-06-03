import { Building2 } from "lucide-react";
import StudentModuleShell from "@/features/dashboard/components/StudentModuleShell";

export default async function CollegeStudentHostelPage({
	params,
}: {
	params: Promise<{ collegeSlug: string }>;
}) {
	const { collegeSlug } = await params;

	return (
		<StudentModuleShell
			activeMenuKey="hostel"
			badge="Student Hostel"
			title="Hostel workspace"
			description="Placeholder layout for college-scoped hostel applications, room allocation status, accommodation payments, and residence notices."
			icon={Building2}
			collegeSlug={collegeSlug}
			items={[
				"College hostel application status",
				"Room allocation details",
				"Accommodation payment trail",
				"Residence notices",
			]}
		/>
	);
}
