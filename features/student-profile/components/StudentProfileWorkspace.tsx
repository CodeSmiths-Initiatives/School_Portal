import {
	BadgeCheck,
	CalendarDays,
	FileCheck2,
	FileText,
	GraduationCap,
	Mail,
	MapPin,
	Phone,
	ShieldCheck,
	Sparkles,
	UserRound,
} from "lucide-react";

type StudentProfileWorkspaceProps = {
	studentName: string;
	email: string;
	collegeName: string;
	reference?: string;
};

const readinessItems = [
	{ label: "Biodata", value: "Complete", progress: 100, tone: "success" },
	{ label: "Guardian", value: "Complete", progress: 100, tone: "success" },
	{ label: "Academic", value: "Review", progress: 78, tone: "warning" },
	{ label: "Documents", value: "1 pending", progress: 82, tone: "warning" },
];

const profileSections = [
	{
		title: "Personal information",
		description: "Legal name, date of birth, gender, nationality, and applicant reference.",
		icon: UserRound,
	},
	{
		title: "Guardian details",
		description: "Guardian contact, emergency number, next-of-kin, and home address.",
		icon: Phone,
	},
	{
		title: "Academic records",
		description: "Entry route, programme choice, O-level summary, and screening readiness.",
		icon: GraduationCap,
	},
	{
		title: "Document readiness",
		description: "Uploaded files, verification state, missing documents, and review trail.",
		icon: FileCheck2,
	},
];

const documentItems = [
	{ label: "Passport photograph", status: "Verified", tone: "success" },
	{ label: "O-level result", status: "Needs review", tone: "warning" },
	{ label: "Birth certificate", status: "Verified", tone: "success" },
];

function getStatusClass(tone: string) {
	if (tone === "success") {
		return "bg-[#edf8f1] text-[#167a3e]";
	}

	if (tone === "warning") {
		return "bg-[#fff7e8] text-[#a76500]";
	}

	return "bg-[#eef4fb] text-[#35527d]";
}

export default function StudentProfileWorkspace({
	studentName,
	email,
	collegeName,
	reference = "ADM-1780071414887",
}: StudentProfileWorkspaceProps) {
	return (
		<div className="space-y-5">
			<section className="overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
				<div className="grid gap-0 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
					<div className="relative bg-[#0D2B55] p-5 text-white sm:p-6 lg:p-7">
						<div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#B7770D,#E4A11B,#2E86C1)]" />
						<div className="flex flex-col gap-5 sm:flex-row sm:items-center">
							<div className="relative flex size-24 shrink-0 items-center justify-center rounded-3xl border border-[#E4A11B]/70 bg-white/8 shadow-[0_20px_40px_rgba(7,23,52,0.25)] sm:size-28">
								<UserRound className="size-11 text-white" />
								<span className="absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-full bg-[#E4A11B] text-[#0D2B55] shadow-lg">
									<Sparkles className="size-4" />
								</span>
							</div>

							<div className="min-w-0">
								<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#E4A11B]">
									Student Profile
								</p>
								<h2 className="mt-2 text-2xl font-bold sm:text-3xl">
									{studentName}
								</h2>
								<p className="mt-2 max-w-2xl text-sm leading-6 text-[#c5d4e8]">
									Your profile is scoped to {collegeName}. Keep biodata,
									guardian details, academic records, and documents ready for
									admission and student services.
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
									{email}
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
										Session
									</p>
								</div>
								<p className="mt-2 text-sm font-semibold text-white">
									2026 / 2027
								</p>
							</div>
						</div>
					</div>

					<div className="bg-[#fbfdff] p-5 sm:p-6 lg:p-7">
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
									Readiness Score
								</p>
								<p className="mt-3 text-4xl font-bold text-[#0D2B55]">92%</p>
							</div>
							<div className="flex size-12 items-center justify-center rounded-2xl bg-[#eef8f1] text-[#167a3e]">
								<BadgeCheck className="size-5" />
							</div>
						</div>

						<div className="mt-5 h-2 overflow-hidden rounded-full bg-[#dfe7f1]">
							<div className="h-full w-[92%] rounded-full bg-[linear-gradient(90deg,#B7770D,#E4A11B)]" />
						</div>

						<div className="mt-5 rounded-2xl border border-[#dbe5f1] bg-white p-4">
							<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8495af]">
								Applicant reference
							</p>
							<p className="mt-2 break-all text-sm font-bold text-[#0D2B55]">
								{reference}
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{readinessItems.map((item) => (
					<div
						key={item.label}
						className="rounded-2xl border border-[#dbe5f1] bg-white p-4 shadow-sm transition hover:border-[#c7d5e8] hover:shadow-md"
					>
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm font-bold text-[#17305f]">{item.label}</p>
							<span
								className={`rounded-full px-3 py-1 text-[10px] font-bold ${getStatusClass(
									item.tone,
								)}`}
							>
								{item.value}
							</span>
						</div>
						<div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#dfe7f1]">
							<div
								className="h-full rounded-full bg-[#2E86C1]"
								style={{ width: `${item.progress}%` }}
							/>
						</div>
					</div>
				))}
			</section>

			<section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
				<div className="rounded-3xl border border-[#dbe5f1] bg-white p-5 shadow-sm sm:p-6">
					<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
						Profile Areas
					</p>
					<div className="mt-5 grid gap-3 md:grid-cols-2">
						{profileSections.map((section) => {
							const SectionIcon = section.icon;

							return (
								<div
									key={section.title}
									className="rounded-2xl border border-[#e3eaf4] bg-[#fbfdff] p-4"
								>
									<div className="flex items-start gap-3">
										<div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#eef4fb] text-[#2E86C1]">
											<SectionIcon className="size-4.5" />
										</div>
										<div>
											<h3 className="text-sm font-bold text-[#17305f]">
												{section.title}
											</h3>
											<p className="mt-2 text-sm leading-relaxed text-[#60728f]">
												{section.description}
											</p>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<div className="rounded-3xl border border-[#dbe5f1] bg-white p-5 shadow-sm sm:p-6">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
								Documents
							</p>
							<p className="mt-2 text-sm text-[#60728f]">
								Current upload readiness.
							</p>
						</div>
						<div className="flex size-11 items-center justify-center rounded-2xl bg-[#eef4fb] text-[#2E86C1]">
							<ShieldCheck className="size-5" />
						</div>
					</div>

					<div className="mt-5 space-y-3">
						{documentItems.map((document) => (
							<div
								key={document.label}
								className="flex items-center justify-between gap-3 rounded-2xl border border-[#e3eaf4] bg-[#fbfdff] px-3 py-3"
							>
								<div className="flex min-w-0 items-center gap-3">
									<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#2E86C1]">
										<FileText className="size-4" />
									</div>
									<p className="truncate text-sm font-bold text-[#17305f]">
										{document.label}
									</p>
								</div>
								<span
									className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold ${getStatusClass(
										document.tone,
									)}`}
								>
									{document.status}
								</span>
							</div>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
