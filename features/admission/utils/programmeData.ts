

import { Programme, Faculty } from '@/features/admission/types/programme.types';

export const PROGRAMMES: Programme[] = [
  {
    id: 'undergraduate',
    label: 'Undergraduate',
    description: "Full-time 4-year bachelor's degree programme across all faculties",
  },
  {
    id: 'topup',
    label: 'Top-Up Degree',
    description: "Convert your HND or diploma into a full bachelor's degree (2 years)",
  },
  {
    id: 'distance',
    label: 'Distance Learning',
    description: 'Flexible online and hybrid learning for working professionals',
  },
];

export const FACULTIES: Faculty[] = [
  {
    id: 'science',
    label: 'Faculty of Science',
    departments: [
      { id: 'cs', label: 'Computer Science' },
      { id: 'math', label: 'Mathematics' },
      { id: 'physics', label: 'Physics' },
      { id: 'chemistry', label: 'Chemistry' },
      { id: 'biology', label: 'Biology' },
    ],
  },
  {
    id: 'engineering',
    label: 'Faculty of Engineering',
    departments: [
      { id: 'civil', label: 'Civil Engineering' },
      { id: 'electrical', label: 'Electrical Engineering' },
      { id: 'mechanical', label: 'Mechanical Engineering' },
      { id: 'chemical', label: 'Chemical Engineering' },
    ],
  },
  {
    id: 'arts',
    label: 'Faculty of Arts & Humanities',
    departments: [
      { id: 'english', label: 'English & Literary Studies' },
      { id: 'history', label: 'History & International Studies' },
      { id: 'linguistics', label: 'Linguistics' },
    ],
  },
  {
    id: 'social',
    label: 'Faculty of Social Sciences',
    departments: [
      { id: 'economics', label: 'Economics' },
      { id: 'polisci', label: 'Political Science' },
      { id: 'sociology', label: 'Sociology' },
      { id: 'masscomm', label: 'Mass Communication' },
    ],
  },
  {
    id: 'management',
    label: 'Faculty of Management Sciences',
    departments: [
      { id: 'accounting', label: 'Accounting' },
      { id: 'business', label: 'Business Administration' },
      { id: 'banking', label: 'Banking & Finance' },
      { id: 'marketing', label: 'Marketing' },
    ],
  },
  {
    id: 'law',
    label: 'Faculty of Law',
    departments: [{ id: 'law', label: 'Law (LLB)' }],
  },
];

// Flat options for <SelectField> — one entry per department
export const FACULTY_OPTIONS = FACULTIES.flatMap((f) =>
  f.departments.map((d) => ({
    value: `${f.id}::${d.id}`,
    label: `${d.label} — ${f.label}`,
  }))
);

export const ENTRY_SESSIONS: string[] = ['2025/2026', '2026/2027', '2027/2028', '2028/2029', '2029/2030'];

export const SESSION_OPTIONS = ENTRY_SESSIONS.map((s) => ({
  value: s,
  label: s,
}));