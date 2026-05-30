import { Building2, GraduationCap } from "lucide-react";
import Link from "next/link";

type PortalKind = "student" | "staff";

type PortalEntrySwitchProps = {
	activePortal?: PortalKind;
	className?: string;
};

const PORTAL_ITEMS: Array<{
	id: PortalKind;
	label: string;
	href: string;
	icon: typeof GraduationCap;
}> = [
	{
		id: "student",
		label: "Student Login",
		href: "/signin",
		icon: GraduationCap,
	},
	{
		id: "staff",
		label: "Staff Login",
		href: "/staff/signin",
		icon: Building2,
	},
];

export default function PortalEntrySwitch({
	activePortal,
	className = "",
}: PortalEntrySwitchProps) {
	return (
		<div
			className={`grid w-full max-w-[16.5rem] grid-cols-2 gap-2 rounded-[1.35rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_16px_30px_rgba(7,23,52,0.16)] backdrop-blur-[2px] ${className}`}
		>
			{PORTAL_ITEMS.map((item) => {
				const Icon = item.icon;
				const isActive = item.id === activePortal;

				return (
					<Link
						key={item.id}
						href={item.href}
						className={`group inline-flex min-h-[4.6rem] flex-col items-start justify-center gap-2 rounded-[1.1rem] border px-3.5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] transition sm:text-[11px] ${
							isActive
								? "border-[#B7770D] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] text-[#F5C15A] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_18px_rgba(0,0,0,0.08)]"
								: "border-[#d7e0eb] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-[#36527b] shadow-[0_8px_14px_rgba(10,33,63,0.06)] hover:border-[#bfd0e3] hover:bg-[#f8fbff] hover:text-[#0d2b55]"
						}`}
					>
						<div
							className={`flex size-7 shrink-0 items-center justify-center rounded-full transition ${
								isActive
									? "bg-[#B7770D]/18 text-[#F5C15A]"
									: "bg-[#eef4fb] text-[#48617f] group-hover:bg-[#e7f0fb] group-hover:text-[#1c3e6e]"
							}`}
						>
							<Icon className="size-3.5" />
						</div>
						<div className="min-w-0">
							<span className="block leading-none">{item.label}</span>
							<span
								className={`mt-1 block text-[9px] font-medium normal-case tracking-normal ${
									isActive ? "text-[#d4deed]" : "text-[#7d90aa]"
								}`}
							>
								{item.id === "student" ? "Applicant access" : "Internal portal"}
							</span>
						</div>
					</Link>
				);
			})}
		</div>
	);
}
