import RegistrationHeader from "@/features/admission/components/RegistrationHeader";
import { getAdmissionCollegeOptions } from "@/lib/services/admission-college.service";
import {
	ArrowRight,
	Building2,
	GraduationCap,
	MapPin,
	Search,
	ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Choose College | School Portal",
	description:
		"Choose the college where the applicant admission should be registered.",
};

export default async function ApplyPage() {
	const colleges = await getAdmissionCollegeOptions();

	return (
		<div className="flex h-dvh flex-col overflow-hidden bg-[#f0f4fb] text-[#06183a]">
			<RegistrationHeader />

			<main className="grid min-h-0 flex-1 overflow-hidden bg-[#eef4fb] lg:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]">
				<aside className="hidden h-full overflow-hidden bg-[#0D2B55] px-5 py-6 text-white shadow-[18px_0_44px_-40px_rgba(13,43,85,0.85)] sm:px-7 lg:block lg:px-8 lg:py-8">
					<div className="mx-auto max-w-xl lg:max-w-none">
						<span className="inline-flex rounded-full border border-[#B7770D] bg-[#B7770D]/15 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#E4A11B]">
							Tenant Admission
						</span>
						<h1 className="mt-6 text-3xl font-black leading-tight">
							Choose the <span className="text-[#E4A11B]">college</span> for this
							application.
						</h1>
						<p className="mt-4 max-w-md text-sm leading-7 text-[#b7c8df]">
							Every applicant, admission record, payment invoice, and transaction
							will be scoped to the selected college from the first step.
						</p>

						<div className="mt-7 rounded-2xl border border-white/10 bg-white/8 p-4">
							<div className="flex items-start gap-3">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E4A11B]/15 text-[#E4A11B]">
									<ShieldCheck className="size-5" />
								</div>
								<div>
									<p className="text-sm font-bold">College-wise payment ready</p>
									<p className="mt-1 text-xs leading-6 text-[#b7c8df]">
										Paystack checkout receives the college slug so ledger,
										invoice, and audit records can stay tenant-aware.
									</p>
								</div>
							</div>
						</div>

						<div className="mt-5 grid grid-cols-2 gap-3">
							<div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
								<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8ea1be]">
									Colleges
								</p>
								<p className="mt-2 text-2xl font-black text-white">
									{colleges.length}
								</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
								<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8ea1be]">
									Scope
								</p>
								<p className="mt-2 text-2xl font-black text-white">1:1</p>
							</div>
						</div>
					</div>
				</aside>

				<section className="app-scrollbar min-h-0 min-w-0 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
					<div className="mb-5 rounded-2xl bg-[#0D2B55] p-5 text-white shadow-[0_18px_40px_-34px_rgba(13,43,85,0.65)] lg:hidden">
						<span className="inline-flex rounded-full border border-[#B7770D] bg-[#B7770D]/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#E4A11B]">
							Tenant Admission
						</span>
						<h1 className="mt-4 text-2xl font-black leading-tight">
							Choose the <span className="text-[#E4A11B]">college</span> for this
							application.
						</h1>
						<p className="mt-3 text-sm leading-6 text-[#b7c8df]">
							Every applicant, admission record, payment invoice, and transaction
							will be scoped to the selected college.
						</p>
					</div>

					<div className="min-h-full rounded-2xl border border-[#d8e3f0] bg-white p-5 shadow-[0_18px_44px_-34px_rgba(23,48,95,0.42)] sm:p-6 lg:p-7">
						<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
							<div>
								<p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B7770D]">
									Available colleges
								</p>
								<h2 className="mt-2 text-2xl font-black text-[#0d1b3e]">
									Start a tenant-scoped admission
								</h2>
								<p className="mt-2 max-w-2xl text-sm leading-7 text-[#60728f]">
									Select the institution first. The next page opens the same
									registration flow, but under the selected college URL.
								</p>
							</div>
							<div className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-[#dbe5f1] bg-[#f6f9fd] px-4 text-sm text-[#60728f] lg:max-w-xs">
								<Search className="size-4 text-[#B7770D]" />
								<span>Search-ready college directory</span>
							</div>
						</div>

						<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
							{colleges.map((college) => (
								<Link
									key={college.slug}
									href={`/college/${college.slug}/apply`}
									className="group flex min-h-[15.5rem] flex-col rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#B7770D]/70 hover:bg-white hover:shadow-[0_18px_36px_-28px_rgba(183,119,13,0.55)]"
								>
									<div className="flex items-start justify-between gap-4">
										<div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#edf5fc] text-[#0D2B55] transition group-hover:bg-[#0D2B55] group-hover:text-white">
											<Building2 className="size-5" />
										</div>
										<span className="rounded-full border border-[#d7e3f0] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#60728f]">
											{college.code}
										</span>
									</div>
									<h3 className="mt-4 text-base font-black leading-snug text-[#0d1b3e]">
										{college.name}
									</h3>
									<p className="mt-2 line-clamp-3 text-sm leading-6 text-[#60728f]">
										{college.description}
									</p>
									<div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#8090aa]">
										<MapPin className="size-3.5 text-[#B7770D]" />
										<span>Kwara State</span>
									</div>
									<span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-[#B7770D]">
										Start application
										<ArrowRight className="size-4 transition group-hover:translate-x-1" />
									</span>
								</Link>
							))}
						</div>

						<div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#dbe5f1] bg-[#f6f9fd] px-4 py-4 text-sm text-[#60728f] sm:flex-row sm:items-center sm:justify-between">
							<span className="inline-flex items-center gap-2">
								<GraduationCap className="size-4 text-[#B7770D]" />
								Already registered?
							</span>
							<Link href="/signin" className="font-bold text-[#0D2B55] hover:text-[#B7770D]">
								Continue to student login
							</Link>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}
