import AdmissionWizard from "@/features/admission/components/AdmissionWizard";
import { getAdmissionCollegeBySlug } from "@/lib/services/admission-college.service";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type TenantApplyPageProps = {
	params: Promise<{ collegeSlug: string }>;
};

export async function generateMetadata({
	params,
}: TenantApplyPageProps): Promise<Metadata> {
	const { collegeSlug } = await params;
	const college = await getAdmissionCollegeBySlug(collegeSlug);

	return {
		title: college
			? `${college.name} Admission | School Portal`
			: "Student Admission | School Portal",
		description: college
			? `Create an applicant account and complete admission registration for ${college.name}.`
			: "Create an applicant account and complete admission registration.",
	};
}

export default async function TenantApplyPage({ params }: TenantApplyPageProps) {
	const { collegeSlug } = await params;
	const college = await getAdmissionCollegeBySlug(collegeSlug);

	if (!college) {
		notFound();
	}

	return (
		<AdmissionWizard
			collegeSlug={college.slug}
			collegeName={college.name}
			collegeCode={college.code}
		/>
	);
}
