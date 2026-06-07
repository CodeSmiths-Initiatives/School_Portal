"use client";

import type { AdmissionApplicationSummary } from "@/lib/services/admission-application.service";
import {
	ArrowRight,
	BadgeCheck,
	CalendarDays,
	CheckCircle2,
	ClipboardCheck,
	Eye,
	FileCheck2,
	FileText,
	GraduationCap,
	Mail,
	MapPin,
	Phone,
	Printer,
	ShieldCheck,
	UserRound,
	X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type StudentProfileWorkspaceProps = {
	studentName: string;
	email: string;
	collegeName: string;
	collegeSlug: string;
	application?: AdmissionApplicationSummary | null;
};

type ProfileSection = {
	key: string;
	title: string;
	description: string;
	icon: typeof UserRound;
	complete: boolean;
	fields: Array<{ label: string; value: string; wide?: boolean }>;
};

type FullRecordSection = {
	title: string;
	description: string;
	fields: Array<{ label: string; value: string; wide?: boolean }>;
};

function asRecord(value: unknown) {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function asString(value: unknown, fallback = "") {
	return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getSafeImageSource(value: string) {
	if (
		value.startsWith("/") ||
		value.startsWith("http://") ||
		value.startsWith("https://") ||
		value.startsWith("data:image/")
	) {
		return value;
	}

	return "";
}

function getInitials(name: string) {
	const parts = name
		.split(" ")
		.map((part) => part.trim())
		.filter(Boolean);

	if (!parts.length) return "SP";

	return parts
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("");
}

function getStatusLabel(status?: string) {
	if (!status) return "Not started";

	return status
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function getStatusClass(status?: string) {
	if (status === "submitted" || status === "approved") {
		return "border-[#b7ebc8] bg-[#edf8f1] text-[#167a3e]";
	}

	if (status === "under_review" || status === "draft") {
		return "border-[#f2d59a] bg-[#fff7e8] text-[#a76500]";
	}

	if (status === "rejected" || status === "cancelled") {
		return "border-[#ffb4b4] bg-[#fff3f3] text-[#b42318]";
	}

	return "border-[#dbe5f1] bg-[#eef4fb] text-[#35527d]";
}

function isSectionComplete(
	data: Record<string, unknown>,
	requiredFields: string[],
) {
	return requiredFields.every((field) => {
		const value = data[field];

		if (Array.isArray(value)) {
			return value.length > 0;
		}

		if (typeof value === "boolean") {
			return value;
		}

		return Boolean(asString(value));
	});
}

function getCompletionPercent(sections: ProfileSection[]) {
	if (!sections.length) return 0;
	const completed = sections.filter((section) => section.complete).length;
	return Math.round((completed / sections.length) * 100);
}

function DetailItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="min-w-0 rounded-2xl border border-[#e1e9f4] bg-[#fbfdff] px-4 py-3">
			<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8495af]">
				{label}
			</p>
			<p className="mt-1 min-h-5 break-all text-sm font-bold text-[#0D2B55] sm:break-words">
				{value || "-"}
			</p>
		</div>
	);
}

function ProfilePhoto({
	name,
	src,
	reference,
}: {
	name: string;
	src: string;
	reference: string;
}) {
	const initials = getInitials(name);

	return (
		<div className="relative shrink-0">
			<div className="relative flex size-24 items-center justify-center overflow-hidden rounded-3xl border border-[#E4A11B]/70 bg-white/10 shadow-[0_20px_40px_rgba(7,23,52,0.25)] sm:size-28">
				{src ? (
					<img
						src={src}
						alt={`${name} passport photograph`}
						className="size-full object-cover"
					/>
				) : (
					<div className="flex size-full flex-col items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(228,161,27,0.32),rgba(13,43,85,0.9))] text-white">
						<span className="text-2xl font-black tracking-[0.08em]">
							{initials}
						</span>
						<span className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#E4A11B]">
							Profile
						</span>
					</div>
				)}
			</div>
			<span className="absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-full bg-[#E4A11B] text-[#0D2B55] shadow-lg">
				<BadgeCheck className="size-4" />
			</span>
			<span className="absolute -bottom-2 left-1/2 max-w-[7rem] -translate-x-1/2 truncate rounded-full border border-white/15 bg-[#06172f]/80 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow-lg">
				{reference === "Profile not started" ? "Pending" : reference}
			</span>
		</div>
	);
}

function formatSubjectList(subjects: unknown[]) {
	const values = subjects
		.map((item) => {
			const subject = asRecord(item);
			const name = asString(subject.name);
			const grade = asString(subject.grade);
			return name && grade ? `${name} (${grade})` : "";
		})
		.filter(Boolean);

	return values.length ? values.join(", ") : "-";
}

function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

function printAdmissionRecord(input: {
	applicantName: string;
	email: string;
	collegeName: string;
	reference: string;
	status: string;
	lastSavedAt: string;
	sections: FullRecordSection[];
}) {
	const rows = input.sections
		.map(
			(section) => `
				<section class="section">
					<div class="section-head">
						<p>${escapeHtml(section.title)}</p>
						<span>${escapeHtml(section.description)}</span>
					</div>
					<div class="grid">
						${section.fields
							.map(
								(field) => `
									<div class="field">
										<label>${escapeHtml(field.label)}</label>
										<strong>${escapeHtml(field.value || "-")}</strong>
									</div>
								`,
							)
							.join("")}
					</div>
				</section>
			`,
		)
		.join("");
	const popup = window.open("", "_blank", "width=980,height=760");

	if (!popup) return;

	popup.document.write(`
		<html>
			<head>
				<title>Admission Profile - ${escapeHtml(input.reference)}</title>
				<style>
					* { box-sizing: border-box; }
					body {
						margin: 0;
						background: #eef4fb;
						color: #0D2B55;
						font-family: Arial, sans-serif;
					}
					.page {
						max-width: 920px;
						margin: 24px auto;
						background: white;
						border: 1px solid #dbe5f1;
						border-radius: 22px;
						overflow: hidden;
					}
					.header {
						background: #0D2B55;
						color: white;
						padding: 28px 32px;
						border-top: 6px solid #B7770D;
					}
					.header small {
						color: #E4A11B;
						font-weight: 800;
						letter-spacing: 0.22em;
						text-transform: uppercase;
					}
					h1 { margin: 8px 0 8px; font-size: 28px; }
					.meta {
						display: grid;
						grid-template-columns: repeat(3, 1fr);
						gap: 12px;
						padding: 18px 32px;
						border-bottom: 1px solid #dbe5f1;
					}
					.meta div, .field {
						border: 1px solid #dbe5f1;
						border-radius: 14px;
						padding: 12px;
						background: #fbfdff;
					}
					label {
						display: block;
						color: #8495af;
						font-size: 10px;
						font-weight: 800;
						letter-spacing: 0.18em;
						text-transform: uppercase;
						margin-bottom: 6px;
					}
					strong { font-size: 13px; line-height: 1.5; }
					.content { padding: 24px 32px 32px; }
					.section {
						border: 1px solid #dbe5f1;
						border-radius: 18px;
						margin-bottom: 16px;
						overflow: hidden;
						break-inside: avoid;
					}
					.section-head {
						padding: 14px 16px;
						background: #f7fafc;
						border-bottom: 1px solid #dbe5f1;
					}
					.section-head p {
						margin: 0 0 4px;
						color: #B7770D;
						font-size: 11px;
						font-weight: 800;
						letter-spacing: 0.22em;
						text-transform: uppercase;
					}
					.section-head span { color: #60728f; font-size: 12px; }
					.grid {
						display: grid;
						grid-template-columns: repeat(2, 1fr);
						gap: 12px;
						padding: 16px;
					}
					@media print {
						body { background: white; }
						.page { margin: 0; max-width: none; border-radius: 0; }
					}
				</style>
			</head>
			<body>
				<main class="page">
					<header class="header">
						<small>Student Admission Profile</small>
						<h1>${escapeHtml(input.applicantName)}</h1>
						<p>${escapeHtml(input.collegeName)} - ${escapeHtml(input.email)}</p>
					</header>
					<section class="meta">
						<div><label>Reference</label><strong>${escapeHtml(input.reference)}</strong></div>
						<div><label>Status</label><strong>${escapeHtml(input.status)}</strong></div>
						<div><label>Last Saved</label><strong>${escapeHtml(input.lastSavedAt)}</strong></div>
					</section>
					<div class="content">${rows}</div>
				</main>
				<script>window.onload = () => { window.print(); };</script>
			</body>
		</html>
	`);
	popup.document.close();
}

function AdmissionRecordPanel({
	applicantName,
	email,
	collegeName,
	reference,
	status,
	lastSavedAt,
	completionPercent,
	sections,
	onView,
	onPrint,
}: {
	applicantName: string;
	email: string;
	collegeName: string;
	reference: string;
	status: string;
	lastSavedAt: string;
	completionPercent: number;
	sections: FullRecordSection[];
	onView: () => void;
	onPrint: () => void;
}) {
	const totalFields = sections.reduce((count, section) => count + section.fields.length, 0);
	const filledFields = sections.reduce(
		(count, section) =>
			count + section.fields.filter((field) => field.value && field.value !== "-").length,
		0,
	);
	const sectionStats = sections.map((section) => ({
		title: section.title,
		filled: section.fields.filter((field) => field.value && field.value !== "-").length,
		total: section.fields.length,
	}));

	return (
		<section className="relative overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white p-4 shadow-[0_18px_44px_rgba(13,43,85,0.08)] sm:p-5">
			<div className="absolute right-0 top-0 hidden h-full w-1/4 bg-[linear-gradient(135deg,rgba(13,43,85,0.05),rgba(228,161,27,0.08))] xl:block" />
			<div className="relative grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
				<div>
					<div className="flex items-start gap-4">
						<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#0D2B55] text-[#E4A11B] shadow-[0_14px_26px_rgba(13,43,85,0.18)]">
							<FileText className="size-5" />
						</div>
						<div className="min-w-0">
							<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
								Admission Record
							</p>
							<h3 className="mt-2 text-xl font-bold text-[#0D2B55]">
								Full student details saved from the profile form
							</h3>
							<p className="mt-2 max-w-3xl text-sm leading-6 text-[#60728f]">
								View or print the complete admission profile record, including
								bio data, contact, O-Level, programme, declaration, and saved
								application reference.
							</p>
						</div>
					</div>

					<div className="mt-5 grid gap-3 md:grid-cols-3">
						<DetailItem label="Applicant" value={applicantName} />
						<DetailItem label="Email" value={email} />
						<DetailItem label="College" value={collegeName} />
					</div>

					<div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
						{sectionStats.map((section) => (
							<div
								key={section.title}
								className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] px-3 py-2"
							>
								<p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-[#8495af]">
									{section.title}
								</p>
								<p className="mt-1 text-sm font-bold text-[#0D2B55]">
									{section.filled}/{section.total} saved
								</p>
							</div>
						))}
					</div>
				</div>

				<div className="rounded-3xl border border-[#dbe5f1] bg-[#fbfdff] p-4 shadow-sm">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8495af]">
								Record Completion
							</p>
							<p className="mt-2 text-3xl font-bold text-[#0D2B55]">
								{completionPercent}%
							</p>
						</div>
						<span className="rounded-full border border-[#dbe5f1] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#35527d]">
							{filledFields}/{totalFields} fields
						</span>
					</div>
					<div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dfe7f1]">
						<div
							className="h-full rounded-full bg-[linear-gradient(90deg,#0D2B55,#E4A11B)] transition-all"
							style={{ width: `${completionPercent}%` }}
						/>
					</div>
					<div className="mt-3 space-y-2 rounded-2xl border border-[#e1e9f4] bg-white p-3">
						<div>
							<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8495af]">
								Reference
							</p>
							<p className="mt-1 break-all text-sm font-bold text-[#0D2B55] sm:break-words">
								{reference}
							</p>
						</div>
						<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8495af]">
									Status
								</p>
								<p className="mt-1 text-sm font-bold text-[#0D2B55]">{status}</p>
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8495af]">
									Last Saved
								</p>
								<p className="mt-1 text-sm font-bold text-[#0D2B55]">
									{lastSavedAt}
								</p>
							</div>
						</div>
					</div>
					<div className="mt-3 grid gap-2 sm:grid-cols-2">
						<button
							type="button"
							onClick={onView}
							className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#0D2B55] bg-white px-4 py-3 text-sm font-bold text-[#0D2B55] transition hover:-translate-y-0.5 hover:bg-[#0D2B55] hover:text-white"
						>
							<Eye className="size-4" />
							View details
						</button>
						<button
							type="button"
							onClick={onPrint}
							className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866]"
						>
							<Printer className="size-4" />
							Print record
						</button>
					</div>
				</div>
			</div>
		</section>
	);
}

function FullRecordModal({
	open,
	onClose,
	applicantName,
	email,
	collegeName,
	reference,
	status,
	lastSavedAt,
	sections,
	onPrint,
}: {
	open: boolean;
	onClose: () => void;
	applicantName: string;
	email: string;
	collegeName: string;
	reference: string;
	status: string;
	lastSavedAt: string;
	sections: FullRecordSection[];
	onPrint: () => void;
}) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
				<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
					<div>
						<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#E4A11B]">
							Full Admission Details
						</p>
						<h2 className="mt-2 text-xl font-bold sm:text-2xl">{applicantName}</h2>
						<p className="mt-1 text-sm text-[#c5d4e8]">
							{collegeName} - {email}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#0D2B55]"
						aria-label="Close details"
					>
						<X className="size-5" />
					</button>
				</div>

				<div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-5 sm:p-6">
					<div className="grid gap-3 md:grid-cols-3">
						<DetailItem label="Reference" value={reference} />
						<DetailItem label="Status" value={status} />
						<DetailItem label="Last Saved" value={lastSavedAt} />
					</div>

					<div className="mt-5 space-y-4">
						{sections.map((section) => (
							<div
								key={section.title}
								className="overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white"
							>
								<div className="border-b border-[#dbe5f1] bg-[#fbfdff] px-5 py-4">
									<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
										{section.title}
									</p>
									<p className="mt-1 text-sm text-[#60728f]">
										{section.description}
									</p>
								</div>
								<div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
									{section.fields.map((field) => (
										<DetailItem
											key={`${section.title}-${field.label}`}
											label={field.label}
											value={field.value}
										/>
									))}
								</div>
							</div>
						))}
					</div>

					<div className="sticky bottom-0 mt-5 flex flex-col gap-3 border-t border-[#dbe5f1] bg-white/95 pt-4 backdrop-blur sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={onClose}
							className="inline-flex items-center justify-center rounded-2xl border border-[#dbe5f1] px-5 py-3 text-sm font-bold text-[#0D2B55] transition hover:border-[#0D2B55]"
						>
							Close
						</button>
						<button
							type="button"
							onClick={onPrint}
							className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866]"
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

function SectionCard({
	section,
	featured = false,
}: {
	section: ProfileSection;
	featured?: boolean;
}) {
	const SectionIcon = section.icon;

	return (
		<div
			className={`group relative h-full min-w-0 overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(13,43,85,0.1)] sm:p-5 ${
				featured ? "xl:col-span-2" : ""
			}`}
		>
			{featured ? (
				<>
					<div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#0D2B55,#B7770D,#E4A11B)]" />
					<div className="absolute -right-20 -top-20 size-44 rounded-full bg-[#E4A11B]/10 transition duration-500 group-hover:scale-110" />
				</>
			) : null}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex min-w-0 items-start gap-3">
					<div
						className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
							featured
								? "bg-[#0D2B55] text-[#E4A11B] shadow-[0_12px_24px_rgba(13,43,85,0.16)]"
								: "bg-[#eef4fb] text-[#2E86C1]"
						}`}
					>
						<SectionIcon className="size-5" />
					</div>
					<div>
						<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
							{featured ? "Academic Result Record" : "Saved Section"}
						</p>
						<h3 className="mt-1 text-base font-bold text-[#0D2B55]">
							{section.title}
						</h3>
						<p className="mt-1 text-sm leading-6 text-[#60728f]">
							{section.description}
						</p>
					</div>
				</div>
				<span
					className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
						section.complete
							? "border-[#b7ebc8] bg-[#edf8f1] text-[#167a3e]"
							: "border-[#f2d59a] bg-[#fff7e8] text-[#a76500]"
					}`}
				>
					{section.complete ? "Complete" : "Required"}
				</span>
			</div>

			<div
				className={`mt-4 grid gap-3 ${
					featured ? "md:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2"
				}`}
			>
				{section.fields.map((field) => (
					<div
						key={`${section.key}-${field.label}`}
						className={
							field.wide
								? featured
									? "md:col-span-2 xl:col-span-2"
									: "sm:col-span-2"
								: undefined
						}
					>
						<DetailItem label={field.label} value={field.value} />
					</div>
				))}
			</div>
		</div>
	);
}

export default function StudentProfileWorkspace({
	studentName,
	email,
	collegeName,
	collegeSlug,
	application,
}: StudentProfileWorkspaceProps) {
	const metadata = asRecord(application?.metadata);
	const profile = asRecord(metadata.admissionProfile);
	const bioData = asRecord(profile.bioData);
	const contactData = asRecord(profile.contactData);
	const oLevelData = asRecord(profile.oLevelData);
	const programmeData = asRecord(profile.programmeData);
	const declarationData = asRecord(profile.declarationData);
	const subjects = Array.isArray(oLevelData.subjects) ? oLevelData.subjects : [];
	const applicantName =
		[
			asString(bioData.surname),
			asString(bioData.firstName),
			asString(bioData.otherName),
		]
			.filter(Boolean)
			.join(" ") || studentName;
	const studentEmail = asString(contactData.emailAddress, email);
	const passportPhoto = getSafeImageSource(asString(bioData.passportPhoto));
	const reference = application?.applicationNumber ?? "Profile not started";
	const lastSavedAt = application?.lastSavedAt
		? new Intl.DateTimeFormat("en-NG", {
				day: "2-digit",
				month: "short",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			}).format(new Date(application.lastSavedAt))
		: "No saved draft yet";
	const statusLabel = getStatusLabel(application?.status);

	const sections: ProfileSection[] = [
		{
			key: "bio",
			title: "Bio Data",
			description: "Official identity details saved from the admission form.",
			icon: UserRound,
			complete: isSectionComplete(bioData, [
				"surname",
				"firstName",
				"dateOfBirth",
				"gender",
				"maritalStatus",
				"nationality",
				"stateOfOrigin",
				"localGovtArea",
				"nin",
				"passportPhoto",
			]),
			fields: [
				{
					label: "Passport Photograph",
					value: passportPhoto
						? "Uploaded"
						: asString(bioData.passportPhoto)
							? "Upload sync pending"
							: "",
				},
				{ label: "Full Name", value: applicantName },
				{ label: "Date of Birth", value: asString(bioData.dateOfBirth) },
				{ label: "Gender", value: asString(bioData.gender) },
				{ label: "Nationality", value: asString(bioData.nationality) },
				{ label: "Marital Status", value: asString(bioData.maritalStatus) },
				{ label: "Religion", value: asString(bioData.religion) },
				{ label: "State / LGA", value: [asString(bioData.stateOfOrigin), asString(bioData.localGovtArea)].filter(Boolean).join(" / ") },
				{ label: "NIN", value: asString(bioData.nin) },
			],
		},
		{
			key: "contact",
			title: "Contact",
			description: "Applicant and guardian communication details.",
			icon: Phone,
			complete: isSectionComplete(contactData, [
				"phoneNumber",
				"emailAddress",
				"residentialAddress",
				"guardianFullName",
				"guardianRelationship",
				"guardianPhone",
				"guardianAddress",
			]),
			fields: [
				{ label: "Email", value: studentEmail },
				{ label: "Phone", value: asString(contactData.phoneNumber) },
				{
					label: "Residential Address",
					value: asString(contactData.residentialAddress),
					wide: true,
				},
				{ label: "Guardian", value: asString(contactData.guardianFullName) },
				{ label: "Relationship", value: asString(contactData.guardianRelationship) },
				{ label: "Guardian Phone", value: asString(contactData.guardianPhone) },
				{ label: "Guardian Email", value: asString(contactData.guardianEmail) },
				{ label: "Blood Group", value: asString(contactData.bloodGroup) },
				{ label: "Genotype", value: asString(contactData.genotype) },
			],
		},
		{
			key: "olevel",
			title: "O-Level",
			description: "Examination record and validated subject credits.",
			icon: FileText,
			complete: isSectionComplete(oLevelData, [
				"examinationType",
				"examinationYear",
				"examinationNumber",
				"centreNumber",
				"subjectCategory",
				"subjects",
			]),
			fields: [
				{ label: "Exam Type", value: asString(oLevelData.examinationType) },
				{ label: "Exam Year", value: asString(oLevelData.examinationYear) },
				{ label: "Exam Number", value: asString(oLevelData.examinationNumber) },
				{ label: "Centre Number", value: asString(oLevelData.centreNumber) },
				{ label: "Subject Category", value: asString(oLevelData.subjectCategory) },
				{ label: "Credit Subjects", value: subjects.length ? `${subjects.length} saved` : "" },
				{
					label: "Subjects / Grades",
					value: formatSubjectList(subjects),
					wide: true,
				},
			],
		},
		{
			key: "programme",
			title: "Programme",
			description: "Course selection, entry mode, and JAMB details.",
			icon: GraduationCap,
			complete: isSectionComplete(programmeData, [
				"faculty",
				"department",
				"modeOfEntry",
				"programmeType",
				"jambRegNumber",
				"jambScore",
				"jambYear",
			]),
			fields: [
				{ label: "Faculty", value: asString(programmeData.faculty) },
				{ label: "Department", value: asString(programmeData.department) },
				{ label: "Mode of Entry", value: asString(programmeData.modeOfEntry) },
				{ label: "Programme Type", value: asString(programmeData.programmeType) },
				{ label: "JAMB Number", value: asString(programmeData.jambRegNumber) },
				{ label: "JAMB Score", value: asString(programmeData.jambScore) },
				{ label: "JAMB Year", value: asString(programmeData.jambYear) },
				{ label: "Second Choice", value: asString(programmeData.secondChoiceProgramme) },
			],
		},
		{
			key: "declaration",
			title: "Declaration",
			description: "Applicant confirmation and signed declaration state.",
			icon: ClipboardCheck,
			complete: isSectionComplete(declarationData, ["agreed", "signature", "date"]),
			fields: [
				{ label: "Agreement", value: declarationData.agreed ? "Accepted" : "" },
				{ label: "Signature", value: asString(declarationData.signature) },
				{ label: "Date", value: asString(declarationData.date) },
				{ label: "Status", value: statusLabel },
			],
		},
	];
	const fullRecordSections: FullRecordSection[] = sections.map(
		({ title, description, fields }) => ({ title, description, fields }),
	);
	const [
		bioSection,
		contactSection,
		oLevelSection,
		programmeSection,
		declarationSection,
	] = sections;
	const completionPercent = getCompletionPercent(sections);
	const isSubmitted = application?.status === "submitted";
	const [isRecordOpen, setIsRecordOpen] = useState(false);

	function handlePrintRecord() {
		printAdmissionRecord({
			applicantName,
			email: studentEmail,
			collegeName,
			reference,
			status: statusLabel,
			lastSavedAt,
			sections: fullRecordSections,
		});
	}

	return (
		<div className="space-y-5">
			<section className="overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
				<div className="grid gap-0 xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]">
					<div className="relative bg-[#0D2B55] p-5 text-white sm:p-6 lg:p-7">
						<div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#B7770D,#E4A11B,#2E86C1)]" />
						<div className="flex flex-col gap-5 sm:flex-row sm:items-center">
							<ProfilePhoto
								name={applicantName}
								src={passportPhoto}
								reference={reference}
							/>

							<div className="min-w-0">
								<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#E4A11B]">
									Student Admission Profile
								</p>
								<h2 className="mt-2 text-2xl font-bold sm:text-3xl">
									{applicantName}
								</h2>
								<p className="mt-2 max-w-2xl text-sm leading-6 text-[#c5d4e8]">
									This profile is loaded from the saved admission record for{" "}
									{collegeName}. Continue the profile form to complete missing
									mandatory sections.
								</p>
							</div>
						</div>

						<div className="mt-6 grid gap-3 md:grid-cols-3">
							<div className="rounded-2xl border border-white/12 bg-white/8 p-3 backdrop-blur-sm">
								<div className="flex items-center gap-2 text-[#E4A11B]">
									<Mail className="size-4" />
									<p className="text-[10px] font-bold uppercase tracking-[0.2em]">
										Email
									</p>
								</div>
								<p className="mt-2 truncate text-sm font-semibold text-white">
									{studentEmail}
								</p>
							</div>
							<div className="rounded-2xl border border-white/12 bg-white/8 p-3 backdrop-blur-sm">
								<div className="flex items-center gap-2 text-[#E4A11B]">
									<MapPin className="size-4" />
									<p className="text-[10px] font-bold uppercase tracking-[0.2em]">
										College
									</p>
								</div>
								<p className="mt-2 truncate text-sm font-semibold text-white">
									{collegeName}
								</p>
							</div>
							<div className="rounded-2xl border border-white/12 bg-white/8 p-3 backdrop-blur-sm">
								<div className="flex items-center gap-2 text-[#E4A11B]">
									<CalendarDays className="size-4" />
									<p className="text-[10px] font-bold uppercase tracking-[0.2em]">
										Last Saved
									</p>
								</div>
								<p className="mt-2 truncate text-sm font-semibold text-white">
									{lastSavedAt}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-[#fbfdff] p-5 sm:p-6 lg:p-7">
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
									Profile Completion
								</p>
								<p className="mt-3 text-4xl font-bold text-[#0D2B55]">
									{completionPercent}%
								</p>
							</div>
							<div className="flex size-12 items-center justify-center rounded-2xl bg-[#eef8f1] text-[#167a3e]">
								<ShieldCheck className="size-5" />
							</div>
						</div>

						<div className="mt-5 h-2 overflow-hidden rounded-full bg-[#dfe7f1]">
							<div
								className="h-full rounded-full bg-[linear-gradient(90deg,#B7770D,#E4A11B)] transition-all"
								style={{ width: `${completionPercent}%` }}
							/>
						</div>

						<div className="mt-5 rounded-2xl border border-[#dbe5f1] bg-white p-4">
							<div className="flex items-center justify-between gap-3">
								<div>
									<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8495af]">
										Application Reference
									</p>
									<p className="mt-2 break-all text-sm font-bold text-[#0D2B55]">
										{reference}
									</p>
								</div>
								<span
									className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${getStatusClass(
										application?.status,
									)}`}
								>
									{getStatusLabel(application?.status)}
								</span>
							</div>
						</div>

						<Link
							href={`/college/${collegeSlug}/student/admission`}
							className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866]"
						>
							{isSubmitted ? "Review admission form" : "Continue admission profile"}
							<ArrowRight className="size-4" />
						</Link>
					</div>
				</div>
			</section>

			<AdmissionRecordPanel
				applicantName={applicantName}
				email={studentEmail}
				collegeName={collegeName}
				reference={reference}
				status={statusLabel}
				lastSavedAt={lastSavedAt}
				completionPercent={completionPercent}
				sections={fullRecordSections}
				onView={() => setIsRecordOpen(true)}
				onPrint={handlePrintRecord}
			/>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
				{sections.map((section) => (
					<div
						key={section.key}
						className="rounded-2xl border border-[#dbe5f1] bg-white p-4 shadow-sm"
					>
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm font-bold text-[#17305f]">{section.title}</p>
							{section.complete ? (
								<CheckCircle2 className="size-5 text-[#167a3e]" />
							) : (
								<FileCheck2 className="size-5 text-[#B7770D]" />
							)}
						</div>
						<p className="mt-2 text-xs leading-5 text-[#60728f]">
							{section.complete
								? "Mandatory details saved"
								: "Mandatory details required"}
						</p>
					</div>
				))}
			</section>

			<section className="grid items-stretch gap-5 xl:grid-cols-2">
				<SectionCard section={bioSection} />
				<SectionCard section={contactSection} />
				<SectionCard section={oLevelSection} featured />
				<SectionCard section={programmeSection} />
				<SectionCard section={declarationSection} />
			</section>

			<FullRecordModal
				open={isRecordOpen}
				onClose={() => setIsRecordOpen(false)}
				applicantName={applicantName}
				email={studentEmail}
				collegeName={collegeName}
				reference={reference}
				status={statusLabel}
				lastSavedAt={lastSavedAt}
				sections={fullRecordSections}
				onPrint={handlePrintRecord}
			/>
		</div>
	);
}
