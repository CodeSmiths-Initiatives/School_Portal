import AdmissionWizard from "@/features/admission/components/AdmissionWizard";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Student Registration | School Portal",
	description: "Create an applicant account and complete admission registration.",
};

export default function ApplyPage() {
	return <AdmissionWizard />;
}
