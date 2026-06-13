import { getCurrentAuthSession } from "@/lib/auth/server-session";
import {
	getAdmissionApplicationForApplicant,
	isAdmissionApplicationDashboardReady,
} from "@/lib/services/admission-application.service";
import { hasPaidAdmissionPaymentForApplicant } from "@/lib/services/payment-persistence.service";
import { redirect } from "next/navigation";

function getResumeStep(application: Awaited<ReturnType<typeof getAdmissionApplicationForApplicant>>) {
	if (application?.currentStep === "payment") {
		return "payment";
	}

	return application ? "programme" : "account";
}

export async function requirePaidStudentAccess(collegeSlug: string) {
	const session = await getCurrentAuthSession();

	if (!session) {
		redirect("/signin");
	}

	if (session.user.domain !== "student") {
		redirect(session.destination.path);
	}

	if (session.user.collegeSlug && session.user.collegeSlug !== collegeSlug) {
		redirect(session.destination.path);
	}

	const application = session.user.email
		? await getAdmissionApplicationForApplicant({
				collegeSlug,
				email: session.user.email,
			}).catch(() => null)
		: null;

	const hasPaidAdmissionPayment =
		session.user.email && !isAdmissionApplicationDashboardReady(application)
			? await hasPaidAdmissionPaymentForApplicant({
					collegeSlug,
					email: session.user.email,
				}).catch(() => false)
			: false;

	if (!isAdmissionApplicationDashboardReady(application) && !hasPaidAdmissionPayment) {
		redirect(`/college/${collegeSlug}/apply?resume=${getResumeStep(application)}`);
	}

	return {
		session,
		application,
	};
}
