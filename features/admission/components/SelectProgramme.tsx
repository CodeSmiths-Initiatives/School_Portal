"use client";

import { useState } from "react";
import SelectField from "@/components/forms/SelectField";
import ProgrammeCard from "@/features/admission/components/ProgrammeCard";
import {
	ProgrammeFormData,
	ProgrammeType,
} from "@/features/admission/types/programme.types";
import {
	PROGRAMMES,
	FACULTY_OPTIONS,
	SESSION_OPTIONS,
} from "@/features/admission/utils/programmeData";

const initialData: ProgrammeFormData = {
	programmeType: "",
	facultyId: "",
	entrySession: "",
};

type SelectProgrammeProps = {
	onNext: () => void;
	onBack: () => void;
};

function useProgrammeForm(onNext: () => void, onBack: () => void) {
	const [formData, setFormData] = useState<ProgrammeFormData>(initialData);
	const [errors, setErrors] = useState<
		Partial<Record<keyof ProgrammeFormData, string>>
	>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	function selectProgramme(type: ProgrammeType) {
		setFormData((prev) => ({ ...prev, programmeType: type }));
		if (errors.programmeType)
			setErrors((prev) => ({ ...prev, programmeType: undefined }));
	}

	function handleSelectChange(
		field: "facultyId" | "entrySession",
		value: string,
	) {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsSubmitting(true);
		// TODO: add validation & advance to step 3 (payment)
		await new Promise((r) => setTimeout(r, 800));
		setIsSubmitting(false);
		onNext(); // FIX: now actually calls the callback and advances to step 3
	}

	function handleBack() {
		// TODO: navigate back to step 1
		onBack(); // FIX: now actually calls the callback and goes back to step 1
	}

	return {
		formData,
		errors,
		isSubmitting,
		selectProgramme,
		handleSelectChange,
		handleSubmit,
		handleBack,
	};
}

export default function SelectProgramme({
	onNext,
	onBack,
}: SelectProgrammeProps) {
	const {
		formData,
		errors,
		isSubmitting,
		selectProgramme,
		handleSelectChange,
		handleSubmit,
		handleBack,
	} = useProgrammeForm(onNext, onBack);

	return (
		<div className="bg-white rounded-2xl shadow-sm border border-[#e4eaf4] p-8 w-full max-w-2xl mx-auto">
			{/* Progress bar */}
			<div className="mb-6">
				<div className="w-full h-2 rounded-full overflow-hidden bg-[#e4eaf4]">
					<div className="w-2/4 h-full rounded-full transition-all duration-500 bg-[#B7770D]"></div>
				</div>
			</div>

			{/* Step label*/}
			<p className="text-[#B7770D] text-xs font-bold tracking-wide uppercase mb-2">
				Step 2 of 4
			</p>
			<h3 className="text-gray-800 text-2xl font-semibold italic mb-1">
				Select Your Programme
			</h3>
			<p className="text-gray-500 text-sm font-medium mb-2">
				Choose the academic programme you wish to apply for this admission cycle
			</p>

			<form onSubmit={handleSubmit} className="flex flex-col gap-5">
				{/* Programme type cards */}
				<div className="flex flex-col gap-3">
					{/* FIX 3: PROGRAMMES now imported from @/utils/programmeData */}
					{PROGRAMMES.map((prog) => (
						<ProgrammeCard
							key={prog.id}
							programme={prog}
							isSelected={formData.programmeType === prog.id}
							onSelect={selectProgramme}
						/>
					))}
					{errors.programmeType && (
						<p className="text-[11px] text-red-500 font-medium">
							{errors.programmeType}
						</p>
					)}
				</div>

				{/* Faculty / Department */}
				<SelectField
					label="Faculty / Department"
					value={formData.facultyId}
					options={FACULTY_OPTIONS}
					placeholder="--- Select Faculty ---"
					error={errors.facultyId}
					onChange={(v) => handleSelectChange("facultyId", v)}
				/>

				{/* Entry Session */}
				<SelectField
					label="Entry Session"
					value={formData.entrySession}
					options={SESSION_OPTIONS}
					placeholder="--- Select Year ---"
					error={errors.entrySession}
					onChange={(v) => handleSelectChange("entrySession", v)}
				/>

				{/* Proceed */}
				<button
					type="submit"
					disabled={isSubmitting}
					className="w-full py-3.5 rounded-xl bg-[#2E86C1] hover:bg-[#2d4a8e] active:bg-[#1d3a7e]
              text-white font-semibold text-sm tracking-wide mt-1
              transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
              shadow-md shadow-[#3d5a9e]/30 hover:shadow-lg hover:shadow-[#3d5a9e]/40
              hover:-translate-y-0.5 flex items-center justify-center gap-2"
				>
					{isSubmitting ? (
						<>
							<svg
								className="animate-spin h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8v8H4z"
								/>
							</svg>
							Saving…
						</>
					) : (
						"Proceed to Payment"
					)}
				</button>

				{/* Go Back */}
				<button
					type="button"
					onClick={handleBack}
					className="w-full py-3.5 rounded-xl bg-[#2E86C1] hover:bg-[#3d5a9e]
              text-white font-semibold text-sm tracking-wide
              transition-all duration-200
              shadow-sm hover:shadow-md hover:shadow-[#3d5a9e]/30"
				>
					Go Back
				</button>
			</form>
		</div>
	);
}
