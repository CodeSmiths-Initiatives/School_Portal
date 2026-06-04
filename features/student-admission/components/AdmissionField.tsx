import type { ReactNode } from "react";

type AdmissionFieldProps = {
	label: string;
	required?: boolean;
	error?: string;
	hint?: string;
	children: ReactNode;
};

export const admissionControlClass =
	"min-h-11 w-full rounded-xl border border-[#d7e1ee] bg-white px-4 py-2.5 text-sm font-medium text-[#0D2B55] outline-none transition placeholder:text-[#8a9ab5] focus:border-[#2E86C1] focus:ring-4 focus:ring-[#2E86C1]/10 disabled:cursor-not-allowed disabled:bg-[#f3f6fa] disabled:text-[#8a9ab5]";

export const admissionErrorControlClass =
	"border-[#ffb4b4] bg-[#fff8f8] focus:border-[#ef4444] focus:ring-[#ef4444]/10";

export function getAdmissionControlClass(error?: string) {
	return `${admissionControlClass} ${error ? admissionErrorControlClass : ""}`;
}

export default function AdmissionField({
	label,
	required,
	error,
	hint,
	children,
}: AdmissionFieldProps) {
	return (
		<div className="flex min-w-0 flex-col gap-1.5">
			<label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4f6383]">
				{label} {required ? <span className="text-[#d93d3d]">*</span> : null}
			</label>
			{children}
			{error ? (
				<p className="text-xs font-semibold text-[#d92d20]">{error}</p>
			) : hint ? (
				<p className="text-xs text-[#73849d]">{hint}</p>
			) : null}
		</div>
	);
}
