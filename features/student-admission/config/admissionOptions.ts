import {
	BLOOD_GROUPS,
	CISCO_OPTIONS,
	ENTRY_MODES,
	EXAM_TYPES,
	EXAM_YEARS,
	FACULTIES as BIO_FACULTIES,
	GENOTYPES,
	GRADES as BIO_GRADES,
	KWARA_LGAS,
	MARITAL_STATUSES,
	NIGERIAN_STATES as BIO_NIGERIAN_STATES,
	PROGRAMME_TYPES,
	RELATIONSHIPS,
	RELIGIONS,
	SECOND_CHOICE_PROGRAMMES,
	GRADUATION_YEARS,
} from "@/features/admission/utils/bioData";

export type SelectOption = {
	value: string;
	label: string;
};

function preserveLabels(options: SelectOption[]) {
	return options.map((option) => ({
		value: option.label,
		label: option.label,
	}));
}

export const GENDER_OPTIONS = [
	{ value: "Male", label: "Male" },
	{ value: "Female", label: "Female" },
];

export const MARITAL_STATUS_OPTIONS = preserveLabels(MARITAL_STATUSES);
export const RELIGION_OPTIONS = preserveLabels(RELIGIONS);
export const NIGERIAN_STATE_OPTIONS = preserveLabels(BIO_NIGERIAN_STATES);
export const LOCAL_GOVERNMENT_OPTIONS = preserveLabels(KWARA_LGAS);
export const EXAMINATION_TYPE_OPTIONS = preserveLabels(EXAM_TYPES);
export const EXAMINATION_YEAR_OPTIONS = EXAM_YEARS;
export const FACULTY_OPTIONS = preserveLabels(BIO_FACULTIES);
export const DEPARTMENT_OPTIONS_BY_FACULTY: Record<string, readonly string[]> = {
	"Faculty of Science": [
		"Computer Science",
		"Mathematics",
		"Physics",
		"Chemistry",
		"Biology",
	],
	"Faculty of Engineering": [
		"Civil Engineering",
		"Electrical Engineering",
		"Mechanical Engineering",
		"Chemical Engineering",
	],
	"Faculty of Arts & Humanities": [
		"English & Literary Studies",
		"History & International Studies",
		"Linguistics",
	],
	"Faculty of Social Sciences": [
		"Economics",
		"Political Science",
		"Sociology",
		"Mass Communication",
	],
	"Faculty of Management Sciences": [
		"Accounting",
		"Business Administration",
		"Banking & Finance",
		"Marketing",
	],
	"Faculty of Law": ["Law (LLB)"],
};
export const MODE_OF_ENTRY_OPTIONS = preserveLabels(ENTRY_MODES);
export const PROGRAMME_TYPE_OPTIONS = preserveLabels(PROGRAMME_TYPES);
export const JAMB_YEAR_OPTIONS = EXAM_YEARS;
export const SECOND_CHOICE_PROGRAMME_OPTIONS = preserveLabels(
	SECOND_CHOICE_PROGRAMMES,
);
export const GRADUATION_YEAR_OPTIONS = GRADUATION_YEARS;
export const RELATIONSHIP_OPTIONS = preserveLabels(RELATIONSHIPS);
export const BLOOD_GROUP_OPTIONS = BLOOD_GROUPS;
export const GENOTYPE_OPTIONS = GENOTYPES;
export const CISCO_INTEREST_OPTIONS = preserveLabels(CISCO_OPTIONS);

export const GRADES = BIO_GRADES.map((grade) => grade.value);

export const SUBJECT_CATEGORIES = {
	Science: {
		label: "Science",
		compulsory: ["English Language", "Mathematics", "Physics", "Chemistry", "Biology"],
		optional: ["Further Mathematics", "Agricultural Science", "Computer Science", "Geography"],
	},
	Arts: {
		label: "Arts",
		compulsory: ["English Language", "Literature in English", "Government", "History"],
		optional: ["Mathematics", "Economics", "French", "Christian Religious Studies", "Islamic Studies"],
	},
	"Social Sciences": {
		label: "Social Sciences",
		compulsory: ["English Language", "Mathematics", "Economics", "Government"],
		optional: ["Commerce", "Accounting", "Geography", "Biology", "History"],
	},
} as const;

export const ADMISSION_STEPS = [
	{ id: 1, label: "Bio Data" },
	{ id: 2, label: "Contact" },
	{ id: 3, label: "O-Level" },
	{ id: 4, label: "Programme" },
	{ id: 5, label: "Declaration" },
] as const;
