"use client";

import { useState } from "react";
import RegistrationHeader from "@/features/admission/components/RegistrationHeader";
import RegistrationSidebar, {
	MobileRegistrationSteps,
} from "@/features/admission/components/RegistrationSidebar";
import CreateAccount, {
	CreateAccountFormData,
} from "@/features/admission/components/CreateAccount";
import SelectProgramme from "@/features/admission/components/SelectProgramme";
import Payment from "@/features/admission/components/Payment";
import { FcApproval } from "react-icons/fc";

export default function Home() {
	const [currentStep, setCurrentStep] = useState(1);

	const handleAccountCreated = (data: CreateAccountFormData) => {
		setCurrentStep(2);
		// Navigate to next step â€” extend with router.push(`/modules/admission/programme`) in a full app
		console.log("Step 1 complete:", data);
	};

	return (
		<div className="flex h-dvh flex-col overflow-hidden bg-[#f0f4fb]">
			<RegistrationHeader />

			<div className="min-h-0 flex-1 lg:grid lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[22rem_minmax(0,1fr)]">
				<RegistrationSidebar currentStep={currentStep} />

				<main
					className={`app-scrollbar flex-1 min-w-0 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-10 xl:py-12 ${
						currentStep === 1 ? "focus-stage" : ""
					}`}
				>
					<div className="mx-auto flex w-full max-w-4xl flex-col gap-5 lg:min-h-full lg:justify-center">
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
									onNext={() => setCurrentStep(4)}
									onBack={() => setCurrentStep(2)}
								/>
							)}

							{currentStep === 4 && (
								<div className="surface-card w-full max-w-2xl p-5 text-center sm:p-6 lg:p-8">
									<div className="mb-4">
										<div className="h-2 w-full overflow-hidden rounded-full bg-[#e4eaf4]">
											<div className="h-full w-full rounded-full bg-[#c9922a]" />
										</div>
									</div>
									<p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#c9922a]">
										Step 4 of 4
									</p>
									<h3 className="mb-4 text-xl font-extrabold italic text-[#0d1b3e] sm:text-2xl">
										Payment Successful
									</h3>
									<p className="mb-6 text-sm font-medium text-[#4a6fa5]">
										<span className="mb-2 flex items-center justify-center gap-2 text-5xl font-bold text-green-600">
											<FcApproval />
										</span>
										Your application has been submitted successfully! We will review
										your application and contact you via email with the next steps.
									</p>
									<button
										onClick={() => setCurrentStep(2)}
										className="mt-2 text-xs font-semibold text-[#4a6fa5] transition hover:text-[#c9922a]"
									>
										â† Back to Select Programme
									</button>
								</div>
							)}
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
