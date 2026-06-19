"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Pencil, Trash2, Download, Megaphone, Plus, RotateCcw } from "lucide-react";
import ResultModal from "./ResultModal";
import DeleteResultModal from "./DeleteResultModal";

// ── Types ─────────────────────────────────────────────────────────────────────
export type Verdict = "Admitted" | "Pending" | "Rejected";

export interface ResultRow {
  id: string;
  ref: string;
  name: string;
  department: string;
  jamb: number;
  oLevelPercent: number;
  combined: number;
  cutOff: number;
  gpa: number;
  verdict: Verdict;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcCombined(jamb: number, oLevel: number) {
  const jambPercent = (jamb / 400) * 100;
  return Math.round(oLevel * 0.4 + jambPercent * 0.6);
}
function calcGPA(combined: number) {
  if (combined >= 85) return 5.0;
  if (combined >= 75) return 4.5;
  if (combined >= 65) return 4.0;
  if (combined >= 55) return 3.5;
  if (combined >= 45) return 3.0;
  if (combined >= 40) return 2.0;
  return 1.0;
}
function calcVerdict(combined: number, cutOff: number): Verdict {
  if (combined >= cutOff) return "Admitted";
  if (combined >= cutOff - 10) return "Pending";
  return "Rejected";
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const INITIAL_RESULTS: ResultRow[] = [
  { id: "1", ref: "UAML8428K", name: "Adewale Musa", department: "Pharmacy", jamb: 260, oLevelPercent: 72, combined: calcCombined(260, 72), cutOff: 70, gpa: calcGPA(calcCombined(260, 72)), verdict: calcVerdict(calcCombined(260, 72), 70) },
  { id: "2", ref: "UAML9312B", name: "Fatima Bello", department: "Computer Science", jamb: 310, oLevelPercent: 85, combined: calcCombined(310, 85), cutOff: 75, gpa: calcGPA(calcCombined(310, 85)), verdict: calcVerdict(calcCombined(310, 85), 75) },
  { id: "3", ref: "UAML7741C", name: "Emeka Okafor", department: "Engineering", jamb: 230, oLevelPercent: 60, combined: calcCombined(230, 60), cutOff: 68, gpa: calcGPA(calcCombined(230, 60)), verdict: calcVerdict(calcCombined(230, 60), 68) },
  { id: "4", ref: "UAML5523D", name: "Ngozi Adaeze", department: "Nursing Science", jamb: 200, oLevelPercent: 55, combined: calcCombined(200, 55), cutOff: 65, gpa: calcGPA(calcCombined(200, 55)), verdict: calcVerdict(calcCombined(200, 55), 65) },
  { id: "5", ref: "UAML3391E", name: "Yusuf Abdullahi", department: "Law (LLB)", jamb: 280, oLevelPercent: 78, combined: calcCombined(280, 78), cutOff: 70, gpa: calcGPA(calcCombined(280, 78)), verdict: calcVerdict(calcCombined(280, 78), 70) },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const styles: Record<Verdict, string> = {
    Admitted: "bg-[#dde8f5] text-[#3d5a9e]",
    Pending: "bg-orange-50 text-orange-600",
    Rejected: "bg-red-50 text-red-600",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[verdict]}`}>
      {verdict}
    </span>
  );
}

function CombinedBadge({ value, cutOff }: { value: number; cutOff: number }) {
  const color =
    value >= cutOff ? "bg-[#1a2b52] text-white" :
    value >= cutOff - 10 ? "bg-orange-50 text-orange-600" :
    "bg-red-50 text-red-600";
  return <span className={`px-3 py-1 rounded-full text-xs font-bold ${color}`}>{value}%</span>;
}

// 3-dot action menu
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
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8a9ab5] hover:bg-[#f1f5fb] hover:text-[#1a2b52] transition-colors"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-10 w-36 bg-white rounded-xl border border-[#dce6f2] shadow-lg overflow-hidden">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#1a2b52] hover:bg-[#f8fbff] transition-colors"
          >
            <Pencil size={14} className="text-[#3d5a9e]" /> Edit
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

const DEFAULT_FILTERS = { department: "All", verdict: "All" as "All" | Verdict };

export default function ResultsView({ collegeSlug }: ResultsViewProps) {
  const [results, setResults] = useState<ResultRow[]>(INITIAL_RESULTS);
  const [published, setPublished] = useState(false);

  const [showResultModal, setShowResultModal] = useState(false);
  const [editingRow, setEditingRow] = useState<ResultRow | null>(null);
  const [deletingRow, setDeletingRow] = useState<ResultRow | null>(null);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const departments = ["All", ...Array.from(new Set(results.map((r) => r.department)))];

  const filtered = results.filter((r) => {
    const matchVerdict = filters.verdict === "All" || r.verdict === filters.verdict;
    const matchDept = filters.department === "All" || r.department === filters.department;
    return matchVerdict && matchDept;
  });

  const stats = {
    total: results.length,
    admitted: results.filter((r) => r.verdict === "Admitted").length,
    pending: results.filter((r) => r.verdict === "Pending").length,
    rejected: results.filter((r) => r.verdict === "Rejected").length,
  };

  const handleSave = (row: ResultRow) => {
    setResults((prev) =>
      prev.some((r) => r.id === row.id) ? prev.map((r) => (r.id === row.id ? row : r)) : [...prev, row]
    );
    setShowResultModal(false);
    setEditingRow(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingRow) return;
    setResults((prev) => prev.filter((r) => r.id !== deletingRow.id));
    setDeletingRow(null);
  };

  const handleExportCSV = () => {
    const headers = ["REF", "NAME", "DEPARTMENT", "JAMB", "O-LEVEL %", "COMBINED %", "CUT-OFF %", "GPA", "VERDICT"];
    const rows = results.map((r) =>
      [r.ref, r.name, r.department, r.jamb, r.oLevelPercent, r.combined, r.cutOff, r.gpa, r.verdict].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admission_results_${collegeSlug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtersActive = filters.department !== "All" || filters.verdict !== "All";

  return (
    <div className="space-y-5">

      {/* ── 1. Analytics ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total Applicants", value: stats.total, color: "text-[#1a2b52]" },
          { label: "Admitted", value: stats.admitted, color: "text-[#3d5a9e]" },
          { label: "Pending", value: stats.pending, color: "text-orange-600" },
          { label: "Rejected", value: stats.rejected, color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-[#dbe5f1] bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-[#8395AF]">{label}</p>
            <p className={`mt-2 text-2xl sm:text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── 2. Filters (with Reset) ── */}
      <div className="rounded-2xl border border-[#dbe5f1] bg-white shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex flex-col gap-1 min-w-[150px] flex-1">
            <label className="text-[10px] font-bold tracking-widest text-[#4a5a7a] uppercase">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
              className="text-sm border border-[#dce6f2] rounded-xl px-3 py-2 text-[#1a2b52] bg-white outline-none focus:border-[#3d5a9e] focus:ring-2 focus:ring-[#3d5a9e]/15"
            >
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[150px] flex-1">
            <label className="text-[10px] font-bold tracking-widest text-[#4a5a7a] uppercase">Verdict</label>
            <select
              value={filters.verdict}
              onChange={(e) => setFilters((f) => ({ ...f, verdict: e.target.value as "All" | Verdict }))}
              className="text-sm border border-[#dce6f2] rounded-xl px-3 py-2 text-[#1a2b52] bg-white outline-none focus:border-[#3d5a9e] focus:ring-2 focus:ring-[#3d5a9e]/15"
            >
              {["All", "Admitted", "Pending", "Rejected"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>

          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            disabled={!filtersActive}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-[#dce6f2] text-[#4a5a7a] hover:border-[#8a9ab5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-end sm:self-auto"
          >
            <RotateCcw size={14} /> Reset
          </button>

          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            <button
              onClick={() => setPublished(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                published ? "bg-[#1a2b52] text-white cursor-default" : "bg-[#3d5a9e] hover:bg-[#33497f] text-white"
              }`}
            >
              <Megaphone size={15} />
              {published ? "Published" : "Publish Results"}
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-[#3d5a9e] text-[#3d5a9e] hover:bg-[#f1f5fb] transition-colors"
            >
              <Download size={15} /> Export CSV
            </button>
            <button
              onClick={() => { setEditingRow(null); setShowResultModal(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#1a2b52] hover:bg-[#13203d] text-white transition-colors"
            >
              <Plus size={15} /> Add Result
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Table ── */}
      <div className="rounded-2xl border border-[#dbe5f1] bg-white shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 pt-5 pb-3">
          <h3 className="text-[#1a2b52] font-semibold text-base">Admission Results</h3>
          <p className="text-[#60728f] text-xs sm:text-sm mt-0.5">Manage and publish admission results for all applicants.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-[#f8fbff] border-t border-b border-[#eef3fb]">
                {["REF", "NAME", "DEPARTMENT", "JAMB", "O-LEVEL", "COMBINED", "CUT-OFF", "GPA", "VERDICT", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-[#8a9ab5] uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef3fb]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-[#8a9ab5] text-sm">
                    No results found.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-[#f8fbff] transition-colors">
                    <td className="px-4 py-4 text-[#8a9ab5] text-xs font-mono">{row.ref}</td>
                    <td className="px-4 py-4 font-semibold text-[#1a2b52] whitespace-nowrap">{row.name}</td>
                    <td className="px-4 py-4 text-[#60728f] whitespace-nowrap">{row.department}</td>
                    <td className="px-4 py-4 text-[#60728f]">{row.jamb}</td>
                    <td className="px-4 py-4 text-[#60728f]">{row.oLevelPercent}%</td>
                    <td className="px-4 py-4"><CombinedBadge value={row.combined} cutOff={row.cutOff} /></td>
                    <td className="px-4 py-4 text-[#60728f]">{row.cutOff}%</td>
                    <td className="px-4 py-4 font-semibold text-[#3d5a9e]">{row.gpa.toFixed(1)}</td>
                    <td className="px-4 py-4"><VerdictBadge verdict={row.verdict} /></td>
                    <td className="px-4 py-4 text-right">
                      <ActionMenu
                        onEdit={() => { setEditingRow(row); setShowResultModal(true); }}
                        onDelete={() => setDeletingRow(row)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Scoring Formula ── */}
      <div className="rounded-2xl border border-[#dbe5f1] bg-white shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 rounded bg-[#3d5a9e]" />
          <h4 className="font-semibold text-[#1a2b52] text-sm">Scoring Formula</h4>
        </div>
        <ul className="space-y-2 text-sm text-[#60728f]">
          {[
            { label: "O-Level", text: "A1=6pts → F9=0pts → converted to % of max possible point" },
            { label: "JAMB", text: "Raw score ÷ 400 × 100" },
            { label: "Combined Score", text: "O-Level × 40% + JAMB × 60%" },
            { label: "GPA", text: "Mapped from combined % (5.0 scale)" },
            { label: "Auto-routing", text: "If below 1st choice cut-off → automatically checked against alternative course" },
          ].map(({ label, text }) => (
            <li key={label} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#3d5a9e]/60 shrink-0" />
              <span><span className="font-semibold text-[#1a2b52]">{label}:</span> {text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Modals ── */}
      {showResultModal && (
        <ResultModal
          existing={editingRow}
          onClose={() => { setShowResultModal(false); setEditingRow(null); }}
          onSave={handleSave}
        />
      )}
      {deletingRow && (
        <DeleteResultModal
          row={deletingRow}
          onClose={() => setDeletingRow(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}