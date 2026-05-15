import { StatCard, Application, DepartmentBreakdown, ResultRow, CutOffEntry, TransferRow } from '../types/dashboard.types';

export const STAT_CARDS: StatCard[] = [
  { label: 'TOTAL', value: 1, sublabel: 'Registered this session', color: 'blue' },
  { label: 'ACCEPTANCE FEE PAID', value: 0, sublabel: '65% of total', color: 'green' },
  { label: 'ACCEPTANCE FEE PAID', value: 1, sublabel: 'Yet to pay', color: 'yellow' },
  { label: 'TOTAL REVENUE', value: 0, sublabel: 'From paid fees', color: 'red' },
  { label: 'ACCEPTANCE FEE PAID', value: 0, sublabel: 'Yet to pay', color: 'purple' },
];

export const MOCK_APPLICATIONS: Application[] = [
  {
    ref: 'UAMLB42WK',
    name: 'me you',
    firstChoice: 'Economics',
    altChoice: 'Mass Communication',
    olevels: 57,
    jambs: 78,
    combined: 65,
    status: 'Admitted',
  },
];

export const DEPARTMENT_BREAKDOWN: DepartmentBreakdown[] = [
  { department: 'Economics', count: 1, max: 5 },
];

export const DEPARTMENTS = [
  'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Economics', 'Accounting', 'Business Administration', 'Law (LLB)',
  'Mass Communication', 'Civil Engineering', 'Electrical Engineering',
];

export const COLOR_MAP: Record<StatCard['color'], { border: string; value: string; bg: string }> = {
  blue:   { border: 'border-t-blue-500',   value: 'text-blue-500',   bg: 'bg-blue-50' },
  green:  { border: 'border-t-green-500',  value: 'text-green-500',  bg: 'bg-green-50' },
  yellow: { border: 'border-t-yellow-500', value: 'text-yellow-500', bg: 'bg-yellow-50' },
  red:    { border: 'border-t-red-500',    value: 'text-red-500',    bg: 'bg-red-50' },
  purple: { border: 'border-t-purple-500', value: 'text-purple-500', bg: 'bg-purple-50' },
};

export const MOCK_TRANSFERS: TransferRow[] = [];
// empty by default — matches screenshot "No transfer requests"
 
// ─── Cut-Off Manager defaults ─────────────────────────────────────────────────
export const DEFAULT_CUTOFFS: CutOffEntry[] = [
  { id: '1',  department: 'Medicine & Surgery',  faculty: 'Health Science', minJamb: 280, minOLevel: 70, minCombined: 75, minGpa: 3.5 },
  { id: '2',  department: 'Pharmacy',             faculty: 'Health Science', minJamb: 260, minOLevel: 65, minCombined: 70, minGpa: 3.2 },
  { id: '3',  department: 'Nursing Science',      faculty: 'Health Science', minJamb: 240, minOLevel: 60, minCombined: 65, minGpa: 3.0 },
  { id: '4',  department: 'Law (LLB)',             faculty: 'Law',            minJamb: 260, minOLevel: 65, minCombined: 70, minGpa: 3.2 },
  { id: '5',  department: 'Engineering',           faculty: 'Engineering',    minJamb: 250, minOLevel: 62, minCombined: 68, minGpa: 3.0 },
  { id: '6',  department: 'Computer Science',      faculty: 'Science',        minJamb: 230, minOLevel: 58, minCombined: 63, minGpa: 2.8 },
  { id: '7',  department: 'Accounting',            faculty: 'Business',       minJamb: 220, minOLevel: 55, minCombined: 60, minGpa: 2.7 },
  { id: '8',  department: 'Economics',             faculty: 'Social Science', minJamb: 220, minOLevel: 55, minCombined: 60, minGpa: 2.7 },
  { id: '9',  department: 'English & Literature',  faculty: 'Arts',           minJamb: 200, minOLevel: 50, minCombined: 55, minGpa: 2.5 },
  { id: '10', department: 'Education',             faculty: 'Education',      minJamb: 180, minOLevel: 45, minCombined: 50, minGpa: 2.3 },
  { id: '11', department: 'Agriculture Science',   faculty: 'Agriculture',    minJamb: 180, minOLevel: 45, minCombined: 50, minGpa: 2.3 },
  { id: '12', department: 'Medicine & Surgery',    faculty: 'Health Science', minJamb: 210, minOLevel: 52, minCombined: 57, minGpa: 2.6 },
];
 
// ─── Admission Results mock data ──────────────────────────────────────────────
export const MOCK_RESULTS: ResultRow[] = [
  { ref: 'UAML8428K', name: 'me you', admittedTo: 'Pharmacy', combined: 65, cutoff: 70, gpa: 3.50, verdict: 'Admitted' },
  { ref: 'UAML8428K', name: 'me you', admittedTo: '',          combined: 82, cutoff: 75, gpa: 4.50, verdict: 'Pending' },
];
 
export const FACULTY_COLORS: Record<string, string> = {
  'Health Science': 'bg-blue-100 text-blue-700',
  'Law':            'bg-purple-100 text-purple-700',
  'Engineering':    'bg-orange-100 text-orange-700',
  'Science':        'bg-green-100 text-green-700',
  'Business':       'bg-yellow-100 text-yellow-700',
  'Social Science': 'bg-teal-100 text-teal-700',
  'Arts':           'bg-pink-100 text-pink-700',
  'Education':      'bg-indigo-100 text-indigo-700',
  'Agriculture':    'bg-lime-100 text-lime-700',
};