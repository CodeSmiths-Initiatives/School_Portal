"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { StudentResult, CourseScore } from "./ResultsView";
import { gradeFromTotal, computeGPA } from "./ResultsView";

const DEPARTMENTS = ["Computer Science", "Engineering", "Nursing Science", "Pharmacy", "Law (LLB)", "Accounting"];
const LEVELS = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level"];
const SESSIONS = ["2025/2026", "2026/2027"];
const SEMESTERS: StudentResult["semester"][] = ["First Semester", "Second Semester"];

const DUMMY_COURSES: Omit<CourseScore, "ca" | "exam">[] = [
  { id: "c1", courseCode: "CSC201", courseTitle: "Data Structures", creditUnit: 3 },
  { id: "c2", courseCode: "CSC203", courseTitle: "Discrete Mathematics", creditUnit: 2 },
  { id: "c3", courseCode: "CSC205", courseTitle: "Computer Architecture", creditUnit: 3 },
  { id: "c4", courseCode: "GST201", courseTitle: "Use of English II", creditUnit: 2 },
  { id: "c5", courseCode: "CSC207", courseTitle: "Object Oriented Programming", creditUnit: 3 },
];

interface ResultEntryModalProps {
  existing: StudentResult | null;
  onClose: () => void;
  onSave: (row: StudentResult) => void;
}

export default function ResultEntryModal({ existing, onClose, onSave }: ResultEntryModalProps) {
  const [studentId, setStudentId] = useState(existing?.studentId ?? "");
  const [studentName, setStudentName] = useState(existing?.studentName ?? "");
  const [department, setDepartment] = useState(existing?.department ?? DEPARTMENTS[0]);
  const [level, setLevel] = useState(existing?.level ?? LEVELS[1]);
  const [session, setSession] = useState(existing?.session ?? SESSIONS[0]);
  const [semester, setSemester] = useState<StudentResult["semester"]>(existing?.semester ?? SEMESTERS[0]);
  const [courses, setCourses] = useState<CourseScore[]>(
    existing?.courses ?? DUMMY_COURSES.map((c) => ({ ...c, ca: 0, exam: 0 }))
  );

  const updateScore = (id: string, field: "ca" | "exam", value: number) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: Math.max(0, Math.min(field === "ca" ? 30 : 70, value)) } : c))
    );
  };

  const { gpa, totalUnits, totalQualityPoints } = computeGPA(courses);

  const handleSave = () => {
    if (!studentId.trim() || !studentName.trim()) return;
    onSave({
      id: existing?.id ?? Date.now().toString(),
      studentId: studentId.trim(),
      studentName: studentName.trim(),
      department,
      level,
      session,
      semester,
      courses,
      published: existing?.published ?? false,
    });
  };

  const inputClass =
    "w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#0D2B55] bg-[#f8fafc] " +
    "placeholder:text-[#9aa7bd] outline-none focus:bg-white focus:border-[#2E86C1] focus:ring-2 focus:ring-[#2E86C1]/15 transition-colors";

  const labelClass = "text-[11px] font-bold tracking-wider text-[#0D2B55] uppercase";

  return (
    <div className="fixed inset-0 bg-[#0a1230]/60 backdrop-blur-md z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto">

        {/* Navy header band */}
        <div className="bg-[#0D2B55] px-8 py-6 relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#E4A11B]">
            {existing ? "Update Entry" : "New Entry"}
          </p>
          <h2 className="mt-1 text-xl font-bold text-white">
            {existing ? "Edit Student Result" : "Add Student Result"}
          </h2>
          <p className="mt-1 text-sm text-[#9fb3d1] max-w-md">
            Enter CA and Exam scores per course. Grade, grade point, and GPA are calculated automatically.
          </p>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form body */}
        <div className="px-8 py-6 flex flex-col gap-5 max-h-[65vh] overflow-y-auto">

          {/* Student info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Student ID / REF</label>
              <input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. UAML8428K"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Full Name</label>
              <input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Adewale Musa"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Department</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass + " cursor-pointer"}>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass + " cursor-pointer"}>
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Session</label>
              <select value={session} onChange={(e) => setSession(e.target.value)} className={inputClass + " cursor-pointer"}>
                {SESSIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Semester</label>
              <select value={semester} onChange={(e) => setSemester(e.target.value as StudentResult["semester"])} className={inputClass + " cursor-pointer"}>
                {SEMESTERS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Course score table */}
          <div className="border-t border-[#eef3fb] pt-4">
            <p className={labelClass + " mb-3"}>Course Scores</p>
            <div className="overflow-x-auto rounded-xl border border-[#eef3fb]">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-[#f8fbff] border-b border-[#eef3fb]">
                    {["COURSE", "UNIT", "CA (/30)", "EXAM (/70)", "TOTAL", "GRADE"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold text-[#8395AF] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef3fb]">
                  {courses.map((c) => {
                    const total = c.ca + c.exam;
                    const { grade } = gradeFromTotal(total);
                    return (
                      <tr key={c.id}>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-[#0D2B55] text-xs">{c.courseCode}</p>
                          <p className="text-[#8395AF] text-[11px]">{c.courseTitle}</p>
                        </td>
                        <td className="px-3 py-2.5 text-[#60728f]">{c.creditUnit}</td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            min={0}
                            max={30}
                            value={c.ca}
                            onChange={(e) => updateScore(c.id, "ca", Number(e.target.value))}
                            className="w-16 border border-[#e2e8f0] rounded-lg px-2 py-1.5 text-sm text-[#0D2B55] bg-[#f8fafc] outline-none focus:border-[#2E86C1] focus:bg-white"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            min={0}
                            max={70}
                            value={c.exam}
                            onChange={(e) => updateScore(c.id, "exam", Number(e.target.value))}
                            className="w-16 border border-[#e2e8f0] rounded-lg px-2 py-1.5 text-sm text-[#0D2B55] bg-[#f8fafc] outline-none focus:border-[#2E86C1] focus:bg-white"
                          />
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-[#0D2B55]">{total}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            grade === "F" ? "bg-red-100 text-red-600" :
                            grade === "A" ? "bg-[#0D2B55] text-white" :
                            "bg-blue-100 text-[#2E86C1]"
                          }`}>
                            {grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* GPA summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Units", value: totalUnits },
              { label: "Quality Points", value: totalQualityPoints },
              { label: "Semester GPA", value: gpa.toFixed(2) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-[#eef3fb] bg-[#f8fbff] py-3 text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#8395AF]">{label}</p>
                <p className="mt-1 text-base font-bold text-[#0D2B55]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#eef0f4] px-8 py-5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#dbe5f1] text-sm font-semibold text-[#46557a] hover:bg-[#f8fafc] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!studentId.trim() || !studentName.trim()}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0D2B55] hover:bg-[#0a2244] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {existing ? "Save Changes" : "Add Result"}
          </button>
        </div>
      </div>
    </div>
  );
}