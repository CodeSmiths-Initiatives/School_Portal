"use client";

import { X } from "lucide-react";

interface DeleteResultModalProps {
  studentName: string;
  studentId: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteResultModal({ studentName, studentId, onClose, onConfirm }: DeleteResultModalProps) {
  return (
    <div className="fixed inset-0 bg-[#0a1230]/60 backdrop-blur-md z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        <div className="bg-[#0D2B55] px-8 py-6 relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#E4A11B]">Confirm Deletion</p>
          <h2 className="mt-1 text-xl font-bold text-white">Delete Result</h2>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-8 py-6">
          <p className="text-sm text-[#46557a]">
            Are you sure you want to delete the result for{" "}
            <strong className="text-[#0D2B55]">{studentName}</strong> ({studentId})? This action cannot be undone.
          </p>
        </div>

        <div className="border-t border-[#eef0f4] px-8 py-5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#dbe5f1] text-sm font-semibold text-[#46557a] hover:bg-[#f8fafc] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}