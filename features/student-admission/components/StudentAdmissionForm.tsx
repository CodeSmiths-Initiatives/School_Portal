"use client";

import {
	BookOpenCheck,
	Camera,
	CheckCircle2,
	ClipboardCheck,
	FileText,
	GraduationCap,
	IdCard,
	Phone,
	Printer,
	UserRound,
} from "lucide-react";
import { useEffect, useRef, useState, type ElementType } from "react";
import {
	BLOOD_GROUP_OPTIONS,
	CISCO_INTEREST_OPTIONS,
	DEPARTMENT_OPTIONS_BY_FACULTY,
	EXAMINATION_TYPE_OPTIONS,
	EXAMINATION_YEAR_OPTIONS,
	FACULTY_OPTIONS,
	GENDER_OPTIONS,
	GENOTYPE_OPTIONS,
	GRADES,
	GRADUATION_YEAR_OPTIONS,
	JAMB_YEAR_OPTIONS,
	LOCAL_GOVERNMENT_OPTIONS,
	MARITAL_STATUS_OPTIONS,
	MODE_OF_ENTRY_OPTIONS,
	NIGERIAN_STATE_OPTIONS,
	PROGRAMME_TYPE_OPTIONS,
	RELATIONSHIP_OPTIONS,
	RELIGION_OPTIONS,
	SECOND_CHOICE_PROGRAMME_OPTIONS,
	type SelectOption,
	SUBJECT_CATEGORIES,
} from "@/features/student-admission/config/admissionOptions";
import AdmissionField, {
	getAdmissionControlClass,
} from "@/features/student-admission/components/AdmissionField";
import AdmissionStepIndicator from "@/features/student-admission/components/AdmissionStepIndicator";
import {
	createAdmissionApplication,
	listAdmissionApplications,
	updateAdmissionApplication,
} from "@/features/admission/services/admissionApplication.client";
import {
	useStudentAdmissionStore,
	type BioData,
	type ContactData,
	type DeclarationData,
	type OLevelData,
	type ProgrammeData,
} from "@/features/student-admission/store/studentAdmissionStore";
import {
	type AdmissionErrors,
	validateBioData,
	validateContactData,
	validateDeclarationData,
	validateOLevelData,
	validateProgrammeData,
} from "@/features/student-admission/lib/validation";
import type {
	AdmissionApplicationSummary,
} from "@/lib/services/admission-application.service";
import type { ProgrammeSelectionInput } from "@/lib/validation";
import { toast } from "@/lib/toast";

type StudentAdmissionFormProps = {
	studentName: string;
	email: string;
	collegeName: string;
	collegeSlug: string;
};

type SectionHeaderProps = {
	icon: ElementType;
	title: string;
	description: string;
};

function SectionHeader({ icon: Icon, title, description }: SectionHeaderProps) {
	return (
		<div className="flex items-center gap-3 rounded-2xl bg-[#0D2B55] px-4 py-4 text-white sm:px-5">
			<div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#E4A11B]/50 bg-[#E4A11B]/14 text-[#E4A11B]">
				<Icon className="size-5" />
			</div>
			<div className="min-w-0">
				<h2 className="text-base font-bold">{title}</h2>
				<p className="mt-1 text-xs leading-5 text-[#b8c8dd]">{description}</p>
			</div>
		</div>
	);
}

function DividerTitle({ title }: { title: string }) {
	return (
		<div className="flex items-center gap-3">
			<div className="h-px w-8 bg-[#E4A11B]" />
			<h3 className="text-xs font-bold uppercase tracking-[0.22em] text-[#0D2B55]">
				{title}
			</h3>
			<div className="h-px flex-1 bg-[#dfe7f1]" />
		</div>
	);
}

function SelectOptions({ options }: { options: readonly SelectOption[] }) {
	return (
		<>
			<option value="">Select option</option>
			{options.map((option) => (
				<option key={`${option.value}-${option.label}`} value={option.value}>
					{option.label}
				</option>
			))}
		</>
	);
}

function BioDataStep({ errors }: { errors: AdmissionErrors }) {
	const fileRef = useRef<HTMLInputElement>(null);
	const { bioData, updateBioData } = useStudentAdmissionStore();

	function update<K extends keyof BioData>(field: K, value: BioData[K]) {
		updateBioData({ [field]: value });
	}

	function handlePhoto(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;

		if (file.size > 2 * 1024 * 1024) {
			toast.error({
				title: "Photo too large",
				description: "Passport photograph must be under 2MB.",
			});
			return;
		}

		update("passportPhoto", URL.createObjectURL(file));
	}

	return (
		<div className="space-y-6">
			<SectionHeader
				icon={UserRound}
				title="Personal Bio Data"
				description="Enter your personal details exactly as shown on official documents."
			/>

			<div>
				<AdmissionField
					label="Passport Photograph"
					required
					error={errors.passportPhoto}
				>
					<div className="flex flex-col gap-5 sm:flex-row sm:items-start">
						<button
							type="button"
							onClick={() => fileRef.current?.click()}
							className={`flex size-32 shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white text-center transition hover:border-[#E4A11B] ${
								errors.passportPhoto ? "border-[#ffb4b4]" : "border-[#c8d4e3]"
							}`}
						>
							{bioData.passportPhoto ? (
								<img
									src={bioData.passportPhoto}
									alt="Passport preview"
									className="size-full rounded-2xl object-cover"
								/>
							) : (
								<>
									<Camera className="size-8 text-[#8a9ab5]" />
									<span className="mt-2 text-xs font-bold text-[#B7770D]">
										Click to Upload
									</span>
									<span className="mt-1 text-[11px] text-[#8495af]">
										JPG / PNG only
									</span>
								</>
							)}
						</button>

						<div className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4 text-xs leading-6 text-[#667891]">
							<p>White or light-blue background</p>
							<p>Full face, no glasses or head covering</p>
							<p>Recent photo within 6 months</p>
							<p>Minimum resolution: 200 x 200px</p>
							<p>Maximum file size: 2MB</p>
						</div>
					</div>
					<input
						ref={fileRef}
						type="file"
						accept="image/png,image/jpeg"
						className="hidden"
						onChange={handlePhoto}
					/>
				</AdmissionField>
			</div>

			<div className="h-px bg-[#edf1f6]" />

			<div className="grid gap-4 md:grid-cols-3">
				<AdmissionField label="Surname" required error={errors.surname}>
					<input
						className={getAdmissionControlClass(errors.surname)}
						placeholder="e.g. IBRAHIM"
						value={bioData.surname}
						onChange={(event) => update("surname", event.target.value)}
					/>
				</AdmissionField>
				<AdmissionField label="First Name" required error={errors.firstName}>
					<input
						className={getAdmissionControlClass(errors.firstName)}
						placeholder="e.g. FATIMAH"
						value={bioData.firstName}
						onChange={(event) => update("firstName", event.target.value)}
					/>
				</AdmissionField>
				<AdmissionField label="Other Name(s)" error={errors.otherName}>
					<input
						className={getAdmissionControlClass(errors.otherName)}
						placeholder="e.g. KEMI"
						value={bioData.otherName}
						onChange={(event) => update("otherName", event.target.value)}
					/>
				</AdmissionField>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<AdmissionField label="Date of Birth" required error={errors.dateOfBirth}>
					<input
						type="date"
						className={getAdmissionControlClass(errors.dateOfBirth)}
						value={bioData.dateOfBirth}
						onChange={(event) => update("dateOfBirth", event.target.value)}
					/>
				</AdmissionField>
				<AdmissionField label="Gender" required error={errors.gender}>
					<select
						className={getAdmissionControlClass(errors.gender)}
						value={bioData.gender}
						onChange={(event) => update("gender", event.target.value)}
					>
						<SelectOptions options={GENDER_OPTIONS} />
					</select>
				</AdmissionField>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<AdmissionField label="Marital Status" required error={errors.maritalStatus}>
					<select
						className={getAdmissionControlClass(errors.maritalStatus)}
						value={bioData.maritalStatus}
						onChange={(event) => update("maritalStatus", event.target.value)}
					>
						<SelectOptions options={MARITAL_STATUS_OPTIONS} />
					</select>
				</AdmissionField>
				<AdmissionField label="Religion" error={errors.religion}>
					<select
						className={getAdmissionControlClass(errors.religion)}
						value={bioData.religion}
						onChange={(event) => update("religion", event.target.value)}
					>
						<SelectOptions options={RELIGION_OPTIONS} />
					</select>
				</AdmissionField>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<AdmissionField label="Nationality" required error={errors.nationality}>
					<select
						className={getAdmissionControlClass(errors.nationality)}
						value={bioData.nationality}
						onChange={(event) => update("nationality", event.target.value)}
					>
						<SelectOptions options={[{ value: "Nigerian", label: "Nigerian" }]} />
					</select>
				</AdmissionField>
				<AdmissionField label="State of Origin" required error={errors.stateOfOrigin}>
					<select
						className={getAdmissionControlClass(errors.stateOfOrigin)}
						value={bioData.stateOfOrigin}
						onChange={(event) => update("stateOfOrigin", event.target.value)}
					>
						<SelectOptions options={NIGERIAN_STATE_OPTIONS} />
					</select>
				</AdmissionField>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<AdmissionField label="Local Government Area" required error={errors.localGovtArea}>
					<select
						className={getAdmissionControlClass(errors.localGovtArea)}
						value={bioData.localGovtArea}
						onChange={(event) => update("localGovtArea", event.target.value)}
					>
						<SelectOptions options={LOCAL_GOVERNMENT_OPTIONS} />
					</select>
				</AdmissionField>
				<AdmissionField
					label="NIN (National Identity Number)"
					required
					error={errors.nin}
					hint="Your 11-digit National Identity Number"
				>
					<input
						className={getAdmissionControlClass(errors.nin)}
						placeholder="00000000000"
						maxLength={11}
						value={bioData.nin}
						onChange={(event) =>
							update("nin", event.target.value.replace(/\D/g, "").slice(0, 11))
						}
					/>
				</AdmissionField>
			</div>
		</div>
	);
}

function ContactStep({ errors }: { errors: AdmissionErrors }) {
	const { contactData, updateContactData } = useStudentAdmissionStore();

	function update<K extends keyof ContactData>(field: K, value: ContactData[K]) {
		updateContactData({ [field]: value });
	}

	function updatePhone(field: keyof ContactData, value: string) {
		update(field, value.replace(/\D/g, "").slice(0, 11));
	}

	return (
		<div className="space-y-6">
			<SectionHeader
				icon={Phone}
				title="Contact and Guardian Information"
				description="Provide accurate contact details for admission communication."
			/>

			<div className="grid gap-4 md:grid-cols-2">
				<AdmissionField label="Phone Number" required error={errors.phoneNumber}>
					<input
						className={getAdmissionControlClass(errors.phoneNumber)}
						placeholder="e.g. 08012345678"
						value={contactData.phoneNumber}
						onChange={(event) => updatePhone("phoneNumber", event.target.value)}
					/>
				</AdmissionField>
				<AdmissionField label="Alternate Phone Number" error={errors.alternatePhone}>
					<input
						className={getAdmissionControlClass(errors.alternatePhone)}
						placeholder="e.g. 08012345678"
						value={contactData.alternatePhone}
						onChange={(event) => updatePhone("alternatePhone", event.target.value)}
					/>
				</AdmissionField>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<AdmissionField label="Email Address" required error={errors.emailAddress}>
					<input
						type="email"
						className={getAdmissionControlClass(errors.emailAddress)}
						placeholder="student@example.com"
						value={contactData.emailAddress}
						onChange={(event) => update("emailAddress", event.target.value)}
					/>
				</AdmissionField>
				<AdmissionField label="Confirm Email" required error={errors.confirmEmail}>
					<input
						type="email"
						className={getAdmissionControlClass(errors.confirmEmail)}
						placeholder="Retype your email"
						value={contactData.confirmEmail}
						onChange={(event) => update("confirmEmail", event.target.value)}
					/>
				</AdmissionField>
			</div>

			<AdmissionField label="Residential Address" required error={errors.residentialAddress}>
				<textarea
					className={`${getAdmissionControlClass(errors.residentialAddress)} min-h-24 resize-y`}
					placeholder="House No, Street, Area, City, State"
					value={contactData.residentialAddress}
					onChange={(event) => update("residentialAddress", event.target.value)}
				/>
			</AdmissionField>

			<DividerTitle title="Parent / Guardian Information" />

			<div className="grid gap-4 md:grid-cols-2">
				<AdmissionField label="Guardian Full Name" required error={errors.guardianFullName}>
					<input
						className={getAdmissionControlClass(errors.guardianFullName)}
						placeholder="Full name of parent or guardian"
						value={contactData.guardianFullName}
						onChange={(event) => update("guardianFullName", event.target.value)}
					/>
				</AdmissionField>
				<AdmissionField label="Relationship" required error={errors.guardianRelationship}>
					<select
						className={getAdmissionControlClass(errors.guardianRelationship)}
						value={contactData.guardianRelationship}
						onChange={(event) => update("guardianRelationship", event.target.value)}
					>
						<SelectOptions options={RELATIONSHIP_OPTIONS} />
					</select>
				</AdmissionField>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<AdmissionField label="Guardian Phone" required error={errors.guardianPhone}>
					<input
						className={getAdmissionControlClass(errors.guardianPhone)}
						placeholder="e.g. 08012345678"
						value={contactData.guardianPhone}
						onChange={(event) => updatePhone("guardianPhone", event.target.value)}
					/>
				</AdmissionField>
				<AdmissionField label="Guardian Email" error={errors.guardianEmail}>
					<input
						type="email"
						className={getAdmissionControlClass(errors.guardianEmail)}
						placeholder="guardian@example.com"
						value={contactData.guardianEmail}
						onChange={(event) => update("guardianEmail", event.target.value)}
					/>
				</AdmissionField>
			</div>

			<AdmissionField label="Guardian Address" required error={errors.guardianAddress}>
				<textarea
					className={`${getAdmissionControlClass(errors.guardianAddress)} min-h-24 resize-y`}
					placeholder="Guardian full residential address"
					value={contactData.guardianAddress}
					onChange={(event) => update("guardianAddress", event.target.value)}
				/>
			</AdmissionField>

			<DividerTitle title="Medical Information" />

			<div className="grid gap-4 md:grid-cols-2">
				<AdmissionField label="Blood Group" error={errors.bloodGroup}>
					<select
						className={getAdmissionControlClass(errors.bloodGroup)}
						value={contactData.bloodGroup}
						onChange={(event) => update("bloodGroup", event.target.value)}
					>
						<SelectOptions options={BLOOD_GROUP_OPTIONS} />
					</select>
				</AdmissionField>
				<AdmissionField label="Genotype" error={errors.genotype}>
					<select
						className={getAdmissionControlClass(errors.genotype)}
						value={contactData.genotype}
						onChange={(event) => update("genotype", event.target.value)}
					>
						<SelectOptions options={GENOTYPE_OPTIONS} />
					</select>
				</AdmissionField>
			</div>

			<AdmissionField label="Disability / Special Needs">
				<input
					className={getAdmissionControlClass()}
					placeholder="Leave blank if none"
					value={contactData.disability}
					onChange={(event) => update("disability", event.target.value)}
				/>
			</AdmissionField>
		</div>
	);
}

function OLevelStep({ errors }: { errors: AdmissionErrors }) {
	const { oLevelData, updateOLevelData } = useStudentAdmissionStore();
	const category =
		oLevelData.subjectCategory && oLevelData.subjectCategory in SUBJECT_CATEGORIES
			? SUBJECT_CATEGORIES[
					oLevelData.subjectCategory as keyof typeof SUBJECT_CATEGORIES
				]
			: null;

	function update<K extends keyof OLevelData>(field: K, value: OLevelData[K]) {
		updateOLevelData({ [field]: value });
	}

	function getGrade(subject: string) {
		return oLevelData.subjects.find((item) => item.name === subject)?.grade ?? "";
	}

	function setGrade(subject: string, grade: string) {
		const withoutSubject = oLevelData.subjects.filter((item) => item.name !== subject);
		update("subjects", grade ? [...withoutSubject, { name: subject, grade }] : withoutSubject);
	}

	const validatedSubjects = oLevelData.subjects.filter(
		(subject) => subject.grade && !["F9", "E8", "D7"].includes(subject.grade),
	);

	return (
		<div className="space-y-6">
			<SectionHeader
				icon={FileText}
				title="O-Level Result Validation"
				description="Select your subject category and enter WAEC, NECO, GCE, or NABTEB grades."
			/>

			<div className="grid gap-4 md:grid-cols-2">
				<AdmissionField label="Examination Type" required error={errors.examinationType}>
					<select
						className={getAdmissionControlClass(errors.examinationType)}
						value={oLevelData.examinationType}
						onChange={(event) => update("examinationType", event.target.value)}
					>
						<SelectOptions options={EXAMINATION_TYPE_OPTIONS} />
					</select>
				</AdmissionField>
				<AdmissionField label="Examination Year" required error={errors.examinationYear}>
					<select
						className={getAdmissionControlClass(errors.examinationYear)}
						value={oLevelData.examinationYear}
						onChange={(event) => update("examinationYear", event.target.value)}
					>
						<SelectOptions options={EXAMINATION_YEAR_OPTIONS} />
					</select>
				</AdmissionField>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<AdmissionField label="Examination Number" required error={errors.examinationNumber}>
					<input
						className={getAdmissionControlClass(errors.examinationNumber)}
						placeholder="e.g. 421010101"
						value={oLevelData.examinationNumber}
						onChange={(event) => update("examinationNumber", event.target.value)}
					/>
				</AdmissionField>
				<AdmissionField label="Centre Number" required error={errors.centreNumber}>
					<input
						className={getAdmissionControlClass(errors.centreNumber)}
						placeholder="e.g. 50001"
						value={oLevelData.centreNumber}
						onChange={(event) => update("centreNumber", event.target.value)}
					/>
				</AdmissionField>
			</div>

			<AdmissionField
				label="Select Subject Category"
				required
				error={errors.subjectCategory}
			>
				<div className="grid gap-3 sm:grid-cols-3">
					{Object.entries(SUBJECT_CATEGORIES).map(([key, item]) => {
						const active = oLevelData.subjectCategory === key;

						return (
							<button
								key={key}
								type="button"
								onClick={() =>
									updateOLevelData({ subjectCategory: key, subjects: [] })
								}
								className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
									active
										? "border-[#E4A11B] bg-[#fff7e8] text-[#0D2B55] shadow-sm"
										: "border-[#dbe5f1] bg-white text-[#60728f] hover:border-[#E4A11B]"
								}`}
							>
								{item.label}
							</button>
						);
					})}
				</div>
			</AdmissionField>

			{category ? (
				<div className="space-y-5">
					<SubjectGradeGrid
						title="Compulsory"
						subjects={category.compulsory}
						getGrade={getGrade}
						setGrade={setGrade}
					/>
					<SubjectGradeGrid
						title="Optional"
						subjects={category.optional}
						getGrade={getGrade}
						setGrade={setGrade}
					/>
					{errors.subjects ? (
						<p className="text-xs font-semibold text-[#d92d20]">
							{errors.subjects}
						</p>
					) : null}
					{validatedSubjects.length > 0 ? (
						<div className="rounded-2xl border border-[#b7ebc8] bg-[#f2fbf5] p-4">
							<p className="text-sm font-bold text-[#167a3e]">
								{validatedSubjects.length} credit subject(s) validated
							</p>
							<div className="mt-3 flex flex-wrap gap-2">
								{validatedSubjects.map((subject) => (
									<span
										key={subject.name}
										className="rounded-full border border-[#b7ebc8] bg-white px-3 py-1 text-xs font-semibold text-[#167a3e]"
									>
										{subject.name}: {subject.grade}
									</span>
								))}
							</div>
						</div>
					) : null}
				</div>
			) : null}
		</div>
	);
}

function SubjectGradeGrid({
	title,
	subjects,
	getGrade,
	setGrade,
}: {
	title: string;
	subjects: readonly string[];
	getGrade: (subject: string) => string;
	setGrade: (subject: string, grade: string) => void;
}) {
	return (
		<div>
			<span className="mb-3 inline-flex rounded-full bg-[#0D2B55] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
				{title}
			</span>
			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{subjects.map((subject) => (
					<div
						key={subject}
						className="rounded-2xl border border-[#dbe5f1] bg-white p-3"
					>
						<p className="mb-2 min-h-8 text-sm font-bold text-[#17305f]">
							{subject}
						</p>
						<select
							className={getAdmissionControlClass()}
							value={getGrade(subject)}
							onChange={(event) => setGrade(subject, event.target.value)}
						>
							<option value="">Select option</option>
							{GRADES.map((grade) => (
								<option key={grade}>{grade}</option>
							))}
						</select>
					</div>
				))}
			</div>
		</div>
	);
}

function ProgrammeStep({ errors }: { errors: AdmissionErrors }) {
	const { programmeData, updateProgrammeData } = useStudentAdmissionStore();
	const departments = programmeData.faculty
		? DEPARTMENT_OPTIONS_BY_FACULTY[programmeData.faculty] ?? []
		: [];
	const jambScore = Number(programmeData.jambScore) || 0;
	const jambPercent = Math.min((jambScore / 400) * 100, 100);

	function update<K extends keyof ProgrammeData>(field: K, value: ProgrammeData[K]) {
		updateProgrammeData({ [field]: value });
	}

	return (
		<div className="space-y-6">
			<SectionHeader
				icon={GraduationCap}
				title="Programme of Study"
				description="Select your preferred programme and JAMB information."
			/>

			<div className="grid gap-4 md:grid-cols-2">
				<AdmissionField label="Faculty" required error={errors.faculty}>
					<select
						className={getAdmissionControlClass(errors.faculty)}
						value={programmeData.faculty}
						onChange={(event) =>
							updateProgrammeData({ faculty: event.target.value, department: "" })
						}
					>
						<SelectOptions options={FACULTY_OPTIONS} />
					</select>
				</AdmissionField>
				<AdmissionField label="Department / Course" required error={errors.department}>
					<select
						className={getAdmissionControlClass(errors.department)}
						value={programmeData.department}
						disabled={!programmeData.faculty}
						onChange={(event) => update("department", event.target.value)}
					>
						<option value="">Select option</option>
						{departments.map((department) => (
							<option key={department} value={department}>
								{department}
							</option>
						))}
					</select>
				</AdmissionField>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<AdmissionField label="Mode of Entry" required error={errors.modeOfEntry}>
					<select
						className={getAdmissionControlClass(errors.modeOfEntry)}
						value={programmeData.modeOfEntry}
						onChange={(event) => update("modeOfEntry", event.target.value)}
					>
						<SelectOptions options={MODE_OF_ENTRY_OPTIONS} />
					</select>
				</AdmissionField>
				<AdmissionField label="Programme Type" required error={errors.programmeType}>
					<select
						className={getAdmissionControlClass(errors.programmeType)}
						value={programmeData.programmeType}
						onChange={(event) => update("programmeType", event.target.value)}
					>
						<SelectOptions options={PROGRAMME_TYPE_OPTIONS} />
					</select>
				</AdmissionField>
			</div>

			<DividerTitle title="JAMB / UTME Details" />

			<div className="grid gap-4 md:grid-cols-2">
				<AdmissionField
					label="JAMB Registration Number"
					required
					error={errors.jambRegNumber}
					hint="Format: 11 digits + 2 letters, e.g. 20261234567AB"
				>
					<input
						className={getAdmissionControlClass(errors.jambRegNumber)}
						placeholder="e.g. 20261234567AB"
						maxLength={13}
						value={programmeData.jambRegNumber}
						onChange={(event) =>
							update("jambRegNumber", event.target.value.toUpperCase())
						}
					/>
				</AdmissionField>
				<AdmissionField label="JAMB Score" required error={errors.jambScore}>
					<input
						type="number"
						min={0}
						max={400}
						className={getAdmissionControlClass(errors.jambScore)}
						placeholder="e.g. 280"
						value={programmeData.jambScore}
						onChange={(event) => {
							const value = event.target.value;
							const score = Math.min(400, Math.max(0, Number(value) || 0));
							update("jambScore", value === "" ? "" : String(score));
						}}
					/>
				</AdmissionField>
			</div>

			{programmeData.jambScore ? (
				<div className="rounded-2xl border border-[#dbe5f1] bg-white p-4">
					<div className="mb-2 flex justify-between text-sm font-bold">
						<span className="text-[#60728f]">JAMB Score</span>
						<span className="text-[#0D2B55]">{jambScore} / 400</span>
					</div>
					<div className="h-2.5 overflow-hidden rounded-full bg-[#dfe7f1]">
						<div
							className="h-full rounded-full bg-[linear-gradient(90deg,#2E86C1,#E4A11B)] transition-all"
							style={{ width: `${jambPercent}%` }}
						/>
					</div>
				</div>
			) : null}

			<div className="grid gap-4 md:grid-cols-2">
				<AdmissionField label="JAMB Year" required error={errors.jambYear}>
					<select
						className={getAdmissionControlClass(errors.jambYear)}
						value={programmeData.jambYear}
						onChange={(event) => update("jambYear", event.target.value)}
					>
						<SelectOptions options={JAMB_YEAR_OPTIONS} />
					</select>
				</AdmissionField>
				<AdmissionField
					label="Second Choice Programme"
					required
					error={errors.secondChoice}
				>
					<select
						className={getAdmissionControlClass(errors.secondChoice)}
						value={programmeData.secondChoice}
						onChange={(event) => update("secondChoice", event.target.value)}
					>
						<SelectOptions options={SECOND_CHOICE_PROGRAMME_OPTIONS} />
					</select>
				</AdmissionField>
			</div>

			<DividerTitle title="Education Background" />

			<div className="grid gap-4 md:grid-cols-2">
				<AdmissionField
					label="Secondary School Name"
					required
					error={errors.secondarySchoolName}
				>
					<input
						className={getAdmissionControlClass(errors.secondarySchoolName)}
						placeholder="Name of secondary school attended"
						value={programmeData.secondarySchoolName}
						onChange={(event) => update("secondarySchoolName", event.target.value)}
					/>
				</AdmissionField>
				<AdmissionField
					label="Year of Graduation"
					required
					error={errors.yearOfGraduation}
				>
					<select
						className={getAdmissionControlClass(errors.yearOfGraduation)}
						value={programmeData.yearOfGraduation}
						onChange={(event) => update("yearOfGraduation", event.target.value)}
					>
						<SelectOptions options={GRADUATION_YEAR_OPTIONS} />
					</select>
				</AdmissionField>
			</div>

			<AdmissionField label="School Address" required error={errors.schoolAddress}>
				<input
					className={getAdmissionControlClass(errors.schoolAddress)}
					placeholder="City, State"
					value={programmeData.schoolAddress}
					onChange={(event) => update("schoolAddress", event.target.value)}
				/>
			</AdmissionField>

			<DividerTitle title="Cisco Tech Programme (Optional)" />

			<div className="rounded-2xl border border-[#bdddf4] bg-[#f3f9fe] p-4">
				<AdmissionField label="Cisco Certified Technology Programme">
					<select
						className={getAdmissionControlClass()}
						value={programmeData.ciscoInterest}
						onChange={(event) => update("ciscoInterest", event.target.value)}
					>
						<SelectOptions options={CISCO_INTEREST_OPTIONS} />
					</select>
				</AdmissionField>
				<p className="mt-2 text-xs leading-5 text-[#4f6788]">
					This optional fee-based programme can be registered separately from
					general admission.
				</p>
			</div>
		</div>
	);
}

function DeclarationStep({ errors }: { errors: AdmissionErrors }) {
	const {
		bioData,
		contactData,
		programmeData,
		declarationData,
		updateDeclarationData,
	} = useStudentAdmissionStore();

	function update<K extends keyof DeclarationData>(
		field: K,
		value: DeclarationData[K],
	) {
		updateDeclarationData({ [field]: value });
	}

	const summary = [
		{
			label: "Full Name",
			value: [bioData.surname, bioData.firstName, bioData.otherName]
				.filter(Boolean)
				.join(" ") || "-",
		},
		{ label: "Email", value: contactData.emailAddress || "-" },
		{ label: "Phone", value: contactData.phoneNumber || "-" },
		{ label: "Faculty", value: programmeData.faculty || "-" },
		{ label: "Department", value: programmeData.department || "-" },
		{ label: "JAMB Score", value: programmeData.jambScore || "-" },
	];

	return (
		<div className="space-y-6">
			<SectionHeader
				icon={ClipboardCheck}
				title="Declaration"
				description="Review and confirm that your application details are accurate."
			/>

			<div className="overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white">
				<div className="bg-[#0D2B55] px-5 py-3">
					<h3 className="text-xs font-bold uppercase tracking-[0.22em] text-[#E4A11B]">
						Application Summary
					</h3>
				</div>
				<div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
					{summary.map((item) => (
						<div key={item.label}>
							<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8495af]">
								{item.label}
							</p>
							<p className="mt-1 text-sm font-bold text-[#0D2B55]">{item.value}</p>
						</div>
					))}
				</div>
			</div>

			<div className="rounded-2xl border border-[#f0d7a8] bg-[#fff9ec] p-5 text-sm leading-7 text-[#5d6e86]">
				<p className="mb-3 font-bold text-[#0D2B55]">Declaration Statement</p>
				<p>1. All information provided is true, accurate, and complete.</p>
				<p>2. False or misleading information may cancel this admission.</p>
				<p>3. I agree to follow the institution rules and code of conduct.</p>
				<p>4. I consent to processing my data for academic administration.</p>
			</div>

			<div>
				<label className="flex cursor-pointer items-start gap-3">
					<input
						type="checkbox"
						className="mt-1 size-5 rounded border-[#c8d4e3] accent-[#B7770D]"
						checked={declarationData.agreed}
						onChange={(event) => update("agreed", event.target.checked)}
					/>
					<span className="text-sm leading-6 text-[#60728f]">
						I have read, understood, and agree to the declaration above.
					</span>
				</label>
				{errors.agreed ? (
					<p className="ml-8 mt-1 text-xs font-semibold text-[#d92d20]">
						{errors.agreed}
					</p>
				) : null}
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<AdmissionField label="Signature (Full Name)" required error={errors.signature}>
					<input
						className={getAdmissionControlClass(errors.signature)}
						placeholder="Type your full name as signature"
						value={declarationData.signature}
						onChange={(event) => update("signature", event.target.value)}
					/>
				</AdmissionField>
				<AdmissionField label="Date" required error={errors.date}>
					<input
						type="date"
						className={getAdmissionControlClass(errors.date)}
						value={declarationData.date}
						onChange={(event) => update("date", event.target.value)}
					/>
				</AdmissionField>
			</div>
		</div>
	);
}

function SuccessScreen({
	collegeName,
	referenceNumber,
}: {
	collegeName: string;
	referenceNumber: string;
}) {
	return (
		<div className="rounded-3xl border border-[#dbe5f1] bg-white p-6 text-center shadow-sm sm:p-10">
			<div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#edf8f1] text-[#167a3e]">
				<CheckCircle2 className="size-10" />
			</div>
			<h2 className="mt-5 text-2xl font-bold text-[#0D2B55]">
				Application Submitted
			</h2>
			<p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#60728f]">
				Your student admission application for {collegeName} has been received.
				Please save your reference number for future tracking.
			</p>
			<div className="mx-auto mt-6 max-w-md rounded-2xl border border-[#E4A11B]/60 bg-[#0D2B55] px-5 py-4 text-left">
				<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E4A11B]">
					Reference Number
				</p>
				<p className="mt-2 break-all text-lg font-bold text-white">
					{referenceNumber}
				</p>
			</div>
			<button
				type="button"
				onClick={() => window.print()}
				className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-[#0D2B55] px-5 py-3 text-sm font-bold text-[#0D2B55] transition hover:bg-[#0D2B55] hover:text-white"
			>
				<Printer className="size-4" />
				Print Confirmation Slip
			</button>
		</div>
	);
}

function createReferenceNumber() {
	const random = Math.random().toString(36).slice(2, 8).toUpperCase();
	return `ADM-${Date.now()}-${random}`;
}

export default function StudentAdmissionForm({
	studentName,
	email,
	collegeName,
	collegeSlug,
}: StudentAdmissionFormProps) {
	const {
		currentStep,
		setStep,
		bioData,
		contactData,
		oLevelData,
		programmeData,
		declarationData,
		updateContactData,
	} = useStudentAdmissionStore();
	const [errors, setErrors] = useState<AdmissionErrors>({});
	const [referenceNumber, setReferenceNumber] = useState("");
	const [application, setApplication] =
		useState<AdmissionApplicationSummary | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const isSuccess = currentStep === 6;

	useEffect(() => {
		if (!contactData.emailAddress && email) {
			updateContactData({ emailAddress: email, confirmEmail: email });
		}
	}, [contactData.emailAddress, email, updateContactData]);

	function validateCurrentStep() {
		const stepErrors =
			currentStep === 1
				? validateBioData(bioData)
				: currentStep === 2
					? validateContactData(contactData)
					: currentStep === 3
						? validateOLevelData(oLevelData)
						: currentStep === 4
							? validateProgrammeData(programmeData)
							: validateDeclarationData(declarationData);

		setErrors(stepErrors);
		return Object.keys(stepErrors).length === 0;
	}

	function getCompleteFormPayload() {
		return {
			bioData,
			contactData,
			oLevelData,
			programmeData,
			declarationData,
		};
	}

	function getProgrammeSelection(): ProgrammeSelectionInput {
		const programmeTypeValue = programmeData.programmeType.toLowerCase();
		const programmeType = programmeTypeValue.includes("top")
			? "topup"
			: programmeTypeValue.includes("distance")
				? "distance"
				: "undergraduate";

		return {
			programmeType,
			facultyId: `${programmeData.faculty}::${programmeData.department}`,
			entrySession: programmeData.jambYear || "2026/2027",
		};
	}

	async function findExistingApplication() {
		const applications = await listAdmissionApplications({
			collegeSlug,
			email,
			limit: 1,
		});

		return applications.find(
			(item) => item.status !== "cancelled" && item.status !== "rejected",
		) ?? null;
	}

	async function submitApplication() {
		const existingApplication = await findExistingApplication();
		const currentApplication =
			existingApplication ??
			(await createAdmissionApplication({
				collegeSlug,
				account: {
					username: studentName,
					email,
				},
				programme: getProgrammeSelection(),
			}));

		const saved = await updateAdmissionApplication(currentApplication.id, {
			collegeSlug,
			account: {
				username: studentName,
				email,
			},
			programme: getProgrammeSelection(),
			currentStep: "submitted",
			completedStep: "submitted",
			formData: getCompleteFormPayload(),
			status: "submitted",
			paymentStatus: currentApplication.paymentStatus,
		});

		setApplication(saved);
		return saved;
	}

	async function handleNext() {
		if (!validateCurrentStep()) {
			toast.error({
				title: "Check admission form",
				description: "Please complete the highlighted fields before continuing.",
			});
			return;
		}

		setErrors({});

		if (currentStep === 5) {
			let savedApplication: AdmissionApplicationSummary;

			setIsSaving(true);

			try {
				savedApplication = await submitApplication();
			} catch (error) {
				toast.error({
					title: "Unable to submit application",
					description:
						error instanceof Error
							? error.message
							: "Please try again before submitting.",
				});
				setIsSaving(false);
				return;
			}

			setIsSaving(false);
			setReferenceNumber(
				savedApplication.applicationNumber || createReferenceNumber(),
			);
			setStep(6);
			toast.success({
				title: "Application submitted",
				description: "Your student admission form was submitted for review.",
			});
			return;
		}

		setStep(currentStep + 1);
	}

	function handleBack() {
		setErrors({});
		setStep(Math.max(1, currentStep - 1));
	}

	return (
		<div className="mx-auto w-full max-w-[77.5rem]">
			{isSuccess ? (
				<SuccessScreen
					collegeName={collegeName}
					referenceNumber={referenceNumber}
				/>
			) : (
				<div className="overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
					<AdmissionStepIndicator currentStep={currentStep} />

					<div className="border-b border-[#edf1f6] bg-[#fbfdff] px-5 py-4 sm:px-7">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
									Student Admission
								</p>
								<h1 className="mt-1 text-xl font-bold text-[#0D2B55]">
									{collegeName}
								</h1>
							</div>
							<div className="flex flex-col gap-2 sm:items-end">
								<div className="rounded-2xl border border-[#dbe5f1] bg-white px-4 py-2 text-sm">
									<p className="font-bold text-[#0D2B55]">{studentName}</p>
									<p className="text-xs text-[#60728f]">{email}</p>
								</div>
								{application ? (
									<div className="rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#60728f]">
										{application.applicationNumber} · {application.currentStep ?? application.status}
									</div>
								) : null}
							</div>
						</div>
					</div>

					<div className="p-5 sm:p-7">
						{currentStep === 1 ? <BioDataStep errors={errors} /> : null}
						{currentStep === 2 ? <ContactStep errors={errors} /> : null}
						{currentStep === 3 ? <OLevelStep errors={errors} /> : null}
						{currentStep === 4 ? <ProgrammeStep errors={errors} /> : null}
						{currentStep === 5 ? <DeclarationStep errors={errors} /> : null}

						<div className="mt-8 flex flex-col gap-3 border-t border-[#edf1f6] pt-5 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8495af]">
								Step {currentStep} of 5
							</p>
							<div className="flex flex-col-reverse gap-3 sm:flex-row">
								{currentStep > 1 ? (
									<button
										type="button"
										onClick={handleBack}
										className="rounded-xl border border-[#cfdbea] bg-white px-6 py-3 text-sm font-bold text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
									>
										Back
									</button>
								) : null}
								<button
									type="button"
									onClick={handleNext}
									disabled={isSaving}
									className="rounded-xl bg-[#0D2B55] px-7 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(13,43,85,0.22)] transition hover:bg-[#173f77]"
								>
									{isSaving
										? "Saving..."
										: currentStep === 5
											? "Submit Application"
											: "Continue"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
