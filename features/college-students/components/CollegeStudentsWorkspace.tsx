"use client";

import {
	Download,
	Eye,
	Filter,
	Printer,
	Search,
	UserRound,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { RowActionMenu } from "@/components/ui/row-action-menu";
import { hasPermissions, type UserPermissionKey } from "@/lib/rbac";
import type { AdmissionApplicationSummary } from "@/lib/services/admission-application.service";
import type { CollegeAdminStudentRecord } from "@/lib/services/college-admin.service";

type StudentStatus = "all" | AdmissionApplicationSummary["status"];
type PaymentStatus = "all" | AdmissionApplicationSummary["paymentStatus"];
type StepStatus = "all" | NonNullable<AdmissionApplicationSummary["currentStep"]>;

type CollegeStudentsWorkspaceProps = {
	students: CollegeAdminStudentRecord[];
	collegeName: string;
	collegeSlug: string;
	permissions: UserPermissionKey[];
};

const PAGE_SIZE = 20;

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

function DetailItem({ label, value }: { label: string; value: unknown }) {
	return (
		<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-3">
			<p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
				{label}
			</p>
			<p className="mt-1 break-words text-sm font-black text-[#0D2B55]">
				{asText(value)}
			</p>
		</div>
	);
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

function FullRecordModal({
	application,
	collegeName,
	onClose,
}: {
	application: AdmissionApplicationSummary | null;
	collegeName: string;
	onClose: () => void;
}) {
	if (!application) {
		return null;
	}

	const rows = detailRows(application);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
				<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
							Full Admission Details
						</p>
						<h2 className="mt-2 text-xl font-black sm:text-2xl">
							{getStudentName(application)}
						</h2>
						<p className="mt-1 text-sm font-semibold text-[#c5d4e8]">
							{collegeName} - {application.applicantEmail}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#0D2B55]"
						aria-label="Close admission details"
					>
						<X className="size-5" />
					</button>
				</div>

				<div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-5 sm:p-6">
					<div className="grid gap-3 md:grid-cols-3">
						<DetailItem label="Reference" value={application.applicationNumber} />
						<DetailItem label="Status" value={STATUS_LABELS[application.status]} />
						<DetailItem label="Last Saved" value={formatDate(application.lastSavedAt)} />
					</div>

					<div className="mt-5 rounded-3xl border border-[#dbe5f1] bg-white">
						<div className="border-b border-[#dbe5f1] bg-[#fbfdff] px-5 py-4">
							<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
								Saved Student Record
							</p>
							<p className="mt-1 text-sm font-semibold text-[#60728f]">
								Admission, bio data, contact, O-Level, programme, declaration,
								and payment status.
							</p>
						</div>
						<div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
							{rows.map(([label, value]) => (
								<DetailItem key={label} label={label} value={value} />
							))}
						</div>
					</div>

					<div className="sticky bottom-0 mt-5 flex flex-col gap-3 border-t border-[#dbe5f1] bg-white/95 pt-4 backdrop-blur sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={onClose}
							className="inline-flex items-center justify-center rounded-2xl border border-[#dbe5f1] px-5 py-3 text-sm font-black text-[#0D2B55] transition hover:border-[#0D2B55]"
						>
							Close
						</button>
						<button
							type="button"
							onClick={() => printApplication(application, collegeName)}
							className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866]"
						>
							<Printer className="size-4" />
							Print full record
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function CollegeStudentsWorkspace({
	students,
	collegeName,
	collegeSlug,
	permissions,
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
	const [currentPage, setCurrentPage] = useState(1);
	const [viewApplication, setViewApplication] =
		useState<AdmissionApplicationSummary | null>(null);
	const [openActionsId, setOpenActionsId] = useState<string | number | null>(null);
	const canViewStudentRecords = hasPermissions(permissions, ["students.view"], {
		mode: "any",
	});
	const canExportStudentRecords = hasPermissions(permissions, ["students.export"], {
		mode: "any",
	});

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

	const pageCount = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
	const safePage = Math.min(currentPage, pageCount);
	const paginatedStudents = filteredStudents.slice(
		(safePage - 1) * PAGE_SIZE,
		safePage * PAGE_SIZE,
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

	function clearFilters() {
		setSearch("");
		setStatus("all");
		setPaymentStatus("all");
		setStep("all");
		setProgramme("all");
		setFrom("");
		setTo("");
		setCurrentPage(1);
	}

	function updateFilter<T>(setter: (value: T) => void, value: T) {
		setter(value);
		setCurrentPage(1);
	}

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

	function exportApplication(application: AdmissionApplicationSummary) {
		downloadCsv(`${application.applicationNumber}.csv`, [
			Object.fromEntries(detailRows(application)),
		]);
	}

	function closeActions() {
		setOpenActionsId(null);
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
						disabled={!canExportStudentRecords || filteredStudents.length === 0}
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
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
						<Filter className="size-4" />
						Filters
					</div>
					<button
						type="button"
						onClick={clearFilters}
						className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#d3dfed] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
					>
						Reset filters
					</button>
				</div>
				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
					<label className="relative xl:col-span-2">
						<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
						<input
							value={search}
							onChange={(event) => updateFilter(setSearch, event.target.value)}
							placeholder="Search name, email, admission ID"
							className="h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] pl-11 pr-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>
					<select value={status} onChange={(event) => updateFilter(setStatus, event.target.value as StudentStatus)} className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]">
						<option value="all">All application status</option>
						{Object.entries(STATUS_LABELS).map(([value, label]) => (
							<option key={value} value={value}>{label}</option>
						))}
					</select>
					<select value={paymentStatus} onChange={(event) => updateFilter(setPaymentStatus, event.target.value as PaymentStatus)} className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]">
						<option value="all">All payment status</option>
						{Object.entries(PAYMENT_LABELS).map(([value, label]) => (
							<option key={value} value={value}>{label}</option>
						))}
					</select>
					<select value={step} onChange={(event) => updateFilter(setStep, event.target.value as StepStatus)} className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]">
						<option value="all">All admission steps</option>
						{Object.entries(STEP_LABELS).map(([value, label]) => (
							<option key={value} value={value}>{label}</option>
						))}
					</select>
					<select value={programme} onChange={(event) => updateFilter(setProgramme, event.target.value)} className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]">
						<option value="all">All programmes</option>
						{programmeOptions.map((option) => (
							<option key={option} value={option}>{option}</option>
						))}
					</select>
					<input value={from} onChange={(event) => updateFilter(setFrom, event.target.value)} type="date" className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]" />
					<input value={to} onChange={(event) => updateFilter(setTo, event.target.value)} type="date" className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]" />
				</div>
			</div>

			<div className="overflow-hidden rounded-3xl border border-[#d7e2f0] bg-white shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe5f1] px-4 py-4 sm:px-5">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
							Student Table
						</p>
						<p className="mt-1 text-sm font-semibold text-[#60728f]">
							Showing {paginatedStudents.length} of {filteredStudents.length} records
						</p>
					</div>
					<div className="flex items-center gap-2 rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-4 py-2 text-xs font-black text-[#0D2B55]">
						Page {safePage} of {pageCount}
					</div>
				</div>

				{filteredStudents.length === 0 ? (
					<div className="p-8 text-center">
						<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eef4fb] text-[#2E86C1]">
							<UserRound className="size-6" />
						</div>
						<h3 className="mt-4 text-lg font-black text-[#06183A]">
							No students found
						</h3>
						<p className="mt-2 text-sm text-[#60728f]">
							Adjust the filters or wait for student accounts to be created under
							this college.
						</p>
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className="min-w-[980px] w-full border-collapse text-left">
								<thead className="bg-[#f8fbff]">
									<tr className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
										<th className="px-5 py-4">Student</th>
										<th className="px-5 py-4">Admission ID</th>
										<th className="px-5 py-4">Programme</th>
										<th className="px-5 py-4">Application</th>
										<th className="px-5 py-4">Payment</th>
										<th className="px-5 py-4">Last Saved</th>
										<th className="px-5 py-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[#dbe5f1]">
									{paginatedStudents.map((student) => {
										const application = student.application;
										const canUseApplicationRecord = Boolean(
											application && student.hasApplicationRecord,
										);
										const studentName = application
											? getStudentName(application)
											: student.username;

										return (
											<tr
												key={student.id}
												className="bg-white transition hover:bg-[#f8fbff]"
											>
												<td className="px-5 py-4">
													<p className="font-black text-[#06183A]">{studentName}</p>
													<p className="mt-1 text-sm font-semibold text-[#60728f]">
														{student.email}
													</p>
												</td>
												<td className="px-5 py-4">
													<p className="max-w-[14rem] break-words text-sm font-black text-[#0D2B55]">
														{application?.applicationNumber ?? "No admission data"}
													</p>
												</td>
												<td className="px-5 py-4">
													<p className="max-w-[14rem] text-sm font-black text-[#0D2B55]">
														{application ? getProgrammeLabel(application) : "Not started"}
													</p>
												</td>
												<td className="px-5 py-4">
													{application ? (
														<span className={statusPill(application.status)}>
															{STATUS_LABELS[application.status]}
														</span>
													) : (
														<span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-600">
															Not submitted
														</span>
													)}
												</td>
												<td className="px-5 py-4">
													<p className="text-sm font-black text-[#0D2B55]">
														{application
															? PAYMENT_LABELS[application.paymentStatus]
															: "Not available"}
													</p>
												</td>
												<td className="px-5 py-4">
													<p className="text-sm font-bold text-[#60728f]">
														{formatDate(application?.lastSavedAt)}
													</p>
												</td>
												<td className="px-5 py-4">
													<RowActionMenu
														label={`Open actions for ${studentName}`}
														open={openActionsId === student.id}
														onOpenChange={(open) =>
															setOpenActionsId(open ? student.id : null)
														}
														items={[
															{
																label: "View",
																icon: <Eye className="size-4" />,
																disabled:
																	!canViewStudentRecords || !canUseApplicationRecord,
																onSelect: () => {
																	if (application && canUseApplicationRecord) {
																		setViewApplication(application);
																	}
																	closeActions();
																},
															},
															{
																label: "Print",
																icon: <Printer className="size-4" />,
																disabled:
																	!canViewStudentRecords || !canUseApplicationRecord,
																onSelect: () => {
																	if (application && canUseApplicationRecord) {
																		printApplication(application, collegeName);
																	}
																	closeActions();
																},
															},
															{
																label: "Export",
																icon: <Download className="size-4" />,
																disabled:
																	!canExportStudentRecords || !canUseApplicationRecord,
																className: "text-[#0D2B55] hover:bg-[#eef4fb]",
																onSelect: () => {
																	if (application && canUseApplicationRecord) {
																		exportApplication(application);
																	}
																	closeActions();
																},
															},
														]}
													/>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>

						<div className="flex flex-col gap-3 border-t border-[#dbe5f1] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
							<p className="text-sm font-semibold text-[#60728f]">
								Rows per page: {PAGE_SIZE}
							</p>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
									disabled={safePage === 1}
									className="h-10 rounded-2xl border border-[#d3dfed] bg-white px-4 text-sm font-black text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D] disabled:cursor-not-allowed disabled:opacity-40"
								>
									Previous
								</button>
								<button
									type="button"
									onClick={() =>
										setCurrentPage((page) => Math.min(pageCount, page + 1))
									}
									disabled={safePage === pageCount}
									className="h-10 rounded-2xl bg-[#0D2B55] px-4 text-sm font-black text-white transition hover:bg-[#123866] disabled:cursor-not-allowed disabled:opacity-40"
								>
									Next
								</button>
							</div>
						</div>
					</>
				)}
			</div>

			<FullRecordModal
				application={viewApplication}
				collegeName={collegeName}
				onClose={() => setViewApplication(null)}
			/>
		</section>
	);
}
