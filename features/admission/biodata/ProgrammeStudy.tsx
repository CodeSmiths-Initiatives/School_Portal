import React from "react";
import { BioDataErrors, BioDataForm } from "../types/biostep.types";
import {
	CISCO_OPTIONS,
	DEPARTMENTS_BY_FACULTY,
	ENTRY_MODES,
	EXAM_YEARS,
	FACULTIES,
	GRADUATION_YEARS,
	PROGRAMME_TYPES,
	SECOND_CHOICE_PROGRAMMES,
} from "../utils/bioData";
import FormField from "@/components/forms/FormField";
import SelectField from "@/components/forms/SelectField";

interface Props {
	data: BioDataForm;
	errors: BioDataErrors;
	onChange: (field: keyof BioDataForm, value: string) => void;
}

export default function ProgrammeStudy({ data, errors, onChange }: Props) {
	// Department options depend on selected faculty
	const departmentOptions = data.faculty
		? (DEPARTMENTS_BY_FACULTY[data.faculty] ?? [])
		: [];

	return (
		<div className="flex flex-col gap-8">
			{/* ── Programme Details ── */}
			<div className="flex flex-col gap-5">
				{/* Row 1: Faculty + Department/Course */}
				<div className="grid grid-cols-2 gap-5">
					<SelectField
						label="Faculty"
						required
						value={data.faculty}
						options={FACULTIES}
						placeholder="--- Select Faculty ---"
						error={errors.faculty}
						onChange={(v) => {
							onChange("faculty", v);
							// FIX: clear department when faculty changes so stale value isn't kept
							onChange("department", "");
						}}
					/>
					{/* FIX: was a duplicate Faculty field — now correctly Department / Course */}
					<SelectField
						label="Department / Course"
						required
						value={data.department}
						options={departmentOptions}
						placeholder="--- Select Department ---"
						error={errors.department}
						onChange={(v) => onChange("department", v)}
					/>
				</div>

				{/* Row 2: Mode of Entry + Programme Type */}
				<div className="grid grid-cols-2 gap-5">
					<SelectField
						label="Mode Of Entry"
						required
						value={data.entryMode}
						options={ENTRY_MODES}
						placeholder="--- Select ---"
						error={errors.entryMode}
						onChange={(v) => onChange("entryMode", v)}
					/>
					<SelectField
						label="Programme Type"
						required
						value={data.programmeType}
						options={PROGRAMME_TYPES}
						placeholder="--- Select ---"
						error={errors.programmeType}
						onChange={(v) => onChange("programmeType", v)}
					/>
				</div>
			</div>

			<div className="border-t border-gray-800" />

			<div className="flex flex-col gap-5">
				<h3 className="text-sm font-extrabold tracking-wide text-[#1a2b52] uppercase mb-3">
					Jamb / Utme Details
				</h3>

				{/* Row 1: JAMB Reg Number + JAMB Score */}
				<div className="grid grid-cols-2 gap-5">
					<FormField
						label="JAMB Registration Number"
						required
						placeholder="e.g. 20261234567AB"
						value={data.jambRegNumber}
						error={errors.jambRegNumber}
						onChange={(e) => onChange("jambRegNumber", e.target.value)}
					/>
					<FormField
						label="JAMB Score"
						required
						placeholder="e.g. 280"
						type="number"
						value={data.jambScore}
						error={errors.jambScore}
						onChange={(e) => onChange("jambScore", e.target.value)}
					/>
				</div>

				{/* Row 2: JAMB Year + Second Choice Programme */}
				<div className="grid grid-cols-2 gap-5">
					<SelectField
						label="JAMB Year"
						required
						value={data.jambYear}
						options={EXAM_YEARS}
						placeholder="--- Select ---"
						error={errors.jambYear}
						onChange={(v) => onChange("jambYear", v)}
					/>
					<SelectField
						label="Second Choice Programme"
						required
						value={data.secondChoiceProgramme}
						options={SECOND_CHOICE_PROGRAMMES}
						placeholder="--- Select ---"
						error={errors.secondChoiceProgramme}
						onChange={(v) => onChange("secondChoiceProgramme", v)}
					/>
				</div>
			</div>

			<div className="border-t border-gray-800" />

			<div className="flex flex-col gap-5">
				<h3 className="text-sm font-extrabold tracking-wide text-[#1a2b52] uppercase mb-3">
					Education Background
				</h3>

				{/* Row 1: Secondary School Name + Year of Graduation */}
				<div className="grid grid-cols-2 gap-5">
					<FormField
						label="Secondary School Name"
						required
						placeholder="Name of secondary school attended"
						value={data.secondarySchoolName}
						error={errors.secondarySchoolName}
						onChange={(e) => onChange("secondarySchoolName", e.target.value)}
					/>
					<SelectField
						label="Year of Graduation"
						required
						value={data.yearOfGraduation}
						options={GRADUATION_YEARS}
						placeholder="--- Select ---"
						error={errors.yearOfGraduation}
						onChange={(v) => onChange("yearOfGraduation", v)}
					/>
				</div>

				{/* Row 2: School Address — full width */}
				<FormField
					label="School Address"
					required
					placeholder="City, State"
					value={data.schoolAddress}
					error={errors.schoolAddress}
					onChange={(e) => onChange("schoolAddress", e.target.value)}
				/>
			</div>

			<div className="border-t border-gray-800" />

			<div className="flex flex-col gap-3">
				<h3 className="text-sm font-extrabold tracking-wide text-[#1a2b52] uppercase mb-3">
					Cisco Tech Programme
				</h3>

				<p className="text-sm font-extrabold text-[#1a2b52] uppercase tracking-wide -mt-2 mb-2">
					Are you interested in the Cisco Certified Technology Programme?
				</p>

				<SelectField
					label=""
					value={data.interestedInCisco}
					options={CISCO_OPTIONS}
					placeholder="--- Select ---"
					onChange={(v) => onChange("interestedInCisco", v)}
				/>

				<p className="text-xs text-[#9aa5bb] leading-relaxed">
					This is a fee-based programme (₦100,000/year). Registration is
					separate from general admission.
				</p>
			</div>
		</div>
	);
}
