export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export const MARITAL_STATUSES = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
];

export const RELIGIONS = [
  { value: 'islam', label: 'Islam' },
  { value: 'christianity', label: 'Christianity' },
  { value: 'traditional', label: 'Traditional' },
  { value: 'other', label: 'Other' },
];

export const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
].map((s) => ({ value: s.toLowerCase().replace(/ /g, '_'), label: s }));

export const KWARA_LGAS = [
  'Asa','Baruten','Edu','Ekiti','Ifelodun','Ilorin East','Ilorin South',
  'Ilorin West','Irepodun','Isin','Kaiama','Moro','Offa','Oke-Ero',
  'Oyun','Patigi',
].map((l) => ({ value: l.toLowerCase().replace(/ /g, '_'), label: l }));

export const EXAM_TYPES = [
  { value: 'waec', label: 'WAEC' },
  { value: 'neco', label: 'NECO' },
  { value: 'nabteb', label: 'NABTEB' },
  { value: 'gce', label: 'GCE' },
];

export const OLEVEL_SUBJECTS = [
  'English Language','Mathematics','Biology','Chemistry','Physics',
  'Agricultural Science','Economics','Government','Literature in English',
  'Geography','Further Mathematics','Technical Drawing','Food & Nutrition',
  'Commerce','Accounting','Computer Studies','Civic Education',
  'Christian Religious Studies','Islamic Religious Studies',
  'French','Yoruba','Hausa','Igbo',
].map((s) => ({ value: s.toLowerCase().replace(/ /g, '_'), label: s }));

export const GRADES = [
  { value: 'A1', label: 'A1 – Excellent' },
  { value: 'B2', label: 'B2 – Very Good' },
  { value: 'B3', label: 'B3 – Good' },
  { value: 'C4', label: 'C4 – Credit' },
  { value: 'C5', label: 'C5 – Credit' },
  { value: 'C6', label: 'C6 – Credit' },
  { value: 'D7', label: 'D7 – Pass' },
  { value: 'E8', label: 'E8 – Pass' },
  { value: 'F9', label: 'F9 – Fail' },
];

export const FACULTIES = [
  { value: 'science', label: 'Faculty of Science' },
  { value: 'engineering', label: 'Faculty of Engineering' },
  { value: 'arts', label: 'Faculty of Arts & Humanities' },
  { value: 'social', label: 'Faculty of Social Sciences' },
  { value: 'management', label: 'Faculty of Management Sciences' },
  { value: 'law', label: 'Faculty of Law' },
];

export const PROGRAMME_TYPES = [
  { value: 'undergraduate', label: 'Undergraduate (B.Sc / B.A / LLB)' },
  { value: 'topup', label: 'Top-Up Degree' },
  { value: 'distance', label: 'Distance Learning' },
];

export const ENTRY_MODES = [
  { value: 'utme', label: 'UTME (100 Level)' },
  { value: 'direct', label: 'Direct Entry (200 Level)' },
];

export const EXAM_YEARS = Array.from({ length: 10 }, (_, i) => {
  const y = (new Date().getFullYear() - i).toString();
  return { value: y, label: y };
});

export const RELATIONSHIPS = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' },
];

export const BLOOD_GROUPS = [
  { value: 'A+', label: 'A+' },
  { value: 'O+', label: 'O+' },
  { value: 'B+', label: 'B+' },
  { value: 'AB+', label: 'AB+' },
  { value: 'A-', label: 'A-' },
  { value: 'O-', label: 'O-' },
  { value: 'B-', label: 'B-' },
  { value: 'AB-', label: 'AB-' },

];

export const GENOTYPES = [
  {value: 'AA', label: 'AA'},
  {value: 'AC', label: 'AC'},
  {value: 'AS', label: 'AS'},
  {value: 'SS', label: 'SS'},
  {value: 'SC', label: 'SC'},
]

export const STEPS = [
  { number: 1, label: 'BIO DATA' },
  { number: 2, label: 'CONTACT' },
  { number: 3, label: 'O-LEVEL' },
  { number: 4, label: 'PROGRAMME' },
  { number: 5, label: 'DECLARATION' },
] as const;


export const DEPARTMENTS_BY_FACULTY: Record<string, { value: string; label: string }[]> = {
	science: [
		{ value: "cs", label: "Computer Science" },
		{ value: "math", label: "Mathematics" },
		{ value: "physics", label: "Physics" },
		{ value: "chemistry", label: "Chemistry" },
		{ value: "biology", label: "Biology" },
	],
	engineering: [
		{ value: "civil", label: "Civil Engineering" },
		{ value: "electrical", label: "Electrical Engineering" },
		{ value: "mechanical", label: "Mechanical Engineering" },
		{ value: "chemical", label: "Chemical Engineering" },
	],
	arts: [
		{ value: "english", label: "English & Literary Studies" },
		{ value: "history", label: "History & International Studies" },
		{ value: "linguistics", label: "Linguistics" },
	],
	social: [
		{ value: "economics", label: "Economics" },
		{ value: "polisci", label: "Political Science" },
		{ value: "sociology", label: "Sociology" },
		{ value: "masscomm", label: "Mass Communication" },
	],
	management: [
		{ value: "accounting", label: "Accounting" },
		{ value: "business", label: "Business Administration" },
		{ value: "banking", label: "Banking & Finance" },
		{ value: "marketing", label: "Marketing" },
	],
	law: [
		{ value: "law", label: "Law (LLB)" },
	],
};

export const SECOND_CHOICE_PROGRAMMES = [
	{ value: "cs", label: "Computer Science" },
	{ value: "economics", label: "Economics" },
	{ value: "accounting", label: "Accounting" },
	{ value: "law", label: "Law (LLB)" },
	{ value: "business", label: "Business Administration" },
	{ value: "civil_eng", label: "Civil Engineering" },
	{ value: "masscomm", label: "Mass Communication" },
	{ value: "biology", label: "Biology" },
	{ value: "mathematics", label: "Mathematics" },
];

export const GRADUATION_YEARS = Array.from({ length: 15 }, (_, i) => {
	const y = (new Date().getFullYear() - i).toString();
	return { value: y, label: y };
});

export const CISCO_OPTIONS = [
	{ value: "yes", label: "Yes, I am interested" },
	{ value: "no", label: "No, I am not interested" },
];