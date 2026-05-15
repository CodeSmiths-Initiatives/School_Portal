"use client";

// import { REGISTRATION_STEPS } from "@/features/auth";
export const REGISTRATION_STEPS: RegistrationStep[] = [
	{ id: 1, label: "Create Account", description: "STEP #1" },
	{ id: 2, label: "Select Programme", description: "STEP #2" },
	{ id: 3, label: "Payment", description: "STEP #3" },
	{ id: 4, label: "Confirmation", description: "STEP #4" },
];

export interface RegistrationStep {
	id: number;
	label: string;
	description: string;
}

interface RegistrationSidebarProps {
	currentStep: number;
}

export default function RegistrationSidebar({
	currentStep,
}: RegistrationSidebarProps) {
	return (
		<aside className="w-72 shrink-0 bg-[#0D2B55] min-h-[calc(100vh-88px)] flex flex-col px-8 py-10">
			{/* Badge */}
			<div className="mb-8">
				<span className="bg-[#B7770D]/20 border border-[#B7770D] text-[#B7770D] text-[10px] font-bold tracking-widest uppercase px-3 py-3 rounded-full">
					Admission Open 2025
				</span>
			</div>

			{/* Headline */}
			<div className="mb-10">
				<h2 className="text-white text-4xl font-extrabold leading-tight">
					Begin Your <span className="text-[#B7770D]">Academic</span> Journey.
				</h2>
				<p className="text-[#808B96] text-xs mt-4 leading-snug">
					Create your applicant account and complete your registration in
					minutes.
				</p>
			</div>

			{/* Steps */}
			<div className="flex flex-col gap-0">
				{REGISTRATION_STEPS.map((step, index) => {
					const isActive = step.id === currentStep;
					const isCompleted = step.id < currentStep;

					return (
						<div key={step.id} className="flex items-stretch gap-4">
							{/* Left column: circle + connector */}
							<div className="flex flex-col items-center">
								<div
									className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 z-10
                    ${
											isActive
												? "bg-[#B7770D] text-black"
												: isCompleted
													? "bg-[#B7770D]/40 text-[#B7770D]"
													: "bg-transparent border-2 border-[#F2F3F4] text-[#F2F3F4]"
										}`}
								>
									{step.id}
								</div>
								{index < REGISTRATION_STEPS.length - 1 && (
									<div className="w-px flex-1 bg-[#2a3a5a] my-1" />
								)}
							</div>

							{/* Right column: label */}
							<div className="pb-6">
								<p
									className={`text-[10px] font-semibold tracking-widest uppercase ${isActive ? "text-[#808B96]" : "text-[#808B96]"}`}
								>
									{step.description}
								</p>
								<p
									className={`text-sm font-semibold mt-0.5 ${isActive ? "text-[#F2F3F4]" : "text-gray-300"}`}
								>
									{step.label}
								</p>
							</div>
						</div>
					);
				})}
			</div>
			<div className="mt-12 flex flex-col gap-2 text-xs text-[#808B96]">
				<p>
					Already have an account?{" "}
					<a href="#" className="text-[#B7770D] font-semibold hover:underline">
						Sign in here
					</a>
				</p>
				<p>
					Need help?{" "}
					<a href="#" className="text-[#B7770D] font-semibold hover:underline">
						Contact Admissions Office
					</a>
				</p>
			</div>
		</aside>
	);
}
