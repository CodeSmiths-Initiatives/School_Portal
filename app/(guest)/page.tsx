"use client";

import { useState } from "react";
import RegistrationHeader from "@/features/admission/components/RegistrationHeader";
import RegistrationSidebar from "@/features/admission/components/RegistrationSidebar";
import CreateAccount, {
	CreateAccountFormData,
} from "@/features/admission/components/CreateAccount";
import SelectProgramme from "@/features/admission/components/SelectProgramme";
import Payment from "@/features/admission/components/Payment";
import { FcApproval } from "react-icons/fc";

export default function Home() {
	const [currentStep, setCurrentStep] = useState(1);
	const [formData, setFormData] = useState<Partial<CreateAccountFormData>>({});

	const handleAccountCreated = (data: CreateAccountFormData) => {
		setFormData(data);
		setCurrentStep(2);
		// Navigate to next step — extend with router.push(`/modules/admission/programme`) in a full app
		console.log("Step 1 complete:", data);
	};

	return (
		<div className="min-h-screen bg-[#f0f4fb] flex flex-col">
			<RegistrationHeader />

			<div className="flex flex-1">
				<RegistrationSidebar currentStep={currentStep} />

				{/* Main content area */}
				<main className="flex-1 flex items-start justify-center px-10 py-12">
					{currentStep === 1 && <CreateAccount onNext={handleAccountCreated} />}

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
						<div className="bg-white rounded-2xl shadow-sm border border-[#e4eaf4] p-8 w-full max-w-2xl text-center">
							<div className="mb-4">
								<div className="h-2 w-full bg-[#e4eaf4] rounded-full overflow-hidden">
									<div className="h-full w-4/4 bg-[#c9922a] rounded-full" />
								</div>
							</div>
							<p className="text-[#c9922a] text-xs font-bold tracking-widest uppercase mb-2">
								Step 4 of 4
							</p>
							<h3 className="text-[#0d1b3e] text-2xl font-extrabold italic mb-4">
								Payment Successful
							</h3>
							<p className="text-[#4a6fa5] text-sm font-medium mb-6">
								<span className="flex items-center justify-center gap-2 text-5xl text-green-600 font-bold mb-2">
									<FcApproval />
								</span>
								Your application has been submitted successfully! We will review
								your application and contact you via email with the next steps.
							</p>

							<button
								onClick={() => setCurrentStep(2)}
								className="mt-6 text-xs text-[#4a6fa5] hover:text-[#c9922a] font-semibold transition"
							>
								← Back to Select Programme
							</button>
							{/* <button className="mt-6 text-xs text-[#4a6fa5] hover:text-[#c9922a] font-semibold transition">
								Go to Dashboard
							</button> */}
						</div>
					)}
				</main>
			</div>
		</div>
	);
}
