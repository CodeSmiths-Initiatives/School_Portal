"use client";
import FormField from "@/components/forms/FormField";
import { BioDataErrors, BioDataForm } from "../types/biostep.types";

interface Props {
	data: BioDataForm;
	errors: BioDataErrors;
	onChange: (field: keyof BioDataForm, value: string | boolean) => void;
}

const DECLARATION_TEXT =
	"I, the undersigned applicant, hereby declare that all information provided in this admission form is true, accurate, and complete to the best of my knowledge and belied. I understand that any false, misleading , or incomplete information may result in the rejection of this application or cancellation of my admission at any stage, even after enrolment.";

// The three checkbox keys and their shared label text
const DECLARATION_ITEMS: Array<keyof BioDataForm> = [
	"agreedToTerms",
	"agreedToAccuracy",
	"agreedToDeclaration",
];
export default function Declaration({ data, errors, onChange }: Props) {
	return (
		<div className="flex flex-col gap-6">
			<div className="bg-[#15295a] rounded-2xl px-6 py-7 flex flex-col gap-6">
				<h2 className="text-[#B7770D] text-xl font-bold">
					Applicant Declaration
				</h2>

				{DECLARATION_ITEMS.map((field, idx) => (
					<label key={idx} className="flex items-start gap-4 cursor-pointer">
						<div className="shrink-0 mt-1">
							<input
								type="checkbox"
								checked={!!data[field]}
								onChange={(e) => onChange(field, e.target.checked)}
								className=""
							/>
						</div>
						<p className="text-white text-sm font-bold leading-relaxed">
							{DECLARATION_TEXT}
						</p>
					</label>
				))}

				{(errors.agreedToTerms ||
					errors.agreedToAccuracy ||
					errors.agreedToDeclaration) && (
					<p className="text-red-400 text-[11px] font-medium">
						{errors.agreedToTerms ||
							errors.agreedToAccuracy ||
							errors.agreedToDeclaration}
					</p>
				)}
			</div>

			<div className="grid grid-cols-2 gap-5">
				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-[#1a2b52]">Signature</label>
					<input
						type="text"
						placeholder="Type your full name as signature"
						value={data.signature}
						onChange={(e) => onChange("signature", e.target.value)}
						className={`border border-[#2E86C1] rounded-xl px-4 py-3 text-sm text-[#1a2b52]
							bg-[#f7f9fd] placeholder:text-[#b0bcd4] outline-none transition-all
							focus:bg-white focus:border-[#2E86C1] focus:ring-2 focus:ring-[#c9952a]/15
							${errors.signature ? "border-red-400 bg-red-50" : "border-[#c8d8ec]"}`}
					/>
					{errors.signature && (
						<p className="text-[11px] text-red-500 font-medium">
							{errors.signature}
						</p>
					)}
				</div>

				<div className="flex flex-col gap-2">
					<label className="text-sm font-bold text-[#1a2b52]">Date</label>
					<input
						type="text"
						value={data.declarationDate}
						onChange={(e) => onChange("declarationDate", e.target.value)}
						className="border border-[#2E86C1] rounded-xl px-4 py-3 text-sm
							text-[#1a2b52] bg-[#f7f9fd] outline-none transition-all
							focus:bg-white focus:border-[#2E86C1] focus:ring-2 focus:ring-[#c9952a]/15"
					/>
				</div>
			</div>

			<div className="bg-[#dce8fb] border border-[#2E86C1] rounded-2xl px-5 py-4 flex items-start gap-3">
				<span className="text-amber-500 text-lg shrink-0 mt-0.5">⚠️</span>
				<p className="text-sm text-[#1a2b52] leading-relaxed">
					<strong>Important Notice : </strong>
					Submission of this form does not guarantee admission. Qualified
					applicants will be contacted via the email and phone number provided.
					Check your portal regularly for updates. Application fee is
					non-refundable.
				</p>
			</div>
		</div>
	);
}
