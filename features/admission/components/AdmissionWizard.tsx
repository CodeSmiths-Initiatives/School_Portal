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
import type { PaymentVerificationResult } from "@/features/admission/types/payment.types";

export default function AdmissionWizard() {
	const [currentStep, setCurrentStep] = useState(1);
	const [accountData, setAccountData] = useState<CreateAccountFormData | null>(null);
	const [paymentResult, setPaymentResult] =
		useState<PaymentVerificationResult | null>(null);

	const handleAccountCreated = (data: CreateAccountFormData) => {
		setAccountData(data);
		setCurrentStep(2);
	};

	return (
		<div className="flex min-h-dvh flex-col overflow-y-auto bg-[#f0f4fb] lg:h-dvh lg:overflow-hidden">
			<RegistrationHeader />

			<div className="flex-1 lg:min-h-0 lg:grid lg:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]">
				<RegistrationSidebar currentStep={currentStep} />

				<main
					className={`min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:app-scrollbar lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-8 lg:py-8 xl:px-10 xl:py-12 ${
						currentStep === 1 ? "focus-stage" : ""
					}`}
				>
					<div className="mx-auto flex w-full max-w-3xl flex-col gap-5 lg:min-h-full lg:justify-center">
						<MobileRegistrationSteps currentStep={currentStep} />

						<div className="mx-auto flex w-full items-start justify-center">
							{currentStep === 1 && (
								<CreateAccount onNext={handleAccountCreated} />
							)}

							{currentStep === 2 && (
								<SelectProgramme
									onNext={() => setCurrentStep(3)}
									onBack={() => setCurrentStep(1)}
								/>
							)}

							{currentStep === 3 && (
								<Payment
									account={accountData}
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
