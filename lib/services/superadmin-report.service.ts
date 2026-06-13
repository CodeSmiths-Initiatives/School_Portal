import { listAdmissionApplicationRecords } from "@/lib/services/admission-application.service";
import { APPLICATION_PAYMENT_TOTAL } from "@/lib/services/paystack.service";

const DEV_INTERNAL_SECRET =
	"iums-local-registration-secret-change-before-production";

export type SuperadminReportRow = {
	collegeSlug: string;
	collegeCode: string;
	collegeName: string;
	collegeStatus?: string;
	onboardedStudents: number;
	staffAccounts: number;
	adminAccounts: number;
	admissionDone: number;
	admissionDraft: number;
	admissionPending: number;
	paymentPaid: number;
	paymentUnpaid: number;
	revenue: number;
	trend: number[];
};

export type SuperadminReportData = {
	generatedAt: string;
	monthLabels: string[];
	rows: SuperadminReportRow[];
};

function getStrapiBaseUrl() {
	return (
		process.env.STRAPI_API_URL ??
		process.env.NEXT_PUBLIC_STRAPI_API_URL ??
		"http://localhost:1337"
	).replace(/\/$/, "");
}

function getInternalSecret() {
	const configured =
		process.env.PORTAL_INTERNAL_API_SECRET ?? process.env.PORTAL_REGISTRATION_SECRET;

	if (configured) {
		return configured;
	}

	if (process.env.NODE_ENV === "production") {
		throw new Error("PORTAL_INTERNAL_API_SECRET is required in production.");
	}

	return DEV_INTERNAL_SECRET;
}

async function parseError(response: Response, fallback: string) {
	const payload = (await response.json().catch(() => null)) as
		| { error?: { message?: string }; message?: string }
		| null;

	return payload?.error?.message ?? payload?.message ?? fallback;
}

async function applyAdmissionPaymentFloor(
	reportData: SuperadminReportData,
	input?: {
		from?: string;
		to?: string;
	},
): Promise<SuperadminReportData> {
	const rows = await Promise.all(
		reportData.rows.map(async (row) => {
			const applications = await listAdmissionApplicationRecords({
				collegeSlug: row.collegeSlug,
				from: input?.from,
				to: input?.to,
				limit: 1000,
			}).catch(() => []);
			const admissionPaid = applications.filter(
				(application) => application.paymentStatus === "paid",
			).length;
			const admissionUnpaid = applications.filter(
				(application) =>
					application.paymentStatus !== "paid" &&
					application.status !== "cancelled" &&
					application.status !== "rejected",
			).length;
			const paymentPaid = Math.max(row.paymentPaid, admissionPaid);
			const paymentUnpaid = Math.max(row.paymentUnpaid, admissionUnpaid);
			const revenue = Math.max(row.revenue, admissionPaid * APPLICATION_PAYMENT_TOTAL);

			return {
				...row,
				paymentPaid,
				paymentUnpaid,
				revenue,
			};
		}),
	);

	return {
		...reportData,
		rows,
	};
}

export async function getSuperadminReportData(input?: {
	collegeSlug?: string;
	from?: string;
	to?: string;
}) {
	const params = new URLSearchParams();

	if (input?.collegeSlug && input.collegeSlug !== "all") {
		params.set("collegeSlug", input.collegeSlug);
	}
	if (input?.from) {
		params.set("from", input.from);
	}
	if (input?.to) {
		params.set("to", input.to);
	}

	const query = params.toString();
	const response = await fetch(
		`${getStrapiBaseUrl()}/api/superadmin/reports${query ? `?${query}` : ""}`,
		{
			headers: {
				Accept: "application/json",
				"x-portal-internal-secret": getInternalSecret(),
			},
			cache: "no-store",
		},
	);

	if (!response.ok) {
		throw new Error(
			await parseError(response, "Unable to load superadmin report data."),
		);
	}

	const reportData = (await response.json()) as SuperadminReportData;

	return applyAdmissionPaymentFloor(reportData, input);
}
