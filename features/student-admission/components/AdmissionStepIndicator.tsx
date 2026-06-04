import { Check } from "lucide-react";
import { ADMISSION_STEPS } from "@/features/student-admission/config/admissionOptions";

type AdmissionStepIndicatorProps = {
	currentStep: number;
};

export default function AdmissionStepIndicator({
	currentStep,
}: AdmissionStepIndicatorProps) {
	return (
		<div className="overflow-x-auto bg-[#0D2B55] px-4 py-4 sm:px-6">
			<div className="mx-auto flex min-w-[42rem] max-w-4xl items-center justify-center">
				{ADMISSION_STEPS.map((step, index) => {
					const done = step.id < currentStep;
					const active = step.id === currentStep;

					return (
						<div key={step.id} className="flex flex-1 items-center">
							<div className="flex min-w-20 flex-col items-center">
								<div
									className={`flex size-10 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
										active
											? "scale-110 border-[#E4A11B] bg-[#E4A11B] text-[#0D2B55] shadow-lg shadow-[#E4A11B]/25"
											: done
												? "border-[#2E86C1] bg-[#2E86C1] text-white"
												: "border-[#29466f] bg-transparent text-[#5f7799]"
									}`}
								>
									{done ? <Check className="size-4" /> : step.id}
								</div>
								<span
									className={`mt-2 text-[10px] font-bold uppercase tracking-[0.18em] ${
										active
											? "text-[#E4A11B]"
											: done
												? "text-[#8fc7f1]"
												: "text-[#50698b]"
									}`}
								>
									{step.label}
								</span>
							</div>
							{index < ADMISSION_STEPS.length - 1 ? (
								<div
									className={`mb-6 h-px flex-1 ${
										done ? "bg-[#2E86C1]" : "bg-[#29466f]"
									}`}
								/>
							) : null}
						</div>
					);
				})}
			</div>
		</div>
	);
}
