"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { BioDataForm, BioDataErrors } from "../types/biostep.types";
import {
	GENDERS,
	MARITAL_STATUSES,
	RELIGIONS,
	NIGERIAN_STATES,
	KWARA_LGAS,
} from "../utils/bioData";
import FormField from "@/components/forms/FormField";
import SelectField from "@/components/forms/SelectField";
import { FcOldTimeCamera } from "react-icons/fc";

interface Props {
	data: BioDataForm;
	errors: BioDataErrors;
	onChange: (field: keyof BioDataForm, value: string | File | null) => void;
}

export default function PersonalInfo({ data, errors, onChange }: Props) {
	const fileRef = useRef<HTMLInputElement>(null);
	const [preview, setPreview] = useState<string | null>(null);

	function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0] ?? null;
		onChange("passportPhoto", file);
		if (file) setPreview(URL.createObjectURL(file));
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Passport Photo */}
			<div>
				<label className="text-[10px] font-semibold tracking-wide text-gray-800 uppercase mb-2 block">
					Passport Photograph <span className="text-[#B7770B] ">*</span>
				</label>
				<div className="flex items-start gap-6">
					<button
						type="button"
						onClick={() => fileRef.current?.click()}
						className="w-40 h-44 border-2  border-gray-800 rounded-xl bg-[#f7f9fd]
              hover:border-[#c9952a] hover:bg-[#fdf8f0] transition-all flex flex-col items-center
              justify-center gap-2 shrink-0 overflow-hidden"
					>
						{preview ? (
							<Image
								src={preview}
								alt="Passport"
								className="w-full h-full object-cover"
								fill
								sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
							/>
						) : (
							<>
								<div className="border-2 border-black w-20 h-20 rounded-xl bg-gray-200 flex items-center justify-center">
									<FcOldTimeCamera size={32} className="text-[#8a9ab5]" />
								</div>
								<p className="text-sm font-semibold text-center">
									Click to Upload
								</p>
								<p className="text-[10px] text-[#8a9ab5]">JPG / PNG only</p>
							</>
						)}
					</button>
					<input
						ref={fileRef}
						type="file"
						accept="image/jpeg,image/png"
						className="hidden"
						onChange={handlePhoto}
					/>
					<ul className="text-sm text-gray-600 space-y-1.5 pt-2 leading-relaxed">
						<li>• White or light-blue background</li>
						<li>• Full face, no glasses or head covering</li>
						<li>• Recent photo (within 6 months)</li>
						<li>• Minimum resolution: 200 × 200px</li>
						<li>• File size: max 2MB</li>
					</ul>
				</div>
				<div className="mt-4 border-t border-gray-600" />
			</div>
			<div className="grid grid-cols-3 gap-4">
				<FormField
					label="Surname"
					required
					placeholder="e.g. IBRAHIM"
					value={data.surname}
					error={errors.surname}
					onChange={(e) => onChange("surname", e.target.value)}
				/>
				<FormField
					label="First Name"
					required
					placeholder="e.g. FATIMAH"
					value={data.firstName}
					error={errors.firstName}
					onChange={(e) => onChange("firstName", e.target.value)}
				/>
				<FormField
					label="Other Name(s)"
					placeholder="e.g. KEMI"
					value={data.otherName}
					onChange={(e) => onChange("otherName", e.target.value)}
				/>
			</div>
			<div className="grid grid-cols-2 gap-5">
				<FormField
					label="Date of Birth"
					required
					type="date"
					value={data.dateOfBirth}
					error={errors.dateOfBirth}
					onChange={(e) => onChange("dateOfBirth", e.target.value)}
				/>
				<SelectField
					label="Gender"
					required
					value={data.gender}
					options={GENDERS}
					placeholder="--- Select Gender ---"
					error={errors.gender}
					onChange={(v) => onChange("gender", v)}
				/>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<SelectField
					label="Marital Status"
					required
					value={data.maritalStatus}
					options={MARITAL_STATUSES}
					placeholder="--- Select ---"
					error={errors.maritalStatus}
					onChange={(v) => onChange("maritalStatus", v)}
				/>
				<SelectField
					label="Religion"
					value={data.religion}
					options={RELIGIONS}
					placeholder="--- Select ---"
					onChange={(v) => onChange("religion", v)}
				/>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<FormField
					label="Nationality"
					required
					value={data.nationality}
					onChange={(e) => onChange("nationality", e.target.value)}
				/>
				<SelectField
					label="State of Origin"
					required
					value={data.stateOfOrigin}
					options={NIGERIAN_STATES}
					placeholder="--- Select State ---"
					error={errors.stateOfOrigin}
					onChange={(v) => onChange("stateOfOrigin", v)}
				/>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<SelectField
					label="Local Government Area"
					required
					value={data.lga}
					options={KWARA_LGAS}
					placeholder="e.g. Ilorin West"
					error={errors.lga}
					onChange={(v) => onChange("lga", v)}
				/>
				<FormField
					label="NIN (National Identity Number)"
					required
					placeholder="00000000000"
					value={data.nin}
					hint="Your 11-digit National Identity Number"
					error={errors.nin}
					maxLength={11}
					inputMode="numeric"
					onChange={(e) => onChange("nin", e.target.value.replace(/\D/g, ""))}
				/>
			</div>
		</div>
	);
}
