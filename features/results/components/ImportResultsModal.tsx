"use client";

import { useState, useRef } from "react";
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";
import type { StudentResult, CourseScore } from "./ResultsView";

// ── Dummy course list this class is taking (would come from Course Management) ──
const CLASS_COURSES: Omit<CourseScore, "ca" | "exam">[] = [
  { id: "c1", courseCode: "CSC201", courseTitle: "Data Structures", creditUnit: 3 },
  { id: "c2", courseCode: "CSC203", courseTitle: "Discrete Mathematics", creditUnit: 2 },
  { id: "c3", courseCode: "CSC205", courseTitle: "Computer Architecture", creditUnit: 3 },
  { id: "c4", courseCode: "GST201", courseTitle: "Use of English II", creditUnit: 2 },
  { id: "c5", courseCode: "CSC207", courseTitle: "Object Oriented Programming", creditUnit: 3 },
];

interface ParsedRow {
  studentId: string;
  studentName: string;
  courses: CourseScore[];
  errors: string[];
}

interface ImportResultsModalProps {
  department: string;
  level: string;
  session: string;
  semester: StudentResult["semester"];
  onClose: () => void;
  onImport: (rows: StudentResult[]) => void;
}

export default function ImportResultsModal({
  department,
  level,
  session,
  semester,
  onClose,
  onImport,
}: ImportResultsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // ── Download template ──
  const handleDownloadTemplate = () => {
    const headerRow1: string[] = ["Student ID", "Full Name"];
    const headerRow2: string[] = ["", ""];
    CLASS_COURSES.forEach((c) => {
      headerRow1.push(`${c.courseCode}`, "");
      headerRow2.push("CA (/30)", "Exam (/70)");
    });

    const sampleRow = ["UAML8428K", "Adewale Musa", ...CLASS_COURSES.flatMap(() => ["", ""])];

    const ws = XLSX.utils.aoa_to_sheet([headerRow1, headerRow2, sampleRow]);

    // merge course code header cells across CA/Exam pair
    ws["!merges"] = CLASS_COURSES.map((_, i) => ({
      s: { r: 0, c: 2 + i * 2 },
      e: { r: 0, c: 3 + i * 2 },
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results Template");
    XLSX.writeFile(wb, `results_template_${department.replace(/\s+/g, "_")}_${level.replace(/\s+/g, "_")}.xlsx`);
  };

  // ── Parse uploaded file ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = [".xlsx", ".xls"];
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
    const hasValidType = validTypes.includes(file.type);

    if (!hasValidExtension || (file.type && !hasValidType)) {
      setFileName(file.name);
      setParsedRows([]);
      setParseError("Only .xlsx or .xls files are supported. Please upload a valid Excel file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFileName(file.name);
    setParseError(null);
    setParsedRows([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: "binary" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        // rows[0] = course code headers, rows[1] = CA/Exam sub-headers, rows[2+] = data
        if (rows.length < 3) {
          setParseError("File doesn't have enough rows. Use the template format.");
          return;
        }

        const dataRows = rows.slice(2).filter((r) => r[0]); // skip empty rows

        const seenIds = new Map<string, number>(); // studentId -> count
        dataRows.forEach((r) => {
          const id = String(r[0] ?? "").trim();
          if (id) seenIds.set(id, (seenIds.get(id) || 0) + 1);
        });

        const result: ParsedRow[] = dataRows.map((r) => {
          const studentId = String(r[0] ?? "").trim();
          const studentName = String(r[1] ?? "").trim();
          const errors: string[] = [];
          const courses: CourseScore[] = CLASS_COURSES.map((course, i) => {
            const caRaw = r[2 + i * 2];
            const examRaw = r[3 + i * 2];
            const ca = Number(caRaw) || 0;
            const exam = Number(examRaw) || 0;
            if (ca > 30) errors.push(`${course.courseCode} CA exceeds 30`);
            if (exam > 70) errors.push(`${course.courseCode} Exam exceeds 70`);
            return { ...course, ca, exam };
          });

          if (!studentId) errors.push("Missing Student ID");
          if (!studentName) errors.push("Missing Name");
          if (studentId && (seenIds.get(studentId) || 0) > 1) {
            errors.push("Duplicate Student ID in this file");
          }

          return { studentId, studentName, courses, errors };
        });

        setParsedRows(result);
      } catch {
        setParseError("Couldn't read this file. Make sure it's a valid .xlsx file using the template.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const validRows = parsedRows.filter((r) => r.errors.length === 0);
  const invalidRows = parsedRows.filter((r) => r.errors.length > 0);

  const handleConfirmImport = () => {
    const results: StudentResult[] = validRows.map((r) => ({
      id: `${r.studentId}-${Date.now()}`,
      studentId: r.studentId,
      studentName: r.studentName,
      department,
      level,
      session,
      semester,
      courses: r.courses,
      published: false,
    }));
    onImport(results);
  };

  return (
    <div className="fixed inset-0 bg-[#0a1230]/60 backdrop-blur-md z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto">

        {/* Navy header */}
        <div className="bg-[#0D2B55] px-8 py-6 relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#E4A11B]">Bulk Entry</p>
          <h2 className="mt-1 text-xl font-bold text-white">Import Results from Excel</h2>
          <p className="mt-1 text-sm text-[#9fb3d1] max-w-lg">
            Download the template, fill in CA and Exam scores for the whole class, then upload it here.
            Applies to <strong className="text-white">{department}</strong> · {level} · {semester} ({session}).
          </p>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5 max-h-[65vh] overflow-y-auto">

          {/* Step 1: Download template */}
          <div className="rounded-2xl border border-[#eef3fb] bg-[#f8fbff] p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#dde8f5] flex items-center justify-center text-[#3d5a9e] shrink-0">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0D2B55]">Step 1 — Download the template</p>
                <p className="text-xs text-[#60728f] mt-0.5">Pre-filled with {CLASS_COURSES.length} courses for this class</p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-[#2E86C1] text-[#2E86C1] hover:bg-blue-50 transition-colors whitespace-nowrap"
            >
              <Download size={15} /> Download Template
            </button>
          </div>

          {/* Step 2: Upload */}
          <div className="rounded-2xl border border-dashed border-[#2E86C1]/40 bg-white p-5">
            <p className="text-sm font-semibold text-[#0D2B55] mb-1">Step 2 — Upload completed file</p>
            <p className="text-xs text-[#60728f] mb-3">.xlsx files only</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#0D2B55] hover:bg-[#0a2244] text-white transition-colors"
            >
              <Upload size={15} /> Choose File
            </button>
            {fileName && <p className="mt-2 text-xs text-[#60728f]">Selected: {fileName}</p>}
            {parseError && (
              <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {parseError}
              </div>
            )}
          </div>

          {/* Preview */}
          {parsedRows.length > 0 && (
            <div className="border-t border-[#eef3fb] pt-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-sm font-semibold text-[#0D2B55]">Preview ({parsedRows.length} rows)</p>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                    <CheckCircle2 size={13} /> {validRows.length} valid
                  </span>
                  {invalidRows.length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                      <AlertCircle size={13} /> {invalidRows.length} with errors
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#eef3fb] max-h-64 overflow-y-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="sticky top-0 bg-[#f8fbff]">
                    <tr className="border-b border-[#eef3fb]">
                      <th className="px-3 py-2.5 text-left text-[10px] font-bold text-[#8395AF] uppercase">Student ID</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-bold text-[#8395AF] uppercase">Name</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-bold text-[#8395AF] uppercase">Courses</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-bold text-[#8395AF] uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef3fb]">
                    {parsedRows.map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2.5 text-xs font-mono text-[#8395AF]">{r.studentId || "—"}</td>
                        <td className="px-3 py-2.5 font-semibold text-[#0D2B55]">{r.studentName || "—"}</td>
                        <td className="px-3 py-2.5 text-xs text-[#60728f]">{r.courses.length} courses</td>
                        <td className="px-3 py-2.5">
                          {r.errors.length === 0 ? (
                            <span className="text-xs font-semibold text-emerald-700">Ready</span>
                          ) : (
                            <span className="text-xs font-semibold text-red-600" title={r.errors.join(", ")}>
                              {r.errors.length} issue{r.errors.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
            onClick={handleConfirmImport}
            disabled={validRows.length === 0}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0D2B55] hover:bg-[#0a2244] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Import {validRows.length > 0 ? `${validRows.length} ` : ""}Result{validRows.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}