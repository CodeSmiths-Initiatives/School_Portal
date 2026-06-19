"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { ResultRow, Verdict } from "./ResultsView";

const CUT_OFFS: Record<string, number> = {
  "Pharmacy": 70,
  "Computer Science": 75,
  "Engineering": 68,
  "Nursing Science": 65,
  "Law (LLB)": 70,
  "Accounting": 60,
};

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

interface ResultModalProps {
  existing: ResultRow | null;
  onClose: () => void;
  onSave: (row: ResultRow) => void;
}

export default function ResultModal({ existing, onClose, onSave }: ResultModalProps) {
  const [ref, setRef] = useState(existing?.ref ?? "");
  const [name, setName] = useState(existing?.name ?? "");
  const [department, setDepartment] = useState(existing?.department ?? "Pharmacy");
  const [oLevelPercent] = useState(existing?.oLevelPercent ?? 72); // pulled from application record
  const [jamb, setJamb] = useState<number>(existing?.jamb ?? 0);

  const cutOff = CUT_OFFS[department] ?? 60;
  const combined = jamb ? calcCombined(jamb, oLevelPercent) : 0;
  const gpa = calcGPA(combined);
  const verdict = calcVerdict(combined, cutOff);

  const verdictColor: Record<Verdict, string> = {
    Admitted: "text-[#0D2B55] bg-[#eef3fb]",
    Pending: "text-amber-700 bg-amber-50",
    Rejected: "text-red-600 bg-red-50",
  };

  const handleSave = () => {
    if (!ref.trim() || !name.trim() || !jamb) return;
    onSave({
      id: existing?.id ?? Date.now().toString(),
      ref: ref.trim(),
      name: name.trim(),
      department,
      jamb,
      oLevelPercent,
      combined,
      cutOff,
      gpa,
      verdict,
    });
  };

  const inputClass =
    "w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-[#0D2B55] bg-[#f8fafc] " +
    "placeholder:text-[#9aa7bd] outline-none focus:bg-white focus:border-[#2E86C1] focus:ring-2 focus:ring-[#2E86C1]/15 transition-colors";

  const labelClass = "text-[11px] font-bold tracking-wider text-[#0D2B55] uppercase";

  return (
    /* Backdrop */
    <div className="fixed inset-0 bg-[#0a1230]/60 backdrop-blur-md z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto">

        {/* Navy header band */}
        <div className="bg-[#0D2B55] px-8 py-6 relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#E4A11B]">
            {existing ? "Update Entry" : "New Entry"}
          </p>
          <h2 className="mt-1 text-xl font-bold text-white">
            {existing ? "Edit Result Entry" : "Add JAMB Score"}
          </h2>
          <p className="mt-1 text-sm text-[#9fb3d1] max-w-md">
            O-Level grades are pulled from the applicant&apos;s record. Enter their JAMB score to compute the result.
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Application REF</label>
              <input
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="e.g. UAML8428K"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Adewale Musa"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={inputClass + " cursor-pointer"}
            >
              {Object.keys(CUT_OFFS).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="bg-[#eef3fb] rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-[#46557a]">O-Level % (from application)</span>
            <strong className="text-sm text-[#0D2B55]">{oLevelPercent}%</strong>
          </div>

          <div className="flex flex-col gap-1.5 max-w-xs">
            <label className={labelClass}>JAMB Score (out of 400)</label>
            <input
              type="number"
              min={0}
              max={400}
              value={jamb || ""}
              onChange={(e) => setJamb(Number(e.target.value))}
              placeholder="e.g. 280"
              className={inputClass}
            />
          </div>

          {jamb > 0 && (
            <div className="flex flex-col gap-3 pt-1 border-t border-[#eef3fb]">
              <p className={labelClass + " pt-3"}>Auto-Calculated Result</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Combined", value: `${combined}%` },
                  { label: "Cut-Off", value: `${cutOff}%` },
                  { label: "GPA", value: gpa.toFixed(1) },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-[#eef3fb] bg-[#f8fbff] py-3 text-center">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#8395AF]">{label}</p>
                    <p className="mt-1 text-base font-bold text-[#0D2B55]">{value}</p>
                  </div>
                ))}
              </div>
              <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${verdictColor[verdict]}`}>
                <span className="text-sm font-semibold">Verdict</span>
                <span className="text-sm font-bold">{verdict}</span>
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
            onClick={handleSave}
            disabled={!ref.trim() || !name.trim() || !jamb}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0D2B55] hover:bg-[#0a2244] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {existing ? "Save Changes" : "Add Result"}
          </button>
        </div>
      </div>
    </div>
  );
}