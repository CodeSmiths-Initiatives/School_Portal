// ─── Shared types ─────────────────────────────────────────────────────────────
// Keep types here, NOT inside component files.
// This eliminates the circular import where ProgrammeCard imported from
// a component that imported Programme which imported ProgrammeCard.

export type ProgrammeType = 'undergraduate' | 'topup' | 'distance';

export interface Programme {
  id: ProgrammeType;
  label: string;
  description: string;
}

export interface Faculty {
  id: string;
  label: string;
  departments: Department[];
}

export interface Department {
  id: string;
  label: string;
}

export interface ProgrammeFormData {
  programmeType: ProgrammeType | '';
  facultyId: string;
  entrySession: string;
}
