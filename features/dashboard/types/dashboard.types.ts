export type TabKey = 'dashboard' | 'application' | 'transfer' | 'cutoff' | 'result';

export interface StatCard {
  label: string;
  value: number | string;
  sublabel: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export interface Application {
  ref: string;
  name: string;
  firstChoice: string;
  altChoice: string;
  olevels: number;
  jambs: number;
  combined: number;
  status: 'Pending' | 'Admitted' | 'Rejected';
}

export interface DepartmentBreakdown {
  department: string;
  count: number;
  max: number;
}

// Modal transfer request (from application table actions)
export interface TransferRequest {
  ref: string;
  name: string;
  currentDepartment: string;
  initiatedBy: string;
}

// Transfer tab row
export interface TransferRow {
  id: string;
  applicant: string;
  from: string;
  to: string;
  reason: string;
  score: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}

// Cut-off manager
export interface CutOffEntry {
  id: string;
  department: string;
  faculty: string;
  minJamb: number;
  minOLevel: number;
  minCombined: number;
  minGpa: number;
}

// Results
export interface ResultRow {
  ref: string;
  name: string;
  admittedTo: string;
  combined: number;
  cutoff: number;
  gpa: number;
  verdict: 'Admitted' | 'Pending' | 'Rejected';
}