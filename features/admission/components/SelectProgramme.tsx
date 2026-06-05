"use client";

import { useState } from "react";
import { ArrowLeft, BadgeCheck, LoaderCircle } from "lucide-react";
import FieldFeedback from "@/components/forms/FieldFeedback";
import SelectField from "@/components/forms/SelectField";
import ProgrammeCard from "@/features/admission/components/ProgrammeCard";
import type {
	ProgrammeFormData,
	ProgrammeType,
} from "@/features/admission/types/programme.types";
import {
	FACULTY_OPTIONS,
	PROGRAMMES,
	SESSION_OPTIONS,
} from "@/features/admission/utils/programmeData";
import {
	programmeSelectionSchema,
	toFieldErrors,
	type ProgrammeSelectionInput,
} from "@/lib/validation";

const initialData: ProgrammeFormData = {
	programmeType: "",
	facultyId: "",
	entrySession: "",
};

type SelectProgrammeProps = {
	onNext: (data: ProgrammeSelectionInput) => Promise<void> | void;
	onBack: () => void;
};

function useProgrammeForm(
	onNext: (data: ProgrammeSelectionInput) => Promise<void> | void,
	onBack: () => void,
) {
	const [formData, setFormData] = useState<ProgrammeFormData>(initialData);
	const [errors, setErrors] = useState<
		Partial<Record<keyof ProgrammeFormData, string>>
	>({});
	const [submitError, setSubmitError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	function selectProgramme(type: ProgrammeType) {
		setFormData((prev) => ({ ...prev, programmeType: type }));
		setSubmitError("");
		if (errors.programmeType) {
			setErrors((prev) => ({ ...prev, programmeType: undefined }));
		}
	}

	function handleSelectChange(
		field: "facultyId" | "entrySession",
		value: string,
	) {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setSubmitError("");
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	}

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setSubmitError("");

		const result = programmeSelectionSchema.safeParse(formData);

		if (!result.success) {
			setErrors(toFieldErrors<keyof ProgrammeFormData>(result.error));
			return;
		}

		setErrors({});
		setIsSubmitting(true);
		try {
			await onNext(result.data);
		} catch (error) {
			setSubmitError(
				error instanceof Error
					? error.message
					: "Unable to save the application before payment.",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	function handleBack() {
		onBack();
	}

	return {
		formData,
		errors,
		submitError,
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
		submitError,
		isSubmitting,
		selectProgramme,
		handleSelectChange,
		handleSubmit,
		handleBack,
	} = useProgrammeForm(onNext, onBack);

	return (
		<div className="surface-card mx-auto w-full max-w-2xl p-5 sm:p-6 lg:p-8">
			<div className="mb-6">
				<div className="h-2 w-full overflow-hidden rounded-full bg-[#e4eaf4]">
					<div className="h-full w-2/4 rounded-full bg-[#B7770D] transition-all duration-500" />
				</div>
			</div>

			<p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#B7770D]">
				Step 2 of 4
			</p>
			<h3 className="mb-1 text-2xl font-semibold italic text-gray-800">
				Select Your Programme
			</h3>
			<p className="mb-2 text-sm font-medium text-gray-500">
				Choose the academic programme you wish to apply for this admission cycle
			</p>

			<form onSubmit={handleSubmit} className="flex flex-col gap-5">
				<div className="flex flex-col gap-3">
					{PROGRAMMES.map((programme) => (
						<ProgrammeCard
							key={programme.id}
							programme={programme}
							isSelected={formData.programmeType === programme.id}
							onSelect={selectProgramme}
						/>
					))}
					{errors.programmeType ? (
						<p className="text-[11px] font-medium text-red-500">
							{errors.programmeType}
						</p>
					) : null}
				</div>

				<SelectField
					label="Faculty / Department"
					value={formData.facultyId}
					options={FACULTY_OPTIONS}
					placeholder="--- Select Faculty ---"
					error={errors.facultyId}
					onChange={(value) => handleSelectChange("facultyId", value)}
				/>

				<SelectField
					label="Entry Session"
					value={formData.entrySession}
					options={SESSION_OPTIONS}
					placeholder="--- Select Year ---"
					error={errors.entrySession}
					onChange={(value) => handleSelectChange("entrySession", value)}
				/>

				{submitError ? <FieldFeedback message={submitError} /> : null}

				<div className="mt-2 grid gap-3 pt-1 sm:grid-cols-[auto_minmax(0,1fr)]">
					<button
						type="button"
						onClick={handleBack}
						className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl border border-[#d5e1ef] bg-white px-5 text-sm font-semibold text-[#35527d] transition hover:border-[#b8c9de] hover:bg-[#f8fbff] sm:w-auto"
					>
						<ArrowLeft className="size-4" />
						Go Back
					</button>

					<button
						type="submit"
						disabled={isSubmitting}
						className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#2E86C1] px-6 text-sm font-semibold tracking-wide text-white shadow-md shadow-[#2e86c1]/20 transition hover:bg-[#2a78ae] hover:shadow-lg hover:shadow-[#2e86c1]/25 disabled:cursor-not-allowed disabled:opacity-70"
					>
						{isSubmitting ? (
							<>
								<LoaderCircle className="size-4 animate-spin" />
								Saving application...
							</>
						) : (
							<>
								<BadgeCheck className="size-4" />
								Proceed to Payment
							</>
						)}
					</button>
				</div>
			</form>
		</div>
	);
}
