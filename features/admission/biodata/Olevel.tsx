"use client";

import { ChevronDown } from "lucide-react";
import {
	BioDataForm,
	BioDataErrors,
	OLevelSubject,
	SubjectCategory,
} from "../types/biostep.types";
import { EXAM_TYPES, EXAM_YEARS, GRADES } from "../utils/bioData";
import { SUBJECT_TRACKS } from "../utils/subjectData";
import FormField from "@/components/forms/FormField";
import SelectField from "@/components/forms/SelectField";

interface Props {
	data: BioDataForm;
	errors: BioDataErrors;
	onChange: (field: keyof BioDataForm, value: string) => void;
	onCategoryChange: (category: SubjectCategory) => void;
	onSubjectChange: (
		sitting: 1 | 2,
		row: number,
		subField: "subject" | "grade",
		value: string,
	) => void;
}

const TRACK_CONFIG: Record<
	SubjectCategory,
	{
		label: string;
		trackLabel: string;
		emoji: string;
		activeBg: string;
		activeText: string;
		badgeBorder: string;
		badgeText: string;
	}
> = {
	science: {
		label: "Science",
		trackLabel: "SCIENCE TRACK",
		emoji: "⚛️",
		activeBg: "bg-[#0d1b3e]",
		activeText: "text-white",
		badgeBorder: "border-[#3d8fb5]",
		badgeText: "text-[#3d8fb5]",
	},
	arts: {
		label: "Arts",
		trackLabel: "ARTS TRACK",
		emoji: "🎨",
		activeBg: "bg-[#7c3aed]",
		activeText: "text-white",
		badgeBorder: "border-[#7c3aed]",
		badgeText: "text-[#7c3aed]",
	},
	social: {
		label: "Social Sciences",
		trackLabel: "SOCIAL SCIENCES TRACK",
		emoji: "🔗",
		activeBg: "bg-[#b45309]",
		activeText: "text-white",
		badgeBorder: "border-[#b45309]",
		badgeText: "text-[#b45309]",
	},
};

const ALL_CATS: SubjectCategory[] = ["science", "arts", "social"];

function TrackBadge({ category }: { category: SubjectCategory }) {
	const cfg = TRACK_CONFIG[category];
	return (
		<div
			className={`inline-flex items-center gap-2 border-2 ${cfg.badgeBorder} bg-white rounded-full px-4 py-2`}
		>
			<span className="text-base leading-none">{cfg.emoji}</span>
			<span
				className={`text-[11px] font-extrabold tracking-widest uppercase ${cfg.badgeText}`}
			>
				{cfg.trackLabel}
			</span>
		</div>
	);
}

function GradeSelect({
	value,
	onChange,
}: {
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<div className="relative shrink-0">
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="appearance-none border border-[#dce6f2] rounded-lg bg-white
          text-sm text-[#1a2b52] outline-none focus:border-[#c9952a]
          cursor-pointer pl-3 pr-6 py-1.5 min-w-15"
			>
				<option value="">—</option>
				{GRADES.map((g) => (
					<option key={g.value} value={g.value}>
						{g.value}
					</option>
				))}
			</select>
			<ChevronDown
				size={11}
				className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#8a9ab5] pointer-events-none"
			/>
		</div>
	);
}

function SubjectCard({
	subject,
	onGradeChange,
}: {
	subject: OLevelSubject;
	onGradeChange: (grade: string) => void;
}) {
	return (
		<div className="border border-[#e0e8f0] rounded-2xl bg-white p-4 flex flex-col gap-2 shadow-sm">
			<div className="flex items-start justify-between gap-2">
				<span className="text-sm font-bold text-[#1a2b52] leading-snug flex-1 min-w-0">
					{subject.subject}
				</span>
				<div className="flex items-center gap-1.5 shrink-0">
					{subject.compulsory && (
						<span
							className="text-[9px] font-bold tracking-wider bg-orange-50 text-orange-500
              border border-orange-200 px-2 py-0.5 rounded-full uppercase whitespace-nowrap"
						>
							Compulsory
						</span>
					)}
					<GradeSelect value={subject.grade} onChange={onGradeChange} />
				</div>
			</div>
			<p className="text-xs text-[#9aa5bb]">
				{subject.compulsory ? "Compulsory" : "Elective"}
			</p>
		</div>
	);
}

export default function Step3OLevel({
	data,
	errors,
	onChange,
	onCategoryChange,
	onSubjectChange,
}: Props) {
	function handleCategoryClick(cat: SubjectCategory) {
		if (typeof onCategoryChange === "function") {
			onCategoryChange(cat);
		}
	}
	// Merge stored grades into the active track subjects
	const activeSubjects: OLevelSubject[] = SUBJECT_TRACKS[
		data.subjectCategory
	].map((s, i) => ({
		...s,
		grade: data.subjects[i]?.grade ?? "",
	}));

	return (
		<div className="flex flex-col gap-8">
			{/* Exam details */}
			<div className="grid grid-cols-2 gap-5">
				<SelectField
					label="Examination Type"
					required
					value={data.examType}
					options={EXAM_TYPES}
					placeholder="--- Select ---"
					error={errors.examType}
					onChange={(v) => onChange("examType", v)}
				/>
				<SelectField
					label="Examination Year"
					required
					value={data.examYear}
					options={EXAM_YEARS}
					placeholder="--- Select Year ---"
					error={errors.examYear}
					onChange={(v) => onChange("examYear", v)}
				/>
				<FormField
					label="Examination Number"
					required
					placeholder="e.g. 421010101"
					value={data.examNumber}
					error={errors.examNumber}
					onChange={(e) => onChange("examNumber", e.target.value)}
				/>
				<FormField
					label="Centre Number"
					required
					placeholder="e.g. 50001"
					value={data.centreNumber}
					error={errors.centreNumber}
					onChange={(e) => onChange("centreNumber", e.target.value)}
				/>
			</div>

			<div className="border-t border-[#dce6f2]" />

			<div className="flex flex-col gap-5">
				{/* Heading */}
				<h3 className="text-base font-extrabold tracking-widest text-[#1a2b52] uppercase">
					Select Subject Category <span className="text-[#c9952a]">*</span>
				</h3>

				{/* Single 3-button toggle selector */}
				<div className="border border-[#dce6f2] rounded-2xl bg-[#f0f4fb] p-2 grid grid-cols-3 gap-2">
					{ALL_CATS.map((cat) => {
						const cfg = TRACK_CONFIG[cat];
						const isActive = cat === data.subjectCategory;
						return (
							<button
								key={cat}
								type="button"
								// FIX: use the safe wrapper instead of calling onCategoryChange directly
								onClick={() => handleCategoryClick(cat)}
								className={`flex items-center justify-center gap-3 px-4 py-5 rounded-xl
                  transition-all duration-200
                  ${isActive ? `${cfg.activeBg} shadow-md` : "bg-transparent hover:bg-white/60"}`}
							>
								<span className="text-xl leading-none">{cfg.emoji}</span>
								<span
									className={`text-sm font-semibold leading-tight text-center
                  ${isActive ? cfg.activeText : "text-[#9aa5bb]"}`}
								>
									{cfg.label}
								</span>
							</button>
						);
					})}
				</div>

				{/* Track badge — updates to reflect active selection */}
				<TrackBadge category={data.subjectCategory} />

				{/* Subject cards — ONLY active track shown, others hidden */}
				<div className="grid grid-cols-3 gap-4">
					{activeSubjects.map((subj, i) => (
						<SubjectCard
							key={`${data.subjectCategory}-${i}`}
							subject={subj}
							onGradeChange={(grade) => onSubjectChange(1, i, "grade", grade)}
						/>
					))}
				</div>

				{errors.subjects && (
					<p className="text-[11px] text-red-500 font-medium">
						{errors.subjects}
					</p>
				)}
			</div>
		</div>
	);
}
