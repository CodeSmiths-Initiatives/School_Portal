"use client";

import {
	Download,
	FileText,
	Filter,
	Printer,
	Search,
	UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { AdmissionApplicationSummary } from "@/lib/services/admission-application.service";
import type { CollegeAdminStudentRecord } from "@/lib/services/college-admin.service";

type StudentStatus = "all" | AdmissionApplicationSummary["status"];
type PaymentStatus = "all" | AdmissionApplicationSummary["paymentStatus"];
type StepStatus = "all" | NonNullable<AdmissionApplicationSummary["currentStep"]>;

type CollegeStudentsWorkspaceProps = {
	students: CollegeAdminStudentRecord[];
	collegeName: string;
	collegeSlug: string;
};

const STATUS_LABELS: Record<AdmissionApplicationSummary["status"], string> = {
	draft: "Draft",
	payment_pending: "Payment Pending",
	submitted: "Submitted",
	under_review: "Under Review",
	approved: "Approved",
	rejected: "Rejected",
	cancelled: "Cancelled",
};

const PAYMENT_LABELS: Record<AdmissionApplicationSummary["paymentStatus"], string> = {
	not_started: "Not Started",
	pending: "Pending",
	paid: "Paid",
	failed: "Failed",
	cancelled: "Cancelled",
	refunded: "Refunded",
};

const STEP_LABELS: Record<NonNullable<AdmissionApplicationSummary["currentStep"]>, string> = {
	account: "Account",
	programme: "Programme",
	payment: "Payment",
	biodata: "Bio Data",
	contact: "Contact",
	olevel: "O-Level",
	programme_details: "Programme Details",
	declaration: "Declaration",
	submitted: "Submitted",
};

function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function asText(value: unknown, fallback = "Not provided") {
	return typeof value === "string" && value.trim() ? value : fallback;
}

function formatDate(value?: string) {
	if (!value) {
		return "Not saved";
	}

	return new Intl.DateTimeFormat("en-NG", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

function toDateInput(value?: string) {
	return value ? value.slice(0, 10) : "";
}

function getFormData(application: AdmissionApplicationSummary) {
	return asRecord(application.metadata?.formData);
}

function hasSubmittedAdmissionData(application?: AdmissionApplicationSummary | null) {
	if (!application) {
		return false;
	}

	return (
		Object.keys(getFormData(application)).length > 0 &&
		["submitted", "under_review", "approved"].includes(application.status)
	);
}

function getProgrammeData(application: AdmissionApplicationSummary) {
	return asRecord(application.metadata?.programmeSelection);
}

function getStudentName(application: AdmissionApplicationSummary) {
	const formData = getFormData(application);
	const surname = asText(formData.surname, "");
	const firstName = asText(formData.firstName, "");
	const combined = `${surname} ${firstName}`.trim();

	return (
		combined ||
		application.applicantUsername ||
		application.applicantEmail ||
		"Student applicant"
	);
}

function getProgrammeLabel(application: AdmissionApplicationSummary) {
	const formData = getFormData(application);
	const programmeData = getProgrammeData(application);

	return (
		asText(formData.department, "") ||
		asText(formData.faculty, "") ||
		asText(programmeData.facultyId, "") ||
		"Programme not selected"
	);
}

function quoteCsv(value: unknown) {
	const text = String(value ?? "").replaceAll("\"", "\"\"");
	return `"${text}"`;
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
	const headers = Object.keys(rows[0] ?? {});
	const csv = [
		headers.map(quoteCsv).join(","),
		...rows.map((row) => headers.map((header) => quoteCsv(row[header])).join(",")),
	].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");

	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

function detailRows(application: AdmissionApplicationSummary) {
	const formData = getFormData(application);
	const programmeData = getProgrammeData(application);

	return [
		["Admission ID", application.applicationNumber],
		["Student Name", getStudentName(application)],
		["Email", application.applicantEmail],
		["Username", application.applicantUsername],
		["Application Status", STATUS_LABELS[application.status]],
		["Payment Status", PAYMENT_LABELS[application.paymentStatus]],
		["Current Step", application.currentStep ? STEP_LABELS[application.currentStep] : "Not started"],
		["Last Saved", formatDate(application.lastSavedAt)],
		["Date of Birth", formData.dateOfBirth],
		["Gender", formData.gender],
		["Marital Status", formData.maritalStatus],
		["Religion", formData.religion],
		["Nationality", formData.nationality],
		["State of Origin", formData.stateOfOrigin],
		["Local Government Area", formData.lga],
		["NIN", formData.nin],
		["Phone", formData.phone],
		["Address", formData.address],
		["Guardian", formData.guardianName],
		["Guardian Relationship", formData.guardianRelationship],
		["Guardian Phone", formData.guardianPhone],
		["Exam Type", formData.examType],
		["Exam Year", formData.examYear],
		["JAMB Number", formData.jambRegNumber],
		["JAMB Score", formData.jambScore],
		["Faculty", formData.faculty ?? programmeData.facultyId],
		["Department / Course", formData.department],
		["Programme Type", formData.programmeType ?? programmeData.programmeType],
		["Mode of Entry", formData.entryMode],
		["Blood Group", formData.bloodGroup],
		["Genotype", formData.genotype],
	] satisfies Array<[string, unknown]>;
}

function printApplication(application: AdmissionApplicationSummary, collegeName: string) {
	const rows = detailRows(application)
		.map(
			([label, value]) =>
				`<tr><th>${label}</th><td>${asText(value)}</td></tr>`,
		)
		.join("");
	const printWindow = window.open("", "_blank", "width=900,height=760");

	if (!printWindow) {
		return;
	}

	printWindow.document.write(`<!doctype html>
<html>
<head>
<title>${application.applicationNumber}</title>
<style>
body{font-family:Arial,sans-serif;color:#06183A;margin:32px}
.header{border-bottom:4px solid #B7770D;padding-bottom:16px;margin-bottom:24px}
.kicker{letter-spacing:.26em;text-transform:uppercase;color:#B7770D;font-weight:800;font-size:11px}
h1{margin:8px 0 4px;font-size:26px}
p{color:#536783;margin:0}
table{width:100%;border-collapse:collapse;margin-top:20px}
th,td{border:1px solid #d7e2f0;padding:12px 14px;text-align:left;font-size:13px}
th{width:32%;background:#f3f7fc;color:#0D2B55;text-transform:uppercase;letter-spacing:.12em;font-size:10px}
.badge{display:inline-block;border:1px solid #B7770D;border-radius:999px;padding:7px 12px;color:#B7770D;font-weight:800;font-size:11px;letter-spacing:.12em;text-transform:uppercase}
@media print{button{display:none}}
</style>
</head>
<body>
<div class="header">
<span class="badge">${collegeName}</span>
<p class="kicker">Student Admission Record</p>
<h1>${getStudentName(application)}</h1>
<p>${application.applicationNumber}</p>
</div>
<table>${rows}</table>
<script>window.print();</script>
</body>
</html>`);
	printWindow.document.close();
}

function statusPill(status: AdmissionApplicationSummary["status"]) {
	const tone =
		status === "submitted" || status === "approved"
			? "border-emerald-200 bg-emerald-50 text-emerald-700"
			: status === "payment_pending" || status === "under_review"
				? "border-amber-200 bg-amber-50 text-amber-700"
				: status === "rejected" || status === "cancelled"
					? "border-red-200 bg-red-50 text-red-700"
					: "border-slate-200 bg-slate-50 text-slate-700";

	return `rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${tone}`;
}

export default function CollegeStudentsWorkspace({
	students,
	collegeName,
	collegeSlug,
}: CollegeStudentsWorkspaceProps) {
	const applications = useMemo(
		() =>
			students
				.map((student) => student.application)
				.filter(
					(application): application is AdmissionApplicationSummary =>
						Boolean(application),
				),
		[students],
	);
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<StudentStatus>("all");
	const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("all");
	const [step, setStep] = useState<StepStatus>("all");
	const [programme, setProgramme] = useState("all");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [selectedId, setSelectedId] = useState(students[0]?.id ?? "");

	const programmeOptions = useMemo(
		() =>
			Array.from(new Set(applications.map(getProgrammeLabel)))
				.filter(Boolean)
				.sort((left, right) => left.localeCompare(right)),
		[applications],
	);

	const filteredStudents = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();
		const fromTime = from ? new Date(`${from}T00:00:00.000Z`).getTime() : null;
		const toTime = to ? new Date(`${to}T23:59:59.999Z`).getTime() : null;

		return students.filter((student) => {
			const application = student.application;
			const haystack = [
				student.username,
				student.email,
				application?.applicationNumber,
				application?.applicantEmail,
				application?.applicantUsername,
				application ? getStudentName(application) : "",
				application ? getProgrammeLabel(application) : "",
			]
				.join(" ")
				.toLowerCase();
			const savedTime = application?.lastSavedAt
				? new Date(application.lastSavedAt).getTime()
				: null;

			return (
				(!normalizedSearch || haystack.includes(normalizedSearch)) &&
				(status === "all" || application?.status === status) &&
				(paymentStatus === "all" || application?.paymentStatus === paymentStatus) &&
				(step === "all" || application?.currentStep === step) &&
				(programme === "all" ||
					(application ? getProgrammeLabel(application) === programme : false)) &&
				(!fromTime || (savedTime !== null && savedTime >= fromTime)) &&
				(!toTime || (savedTime !== null && savedTime <= toTime))
			);
		});
	}, [from, paymentStatus, programme, search, status, step, students, to]);

	const selectedStudent =
		filteredStudents.find((student) => student.id === selectedId) ??
		filteredStudents[0] ??
		null;
	const selectedApplication = selectedStudent?.application ?? null;
	const selectedHasAdmissionData = Boolean(
		selectedStudent?.hasAdmissionData ||
			hasSubmittedAdmissionData(selectedApplication),
	);
	const stats = useMemo(
		() => ({
			total: students.length,
			withApplicationRecord: students.filter(
				(item) => item.hasApplicationRecord || Boolean(item.application),
			).length,
			withAdmission: students.filter(
				(item) => item.hasAdmissionData || hasSubmittedAdmissionData(item.application),
			).length,
			paid: applications.filter((item) => item.paymentStatus === "paid").length,
		}),
		[applications, students],
	);

	function exportFiltered() {
		downloadCsv(
			`${collegeSlug}-students-${toDateInput(new Date().toISOString())}.csv`,
			filteredStudents.map((student) => ({
				username: student.username,
				email: student.email,
				accountStatus: student.blocked ? "Blocked" : "Active",
				applicationRecord:
					student.hasApplicationRecord || student.application ? "Yes" : "No",
				admissionFormSubmitted:
					student.hasAdmissionData || hasSubmittedAdmissionData(student.application)
						? "Yes"
						: "No",
				admissionId: student.application?.applicationNumber ?? "",
				name: student.application ? getStudentName(student.application) : "",
				programme: student.application ? getProgrammeLabel(student.application) : "",
				status: student.application ? STATUS_LABELS[student.application.status] : "",
				paymentStatus: student.application
					? PAYMENT_LABELS[student.application.paymentStatus]
					: "",
				currentStep: student.application?.currentStep
					? STEP_LABELS[student.application.currentStep]
					: "",
				lastSavedAt: student.application?.lastSavedAt ?? "",
			})),
		);
	}

	return (
		<section className="space-y-5">
			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							Student Records
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							Admission-backed student list
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#556987]">
							Created student accounts appear here for {collegeName}. Full
							admission detail, print, and record export unlock only after
							admission data is saved.
						</p>
					</div>
					<button
						type="button"
						onClick={exportFiltered}
						disabled={filteredStudents.length === 0}
						className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<Download className="size-4" />
						Export CSV
					</button>
				</div>

				<div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{[
						["Student Accounts", stats.total],
						["Application Records", stats.withApplicationRecord],
						["Forms Submitted", stats.withAdmission],
						["Paid Students", stats.paid],
					].map(([label, value]) => (
						<div
							key={label}
							className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4"
						>
							<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
								{label}
							</p>
							<p className="mt-2 text-3xl font-black text-[#0D2B55]">{value}</p>
						</div>
					))}
				</div>
			</div>

			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-4 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-5">
				<div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
					<Filter className="size-4" />
					Filters
				</div>
				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
					<label className="relative xl:col-span-2">
						<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
						<input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search name, email, admission ID"
							className="h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] pl-11 pr-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>
					<select value={status} onChange={(event) => setStatus(event.target.value as StudentStatus)} className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]">
						<option value="all">All application status</option>
						{Object.entries(STATUS_LABELS).map(([value, label]) => (
							<option key={value} value={value}>{label}</option>
						))}
					</select>
					<select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)} className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]">
						<option value="all">All payment status</option>
						{Object.entries(PAYMENT_LABELS).map(([value, label]) => (
							<option key={value} value={value}>{label}</option>
						))}
					</select>
					<select value={step} onChange={(event) => setStep(event.target.value as StepStatus)} className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]">
						<option value="all">All admission steps</option>
						{Object.entries(STEP_LABELS).map(([value, label]) => (
							<option key={value} value={value}>{label}</option>
						))}
					</select>
					<select value={programme} onChange={(event) => setProgramme(event.target.value)} className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]">
						<option value="all">All programmes</option>
						{programmeOptions.map((option) => (
							<option key={option} value={option}>{option}</option>
						))}
					</select>
					<input value={from} onChange={(event) => setFrom(event.target.value)} type="date" className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]" />
					<input value={to} onChange={(event) => setTo(event.target.value)} type="date" className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]" />
				</div>
			</div>

			<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_26rem]">
				<div className="space-y-3">
					{filteredStudents.length === 0 ? (
						<div className="rounded-3xl border border-dashed border-[#cbd9ec] bg-white p-8 text-center">
							<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eef4fb] text-[#2E86C1]">
								<UserRound className="size-6" />
							</div>
							<h3 className="mt-4 text-lg font-black text-[#06183A]">
								No students found
							</h3>
							<p className="mt-2 text-sm text-[#60728f]">
								Student accounts will appear here after they are created under
								this college. Full details unlock when admission data is saved.
							</p>
						</div>
					) : (
						filteredStudents.map((student) => {
							const application = student.application;
							const title = application ? getStudentName(application) : student.username;
							const hasAdmissionData =
								student.hasAdmissionData ||
								hasSubmittedAdmissionData(application);

							return (
								<button
									key={student.id}
									type="button"
									onClick={() => setSelectedId(student.id)}
									className={`w-full rounded-3xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(13,43,85,0.09)] ${
										selectedStudent?.id === student.id
											? "border-[#B7770D] ring-2 ring-[#B7770D]/10"
											: "border-[#d7e2f0]"
									}`}
								>
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div>
											<p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
												{application?.applicationNumber ?? "No admission record yet"}
											</p>
											<h3 className="mt-2 text-lg font-black text-[#06183A]">
												{title}
											</h3>
											<p className="mt-1 text-sm font-semibold text-[#60728f]">
												{student.email}
											</p>
										</div>
										{application ? (
											<span className={statusPill(application.status)}>
												{STATUS_LABELS[application.status]}
											</span>
										) : (
											<span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-600">
												No admission data
											</span>
										)}
									</div>
									<div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
										<div>
											<p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8395AF]">Programme</p>
											<p className="mt-1 font-black text-[#0D2B55]">
												{application ? getProgrammeLabel(application) : "Not started"}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8395AF]">Admission Form</p>
											<p className="mt-1 font-black text-[#0D2B55]">
												{hasAdmissionData ? "Submitted" : "Not submitted"}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8395AF]">Payment</p>
											<p className="mt-1 font-black text-[#0D2B55]">
												{application
													? PAYMENT_LABELS[application.paymentStatus]
													: "Not available"}
											</p>
										</div>
									</div>
								</button>
							);
						})
					)}
				</div>

				<aside className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] xl:sticky xl:top-6 xl:self-start">
					{selectedStudent ? (
						<>
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
										Student Detail
									</p>
									<h3 className="mt-2 text-xl font-black text-[#06183A]">
										{selectedApplication
											? getStudentName(selectedApplication)
											: selectedStudent.username}
									</h3>
									<p className="mt-1 text-sm font-semibold text-[#60728f]">
										{selectedHasAdmissionData
											? selectedApplication?.applicationNumber
											: "Admission form has not been submitted yet."}
									</p>
								</div>
								<div className="flex size-12 items-center justify-center rounded-2xl bg-[#eef4fb] text-[#2E86C1]">
									<FileText className="size-5" />
								</div>
							</div>
							<div className="mt-5 flex gap-2">
								<button
									type="button"
									onClick={() =>
										selectedApplication && selectedHasAdmissionData
											? printApplication(selectedApplication, collegeName)
											: null
									}
									disabled={!selectedApplication || !selectedHasAdmissionData}
									className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#d3dfed] bg-white text-sm font-black text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D] disabled:cursor-not-allowed disabled:opacity-50"
								>
									<Printer className="size-4" />
									Print
								</button>
								<button
									type="button"
									onClick={() =>
										selectedApplication && selectedHasAdmissionData
											? downloadCsv(`${selectedApplication.applicationNumber}.csv`, [
													Object.fromEntries(detailRows(selectedApplication)),
												])
											: null
									}
									disabled={!selectedApplication || !selectedHasAdmissionData}
									className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] text-sm font-black text-white transition hover:bg-[#113765] disabled:cursor-not-allowed disabled:opacity-50"
								>
									<Download className="size-4" />
									Export
								</button>
							</div>
							<div className="mt-5 space-y-2">
								{(selectedApplication && selectedHasAdmissionData
									? detailRows(selectedApplication)
									: ([
											["Username", selectedStudent.username],
											["Email", selectedStudent.email],
											["Account Status", selectedStudent.blocked ? "Blocked" : "Active"],
											["Application Record", selectedStudent.hasApplicationRecord || selectedApplication ? "Created" : "Not created"],
											["Admission Form", "Not submitted yet"],
											["Payment Status", selectedApplication ? PAYMENT_LABELS[selectedApplication.paymentStatus] : "Not available"],
										] as Array<[string, unknown]>)
								).map(([label, value]) => (
									<div
										key={label}
										className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-3"
									>
										<p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
											{label}
										</p>
										<p className="mt-1 break-words text-sm font-black text-[#0D2B55]">
											{asText(value)}
										</p>
									</div>
								))}
							</div>
						</>
					) : (
						<div className="py-10 text-center">
							<p className="text-sm font-semibold text-[#60728f]">
								Select a student to view details.
							</p>
						</div>
					)}
				</aside>
			</div>
		</section>
	);
}
