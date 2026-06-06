"use client";

import { useState } from "react";
import CreateAccount, {
	CreateAccountFormData,
} from "@/features/admission/components/CreateAccount";
import Payment from "@/features/admission/components/Payment";
import PaymentSuccessPanel from "@/features/admission/components/PaymentSuccessPanel";
import RegistrationHeader from "@/features/admission/components/RegistrationHeader";
import RegistrationSidebar, {
	MobileRegistrationSteps,
} from "@/features/admission/components/RegistrationSidebar";
import SelectProgramme from "@/features/admission/components/SelectProgramme";
import {
	createAdmissionApplication,
} from "@/features/admission/services/admissionApplication.client";
import { registerStudentPortalAccount } from "@/features/admission/services/studentRegistration.client";
import type { PaymentVerificationResult } from "@/features/admission/types/payment.types";
import type { AdmissionApplicationSummary } from "@/lib/services/admission-application.service";
import type { ProgrammeSelectionInput } from "@/lib/validation";
import { toast } from "@/lib/toast";

type AdmissionWizardProps = {
	collegeSlug?: string;
	collegeName?: string;
	collegeCode?: string;
};

export default function AdmissionWizard({
	collegeSlug,
	collegeName,
	collegeCode,
}: AdmissionWizardProps) {
	const [currentStep, setCurrentStep] = useState(1);
	const [accountData, setAccountData] = useState<CreateAccountFormData | null>(null);
	const [applicationData, setApplicationData] =
		useState<AdmissionApplicationSummary | null>(null);
	const [paymentResult, setPaymentResult] =
		useState<PaymentVerificationResult | null>(null);

	const handleAccountCreated = async (data: CreateAccountFormData) => {
		if (!collegeSlug) {
			throw new Error("Select a college before continuing the application.");
		}

		await registerStudentPortalAccount({
			collegeSlug,
			username: data.username,
			email: data.email,
			password: data.password,
		});

		setAccountData(data);
		setApplicationData(null);
		setPaymentResult(null);
		setCurrentStep(2);
		toast.success({
			title: "Student login created",
			description: "Your portal access is ready. Continue to programme selection.",
		});
	};

	const handleProgrammeSelected = async (programme: ProgrammeSelectionInput) => {
		if (!accountData) {
			throw new Error("Create the applicant account before selecting programme.");
		}

		if (!collegeSlug) {
			throw new Error("Select a college before continuing the application.");
		}

		const application = await createAdmissionApplication({
			collegeSlug,
			account: {
				username: accountData.username,
				email: accountData.email,
			},
			programme,
		});

		setApplicationData(application);
		setPaymentResult(null);
		setCurrentStep(3);
	};

	return (
		<div className="flex min-h-dvh flex-col overflow-y-auto bg-[#f0f4fb] lg:h-dvh lg:overflow-hidden">
			<RegistrationHeader />

			<div className="flex-1 lg:min-h-0 lg:grid lg:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]">
				<RegistrationSidebar
					currentStep={currentStep}
					collegeName={collegeName}
					collegeCode={collegeCode}
				/>

				<main
					className={`min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:app-scrollbar lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-8 lg:py-8 xl:px-10 xl:py-12 ${
						currentStep === 1 ? "focus-stage" : ""
					}`}
				>
					<div className="mx-auto flex w-full max-w-3xl flex-col gap-5 lg:min-h-full lg:justify-center">
						<MobileRegistrationSteps
							currentStep={currentStep}
							collegeName={collegeName}
							collegeCode={collegeCode}
						/>

						<div className="mx-auto flex w-full items-start justify-center">
							{currentStep === 1 && (
								<CreateAccount onNext={handleAccountCreated} />
							)}

							{currentStep === 2 && (
								<SelectProgramme
									onNext={handleProgrammeSelected}
									onBack={() => setCurrentStep(1)}
								/>
							)}

							{currentStep === 3 && (
								<Payment
									account={accountData}
									collegeSlug={collegeSlug}
									collegeName={collegeName}
									application={applicationData}
									onNext={(payment) => {
										setPaymentResult(payment);
										setCurrentStep(4);
									}}
									onBack={() => setCurrentStep(2)}
								/>
							)}

							{currentStep === 4 && (
								<PaymentSuccessPanel
									applicantEmail={accountData?.email}
									collegeSlug={collegeSlug}
									paymentResult={paymentResult}
								/>
							)}
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
