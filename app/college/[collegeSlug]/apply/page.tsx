import AdmissionWizard from "@/features/admission/components/AdmissionWizard";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	getAdmissionApplicationForApplicant,
	isAdmissionApplicationDashboardReady,
} from "@/lib/services/admission-application.service";
import { getAdmissionCollegeBySlug } from "@/lib/services/admission-college.service";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type TenantApplyPageProps = {
	params: Promise<{ collegeSlug: string }>;
	searchParams?: Promise<{ resume?: string }>;
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

export default async function TenantApplyPage({
	params,
	searchParams,
}: TenantApplyPageProps) {
	const { collegeSlug } = await params;
	const { resume } = (await searchParams) ?? {};
	const college = await getAdmissionCollegeBySlug(collegeSlug);

	if (!college) {
		notFound();
	}

	const session = await getCurrentAuthSession();
	const isCurrentStudent =
		session?.user.domain === "student" &&
		session.user.collegeSlug === college.slug;
	const application =
		isCurrentStudent && session.user.email
			? await getAdmissionApplicationForApplicant({
					collegeSlug: college.slug,
					email: session.user.email,
				}).catch(() => null)
			: null;

	if (isCurrentStudent && isAdmissionApplicationDashboardReady(application)) {
		redirect(`/college/${college.slug}/student/dashboard`);
	}

	const initialStep =
		isCurrentStudent && (resume === "payment" || application?.currentStep === "payment")
			? 3
			: isCurrentStudent
				? 2
				: 1;

	return (
		<AdmissionWizard
			collegeSlug={college.slug}
			collegeName={college.name}
			collegeCode={college.code}
			initialAccount={
				isCurrentStudent
					? {
							username: session.user.username,
							email: session.user.email,
						}
					: undefined
			}
			initialApplication={application}
			initialStep={initialStep}
		/>
	);
}
