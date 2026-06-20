"use client";

import { useState } from "react";
import { Upload, Megaphone, Download, RotateCcw, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useRef, useEffect } from "react";
import ResultEntryModal from "./ResultEntryModal";
import DeleteResultModal from "./DeleteResultModal";
import ImportResultsModal from "./ImportResultsModal";

// ── Types ─────────────────────────────────────────────────────────────────────
export type Grade = "A" | "B" | "C" | "D" | "E" | "F";

export interface CourseScore {
  id: string;
  courseCode: string;
  courseTitle: string;
  creditUnit: number;
  ca: number;     // out of 30
  exam: number;   // out of 70
}

export interface StudentResult {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  level: string;          // e.g. "200 Level"
  session: string;        // e.g. "2025/2026"
  semester: "First Semester" | "Second Semester";
  courses: CourseScore[];
  published: boolean;
}

// ── Grading logic ─────────────────────────────────────────────────────────────
export function gradeFromTotal(total: number): { grade: Grade; point: number } {
  if (total >= 70) return { grade: "A", point: 5 };
  if (total >= 60) return { grade: "B", point: 4 };
  if (total >= 50) return { grade: "C", point: 3 };
  if (total >= 45) return { grade: "D", point: 2 };
  if (total >= 40) return { grade: "E", point: 1 };
  return { grade: "F", point: 0 };
}

export function computeGPA(courses: CourseScore[]) {
  let totalQualityPoints = 0;
  let totalUnits = 0;
  courses.forEach((c) => {
    const total = c.ca + c.exam;
    const { point } = gradeFromTotal(total);
    totalQualityPoints += point * c.creditUnit;
    totalUnits += c.creditUnit;
  });
  const gpa = totalUnits > 0 ? totalQualityPoints / totalUnits : 0;
  return { gpa: Math.round(gpa * 100) / 100, totalUnits, totalQualityPoints };
}

// ── Dummy data ────────────────────────────────────────────────────────────────
const DUMMY_COURSES: Omit<CourseScore, "ca" | "exam">[] = [
  { id: "c1", courseCode: "CSC201", courseTitle: "Data Structures", creditUnit: 3 },
  { id: "c2", courseCode: "CSC203", courseTitle: "Discrete Mathematics", creditUnit: 2 },
  { id: "c3", courseCode: "CSC205", courseTitle: "Computer Architecture", creditUnit: 3 },
  { id: "c4", courseCode: "GST201", courseTitle: "Use of English II", creditUnit: 2 },
  { id: "c5", courseCode: "CSC207", courseTitle: "Object Oriented Programming", creditUnit: 3 },
];

function makeDummyResult(id: string, name: string, studentId: string, department: string): StudentResult {
  return {
    id,
    studentId,
    studentName: name,
    department,
    level: "200 Level",
    session: "2025/2026",
    semester: "First Semester",
    published: false,
    courses: DUMMY_COURSES.map((c, i) => ({
      ...c,
      ca: 18 + ((i * 3) % 12),
      exam: 40 + ((i * 7) % 30),
    })),
  };
}

const INITIAL_RESULTS: StudentResult[] = [
  makeDummyResult("1", "Adewale Musa", "UAML8428K", "Computer Science"),
  makeDummyResult("2", "Fatima Bello", "UAML9312B", "Computer Science"),
  makeDummyResult("3", "Emeka Okafor", "UAML7741C", "Engineering"),
  makeDummyResult("4", "Ngozi Adaeze", "UAML5523D", "Nursing Science"),
];

// ── Sub-components ────────────────────────────────────────────────────────────
function GPABadge({ gpa }: { gpa: number }) {
  const color =
    gpa >= 4.5 ? "bg-[#0D2B55] text-white" :
    gpa >= 3.5 ? "bg-blue-100 text-[#2E86C1]" :
    gpa >= 2.0 ? "bg-amber-100 text-amber-700" :
    "bg-red-100 text-red-600";
  return <span className={`px-3 py-1 rounded-full text-xs font-bold ${color}`}>{gpa.toFixed(2)}</span>;
}

function PublishBadge({ published }: { published: boolean }) {
  return published ? (
    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-[#2E86C1] border border-blue-300">Published</span>
  ) : (
    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-300">Draft</span>
  );
}

function ActionMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8a9ab5] hover:bg-[#f1f5fb] hover:text-[#0D2B55] transition-colors"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-10 w-36 bg-white rounded-xl border border-[#dce6f2] shadow-lg overflow-hidden">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#0D2B55] hover:bg-[#f8fbff] transition-colors"
          >
            <Pencil size={14} className="text-[#2E86C1]" /> Edit
          </button>
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface ResultsViewProps {
  collegeSlug: string;
}

const DEFAULT_FILTERS = { department: "All", semester: "All" };

export default function ResultsView({ collegeSlug }: ResultsViewProps) {
  const [results, setResults] = useState<StudentResult[]>(INITIAL_RESULTS);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingResult, setEditingResult] = useState<StudentResult | null>(null);
  const [deletingResult, setDeletingResult] = useState<StudentResult | null>(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const departments = ["All", ...Array.from(new Set(results.map((r) => r.department)))];
  const semesters = ["All", "First Semester", "Second Semester"];

  const filtered = results.filter((r) => {
    const matchDept = filters.department === "All" || r.department === filters.department;
    const matchSem = filters.semester === "All" || r.semester === filters.semester;
    return matchDept && matchSem;
  });

  const stats = {
    total: results.length,
    published: results.filter((r) => r.published).length,
    avgGPA: results.length
      ? (results.reduce((sum, r) => sum + computeGPA(r.courses).gpa, 0) / results.length).toFixed(2)
      : "0.00",
    firstClass: results.filter((r) => computeGPA(r.courses).gpa >= 4.5).length,
  };

  const handleSave = (row: StudentResult) => {
    setResults((prev) =>
      prev.some((r) => r.id === row.id) ? prev.map((r) => (r.id === row.id ? row : r)) : [...prev, row]
    );
    setShowModal(false);
    setEditingResult(null);
  };

  const handleImport = (rows: StudentResult[]) => {
    setResults((prev) => {
      const merged = [...prev];
      rows.forEach((row) => {
        const existingIdx = merged.findIndex(
          (r) => r.studentId === row.studentId && r.semester === row.semester && r.session === row.session
        );
        if (existingIdx >= 0) {
          merged[existingIdx] = { ...merged[existingIdx], courses: row.courses };
        } else {
          merged.push(row);
        }
      });
      return merged;
    });
    setShowImportModal(false);
  };

  const handlePublishAll = () => {
    setResults((prev) => prev.map((r) => ({ ...r, published: true })));
  };

  const handleConfirmDelete = () => {
    if (!deletingResult) return;
    setResults((prev) => prev.filter((r) => r.id !== deletingResult.id));
    setDeletingResult(null);
  };

  const handleExportCSV = () => {
    const headers = ["STUDENT ID", "NAME", "DEPARTMENT", "LEVEL", "SESSION", "SEMESTER", "GPA", "STATUS"];
    const rows = filtered.map((r) => {
      const { gpa } = computeGPA(r.courses);
      return [r.studentId, r.studentName, r.department, r.level, r.session, r.semester, gpa, r.published ? "Published" : "Draft"].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `results_${collegeSlug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtersActive = filters.department !== "All" || filters.semester !== "All";

  return (
    <div className="space-y-5">

      {/* ── 1. Analytics ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total Students", value: stats.total, color: "text-[#0D2B55]" },
          { label: "Published Results", value: stats.published, color: "text-[#2E86C1]" },
          { label: "Average GPA", value: stats.avgGPA, color: "text-amber-600" },
          { label: "First Class (4.5+)", value: stats.firstClass, color: "text-emerald-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-[#dbe5f1] bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-[#8395AF]">{label}</p>
            <p className={`mt-2 text-2xl sm:text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── 2. Filters (with Reset) ── */}
      <div className="rounded-2xl border border-[#dbe5f1] bg-white shadow-sm p-4 sm:p-5">
        <div className="flex flex-col gap-4">

          {/* Filters row */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
            <div className="flex flex-col gap-1 min-w-[160px] flex-1 max-w-xs">
              <label className="text-[10px] font-bold tracking-widest text-[#4a5a7a] uppercase">Department</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
                className="h-10 text-sm border border-[#dce6f2] rounded-xl px-3 text-[#0D2B55] bg-white outline-none focus:border-[#2E86C1] focus:ring-2 focus:ring-[#2E86C1]/15"
              >
                {departments.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1 min-w-[160px] flex-1 max-w-xs">
              <label className="text-[10px] font-bold tracking-widest text-[#4a5a7a] uppercase">Semester</label>
              <select
                value={filters.semester}
                onChange={(e) => setFilters((f) => ({ ...f, semester: e.target.value }))}
                className="h-10 text-sm border border-[#dce6f2] rounded-xl px-3 text-[#0D2B55] bg-white outline-none focus:border-[#2E86C1] focus:ring-2 focus:ring-[#2E86C1]/15"
              >
                {semesters.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              disabled={!filtersActive}
              className="h-10 flex items-center justify-center gap-1.5 px-4 rounded-xl text-sm font-semibold border border-[#dce6f2] text-[#4a5a7a] hover:border-[#8a9ab5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          {/* Actions row — 3 buttons, evenly aligned */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-[#eef3fb]">
            <button
              onClick={handlePublishAll}
              className="h-10 flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-semibold bg-[#2E86C1] hover:bg-[#1a6fa8] text-white transition-colors"
            >
              <Megaphone size={15} /> Publish All
            </button>
            <button
              onClick={handleExportCSV}
              className="h-10 flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-semibold border border-[#2E86C1] text-[#2E86C1] hover:bg-blue-50 transition-colors"
            >
              <Download size={15} /> Export CSV
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="h-10 flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-semibold bg-[#0D2B55] hover:bg-[#0a2244] text-white transition-colors"
            >
              <Upload size={15} /> Import Excel
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Table ── */}
      <div className="rounded-2xl border border-[#dbe5f1] bg-white shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 pt-5 pb-3">
          <h3 className="text-[#0D2B55] font-semibold text-base">Student Results</h3>
          <p className="text-[#60728f] text-xs sm:text-sm mt-0.5">Manage and publish semester results per student.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="bg-[#f8fbff] border-t border-b border-[#eef3fb]">
                {["STUDENT ID", "NAME", "DEPARTMENT", "LEVEL", "SEMESTER", "UNITS", "GPA", "STATUS", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-[#8a9ab5] uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef3fb]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-[#8a9ab5] text-sm">
                    No results found.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const { gpa, totalUnits } = computeGPA(row.courses);
                  return (
                    <tr key={row.id} className="hover:bg-[#f8fbff] transition-colors">
                      <td className="px-4 py-4 text-[#8a9ab5] text-xs font-mono">{row.studentId}</td>
                      <td className="px-4 py-4 font-semibold text-[#0D2B55] whitespace-nowrap">{row.studentName}</td>
                      <td className="px-4 py-4 text-[#60728f] whitespace-nowrap">{row.department}</td>
                      <td className="px-4 py-4 text-[#60728f] whitespace-nowrap">{row.level}</td>
                      <td className="px-4 py-4 text-[#60728f] whitespace-nowrap">{row.semester}</td>
                      <td className="px-4 py-4 text-[#60728f]">{totalUnits}</td>
                      <td className="px-4 py-4"><GPABadge gpa={gpa} /></td>
                      <td className="px-4 py-4"><PublishBadge published={row.published} /></td>
                      <td className="px-4 py-4 text-right">
                        <ActionMenu
                          onEdit={() => { setEditingResult(row); setShowModal(true); }}
                          onDelete={() => setDeletingResult(row)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Grading Scale ── */}
      <div className="rounded-2xl border border-[#dbe5f1] bg-white shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 rounded bg-[#2E86C1]" />
          <h4 className="font-semibold text-[#0D2B55] text-sm">Grading Scale</h4>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { grade: "A", range: "70-100", point: "5.0" },
            { grade: "B", range: "60-69", point: "4.0" },
            { grade: "C", range: "50-59", point: "3.0" },
            { grade: "D", range: "45-49", point: "2.0" },
            { grade: "E", range: "40-44", point: "1.0" },
            { grade: "F", range: "0-39", point: "0.0" },
          ].map(({ grade, range, point }) => (
            <div key={grade} className="rounded-xl border border-[#eef3fb] bg-[#f8fbff] p-3 text-center">
              <p className="text-lg font-bold text-[#0D2B55]">{grade}</p>
              <p className="text-[11px] text-[#60728f] mt-0.5">{range}</p>
              <p className="text-[11px] text-[#2E86C1] font-semibold">{point} pts</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-[#60728f]">
          GPA = Σ(Grade Point × Credit Unit) ÷ Σ(Credit Unit)
        </p>
      </div>

      {/* ── Modals ── */}
      {showImportModal && (
        <ImportResultsModal
          department={filters.department !== "All" ? filters.department : "Computer Science"}
          level="200 Level"
          session="2025/2026"
          semester={filters.semester !== "All" ? (filters.semester as StudentResult["semester"]) : "First Semester"}
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
      )}
      {showModal && (
        <ResultEntryModal
          existing={editingResult}
          onClose={() => { setShowModal(false); setEditingResult(null); }}
          onSave={handleSave}
        />
      )}
      {deletingResult && (
        <DeleteResultModal
          studentName={deletingResult.studentName}
          studentId={deletingResult.studentId}
          onClose={() => setDeletingResult(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}