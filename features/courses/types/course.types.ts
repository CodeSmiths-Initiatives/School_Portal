export type Role = 'Lecturer' | 'HOD' | 'Student';
export type NavPage = 'courses-definitions' | 'allocate-to-levels' | 'timetable' | 'hod-approval';
export type CourseType = 'Core' | 'Elective' | 'Required' | 'Borrowed' | 'Carryover';
export type CourseStatus = 'Pending' | 'Approved' | 'Rejected';
export type Level = '100L' | '200L' | '300L' | '400L';
export type Mode = 'On-Site' | 'Online' | 'Hybrid';

export interface Course {
  id: string;
  code: string;
  department: string;
  title: string;
  description: string;
  type: CourseType;
  units: number;
  levels: Level[];
  mode: Mode;
  schedule: string;
  lecturer: string;
  status: CourseStatus;
  approvalNote?: string;
}

export interface TimetableEntry {
  id?: string;
  day: string;
  time: string;
  course: string;
  code: string;
  room: string;
  level: Level;
  mode?: Mode;
  courseId?: string;
}

export interface TimelineSlot {
  id: string;
  code: string;
  course: string;
  day: string;
  time: string;
  room: string;
  mode: Mode;
  level: Level;
  courseId?: string;
}
