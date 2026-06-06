import { getActiveColleges } from "@/lib/services/college.service";
import { getProvisionedColleges } from "@/lib/services/superadmin-college.service";

export type AdmissionCollegeOption = {
	id: string;
	name: string;
	slug: string;
	code: string;
	description: string;
};

export const FALLBACK_ADMISSION_COLLEGES: AdmissionCollegeOption[] = [
	{
		id: "college_kwara_applied_sciences",
		name: "Kwara Applied Sciences",
		slug: "kwara-applied-sciences",
		code: "KAS",
		description:
			"Undergraduate admission, student records, hostel, payments, and academic services for Kwara Applied Sciences.",
	},
	{
		id: "college_kwara_business_health",
		name: "Kwara Business and Health",
		slug: "kwara-business-health",
		code: "KBH",
		description:
			"College-scoped admission and student services for business, health, and professional programmes.",
	},
	{
		id: "college_kwara_education",
		name: "Kwara College of Education",
		slug: "kwara-college-of-education",
		code: "KCE",
		description:
			"Admissions, teaching practice, student payments, and academic records for education programmes.",
	},
	{
		id: "college_kwara_polytechnic",
		name: "Kwara Polytechnic Institute",
		slug: "kwara-polytechnic-institute",
		code: "KPI",
		description:
			"College-scoped admission and student services for diploma, HND, and technical programmes.",
	},
	{
		id: "college_kwara_agriculture",
		name: "Kwara Agriculture and Technology",
		slug: "kwara-agriculture-technology",
		code: "KAT",
		description:
			"Applicant registration, payments, and departmental admission tracking for agriculture and technology.",
	},
	{
		id: "college_kwara_management",
		name: "Kwara Management Sciences",
		slug: "kwara-management-sciences",
		code: "KMS",
		description:
			"Tenant-aware admission workflows for accounting, administration, and management programmes.",
	},
	{
		id: "college_kwara_health_sciences",
		name: "Kwara Health Sciences",
		slug: "kwara-health-sciences",
		code: "KHS",
		description:
			"Secure admission, payment, hostel, and student services for health science applicants.",
	},
	{
		id: "college_kwara_creative_media",
		name: "Kwara Creative and Media",
		slug: "kwara-creative-media",
		code: "KCM",
		description:
			"Application processing and student onboarding for media, design, and communication programmes.",
	},
	{
		id: "college_kwara_ict",
		name: "Kwara ICT and Innovation",
		slug: "kwara-ict-innovation",
		code: "KII",
		description:
			"College-specific admission journeys for computing, software, networking, and innovation courses.",
	},
	{
		id: "college_kwara_arts_social",
		name: "Kwara Arts and Social Studies",
		slug: "kwara-arts-social-studies",
		code: "KASO",
		description:
			"Applicant access, payment tracking, and records for arts, languages, and social science programmes.",
	},
];

function formatCollegeDescription(name: string) {
	return `College-scoped admission, payment, and student services for ${name}.`;
}

export async function getAdmissionCollegeOptions() {
	try {
		const colleges = await getProvisionedColleges();

		if (colleges.length > 0) {
			return colleges
				.filter((college) => college.status === "active")
				.map<AdmissionCollegeOption>((college) => ({
					id: String(college.id),
					name: college.name,
					slug: college.slug,
					code: college.code,
					description: formatCollegeDescription(college.name),
				}));
		}
	} catch {
		// Continue to public Strapi collection or static fallback below.
	}

	try {
		const colleges = await getActiveColleges({ cache: "no-store" });

		if (colleges.length > 0) {
			return colleges.map<AdmissionCollegeOption>((college) => ({
				id: college.id,
				name: college.name,
				slug: college.slug,
				code: college.code,
				description: formatCollegeDescription(college.name),
			}));
		}
	} catch {
		// Keep local development and MVP review usable when Strapi is offline.
	}

	return FALLBACK_ADMISSION_COLLEGES;
}

export async function getAdmissionCollegeBySlug(slug: string) {
	const colleges = await getAdmissionCollegeOptions();
	return colleges.find((college) => college.slug === slug) ?? null;
}
