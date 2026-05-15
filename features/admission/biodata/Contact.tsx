"use client";

import FormField from "@/components/forms/FormField";
import SelectField from "@/components/forms/SelectField";
import { BioDataErrors, BioDataForm } from "../types/biostep.types";
import { BLOOD_GROUPS, GENOTYPES, RELATIONSHIPS } from "../utils/bioData";

interface Props {
	data: BioDataForm;
	errors: BioDataErrors;
	onChange: (field: keyof BioDataForm, value: string) => void;
}
export default function Contact({ data, errors, onChange }: Props) {
	return (
		<div className="flex flex-col gap-6">
			<div>
				<div className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-4">
						<FormField
							label="Phone Number"
							required
							type="tel"
							placeholder="e.g. 08012345678"
							value={data.phone}
							error={errors.phone}
							onChange={(e) => onChange("phone", e.target.value)}
						/>
						<FormField
							label="Alternate Phone Number"
							type="tel"
							placeholder="e.g. 07098765432"
							value={data.altPhone}
							onChange={(e) => onChange("altPhone", e.target.value)}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<FormField
							label="Email Address"
							required
							type="email"
							placeholder="yourname@email.com"
							value={data.email}
							error={errors.email}
							onChange={(e) => onChange("email", e.target.value)}
						/>
						<FormField
							label="Confirm Email"
							required
							type="email"
							placeholder="yourname@email.com"
							value={data.confirmEmail}
							error={errors.confirmEmail}
							onChange={(e) => onChange("confirmEmail", e.target.value)}
						/>
					</div>

					<FormField
						label="Residential Address"
						required
						placeholder="House No., Street Name"
						value={data.address}
						error={errors.address}
						onChange={(e) => onChange("address", e.target.value)}
					/>

					<div className="mt-4 border-t border-gray-600" />

					{/* Parent/Guardian information */}
					<div>
						<p className="text-[15px] font-semibold tracking-widest text-gray-800 uppercase mb-4">
							Parent/Guardian information
						</p>
						<div className="flex flex-col gap-4">
							<div className="grid grid-cols-2 gap-4">
								<FormField
									label="Guardian's Full Name"
									required
									placeholder="Full name of next of kin"
									value={data.guardianName}
									error={errors.guardianName}
									onChange={(e) => onChange("guardianName", e.target.value)}
								/>
								<SelectField
									label="Relationship"
									required
									value={data.guardianRelationship}
									options={RELATIONSHIPS}
									placeholder="--- Select ---"
									error={errors.guardianRelationship}
									onChange={(v) => onChange("guardianRelationship", v)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									label="Guardian's Phone Number"
									required
									type="tel"
									placeholder="e.g. 08011223344"
									value={data.guardianPhone}
									error={errors.guardianPhone}
									onChange={(e) => onChange("guardianPhone", e.target.value)}
								/>
								<FormField
									label="Guardian's Email Address"
									required
									placeholder="Full name of next of kin"
									value={data.guardianEmail}
									error={errors.guardianEmail}
									onChange={(e) => onChange("guardianEmail", e.target.value)}
								/>
							</div>

							<FormField
								label="Guardian's Address"
								required
								placeholder="House No., Street Name"
								value={data.guardianAddress}
								error={errors.guardianAddress}
								onChange={(e) => onChange("guardianAddress", e.target.value)}
							/>
						</div>
					</div>
					<div className="mt-4 border-t border-gray-600" />

					{/* Medical Information*/}
					<div>
						<p className="text-[15px] font-semibold text-gray-800 uppercase mb-2">
							Medical information
						</p>
					</div>
					<div className="flex flex-col gap-4">
						<div className="grid grid-cols-2 gap-4">
							<SelectField
								label="Blood Group"
								required
								value={data.bloodGroup}
								options={BLOOD_GROUPS}
								placeholder="--- Select ---"
								error={errors.bloodGroup}
								onChange={(v) => onChange("bloodGroup", v)}
							/>
							<SelectField
								label="Genotype"
								required
								value={data.genotype}
								options={GENOTYPES}
								placeholder="--- Select ---"
								error={errors.genotype}
								onChange={(v) => onChange("genotype", v)}
							/>
						</div>
						<FormField
							label="Disability"
							required
							placeholder="Visual impairment or leave blank if none"
							value={data.disability}
							error={errors.disability}
							onChange={(e) => onChange("disability", e.target.value)}
						/>
					</div>

					{/* <div className="grid grid-cols-3 gap-4">
						<FormField
							label="City / Town"
							placeholder="e.g. Ilorin"
							value={data.city}
							onChange={(e) => onChange("city", e.target.value)}
						/>
						<SelectField
							label="State"
							value={data.state}
							options={NIGERIAN_STATES}
							placeholder="--- Select ---"
							onChange={(v) => onChange("state", v)}
						/>
						<FormField
							label="Postal Code"
							placeholder="e.g. 240001"
							value={data.postalCode}
							onChange={(e) => onChange("postalCode", e.target.value)}
						/>
					</div> */}
				</div>
			</div>
		</div>
	);
}
