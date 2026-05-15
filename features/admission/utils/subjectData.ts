import { OLevelSubject, SubjectCategory } from "../types/biostep.types";


// compulsory = true means the subject is locked in and cannot be removed.
export const SUBJECT_TRACKS: Record<SubjectCategory, OLevelSubject[]> = {
  science: [
    { subject: 'English Language', grade: '', compulsory: true },
    { subject: 'Mathematics', grade: '', compulsory: true },
    { subject: 'Physics', grade: '', compulsory: true },
    { subject: 'Chemistry', grade: '', compulsory: true },
    { subject: 'Biology', grade: '', compulsory: false },
    { subject: 'Further Mathematics', grade: '', compulsory: false },
    { subject: 'Agricultural Science', grade: '', compulsory: false },
    { subject: 'Computer Studies', grade: '', compulsory: false },
    { subject: 'Geography', grade: '', compulsory: false },
  ],
  arts: [
    { subject: 'English Language', grade: '', compulsory: true },
    { subject: 'Mathematics', grade: '', compulsory: true },
    { subject: 'Government', grade: '', compulsory: true },
    { subject: 'Literature in English', grade: '', compulsory: true },
    { subject: 'History', grade: '', compulsory: true },
    { subject: 'Christian Religious Studies', grade: '', compulsory: false },
    { subject: 'Islamic Religious Studies', grade: '', compulsory: false },
    { subject: 'Yoruba', grade: '', compulsory: false },
    { subject: 'French', grade: '', compulsory: false },
  ],
  social: [
    { subject: 'English Language', grade: '', compulsory: true },
    { subject: 'Mathematics', grade: '', compulsory: true },
    { subject: 'Economics', grade: '', compulsory: true },
    { subject: 'Commerce', grade: '', compulsory: true },
    { subject: 'Accounting', grade: '', compulsory: true },
    { subject: 'Government', grade: '', compulsory: false },
    { subject: 'Geography', grade: '', compulsory: false },
    { subject: 'Civic Education', grade: '', compulsory: false },
    { subject: 'Marketing', grade: '', compulsory: false },
  ],
};

export const TRACK_META: Record<SubjectCategory, { label: string; emoji: string; color: string; border: string; text: string; bg: string }> = {
  science: {
    label: 'Science',
    emoji: '⚛️',
    color: '#0d1b3e',
    border: 'border-[#0d1b3e]',
    text: 'text-white',
    bg: 'bg-[#0d1b3e]',
  },
  arts: {
    label: 'Arts',
    emoji: '🎨',
    color: '#7c3aed',
    border: 'border-[#7c3aed]',
    text: 'text-white',
    bg: 'bg-[#7c3aed]',
  },
  social: {
    label: 'Social Sciences',
    emoji: '🔗',
    color: '#b45309',
    border: 'border-[#b45309]',
    text: 'text-white',
    bg: 'bg-[#b45309]',
  },
};