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
	eyebrow: string;
	href: string;
	icon: typeof GraduationCap;
}> = [
	{
		id: "student",
		label: "Student Login",
		eyebrow: "Applicant access",
		href: "/signin",
		icon: GraduationCap,
	},
	{
		id: "staff",
		label: "Staff Login",
		eyebrow: "Internal portal",
		href: "/staff/signin",
		icon: Building2,
	},
];

export default function PortalEntrySwitch({
	activePortal,
	className = "",
}: PortalEntrySwitchProps) {
	const activeOffset =
		activePortal === "staff" ? "translate-x-[calc(100%+0.5rem)]" : "";

	return (
		<div
			className={`relative grid w-full max-w-[18rem] grid-cols-2 gap-2 overflow-hidden rounded-[1.25rem] border border-white/12 bg-[#183B68]/74 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_18px_36px_rgba(4,18,43,0.24)] backdrop-blur-[6px] ${className}`}
		>
			<div
				className={`pointer-events-none absolute bottom-2 left-2 top-2 w-[calc(50%-0.75rem)] rounded-[1rem] border border-[#D79518] bg-[linear-gradient(145deg,#263C59_0%,#172F58_56%,#10264B_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_12px_22px_rgba(4,18,43,0.24)] transition-transform duration-300 ease-out ${activeOffset}`}
			>
				<span className="absolute inset-x-4 top-2 h-px bg-[linear-gradient(90deg,transparent,rgba(245,193,90,0.72),transparent)]" />
				<span className="absolute bottom-0 left-4 h-0.5 w-11 rounded-full bg-[#E4A11B] shadow-[0_0_16px_rgba(228,161,27,0.48)]" />
			</div>

			{PORTAL_ITEMS.map((item) => {
				const Icon = item.icon;
				const isActive = item.id === activePortal;

				return (
					<Link
						key={item.id}
						href={item.href}
						aria-current={isActive ? "page" : undefined}
						className={`group relative z-10 flex min-h-[4.55rem] flex-col justify-between rounded-[1rem] px-3.5 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.18em] transition duration-200 hover:-translate-y-0.5 sm:text-[11px] ${
							isActive
								? "text-[#F7C35E]"
								: "bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-[#2f4b72] shadow-[0_8px_16px_rgba(8,28,58,0.08)] hover:text-[#0d2b55] hover:shadow-[0_10px_18px_rgba(8,28,58,0.12)]"
						}`}
					>
						<div className="relative z-10 flex items-center justify-between gap-2">
							<div
								className={`flex size-7 shrink-0 items-center justify-center rounded-full transition duration-200 group-hover:scale-105 ${
									isActive
										? "bg-[#B7770D]/24 text-[#F5C15A] shadow-[0_0_0_5px_rgba(183,119,13,0.10)]"
										: "bg-[#edf4fb] text-[#48617f] group-hover:bg-[#e7f0fb] group-hover:text-[#1c3e6e]"
								}`}
							>
								<Icon className="size-3.5" />
							</div>
							<span
								className={`h-1.5 w-1.5 rounded-full ${
									isActive
										? "bg-[#E4A11B] shadow-[0_0_12px_rgba(228,161,27,0.65)]"
										: "bg-[#cfdbe9]"
								}`}
							/>
						</div>
						<div className="relative z-10 min-w-0">
							<span className="block leading-none">{item.label}</span>
							<span
								className={`mt-1.5 block truncate text-[8.5px] font-bold normal-case tracking-normal ${
									isActive ? "text-[#dce7f4]" : "text-[#7a8da8]"
								}`}
							>
								{item.eyebrow}
							</span>
						</div>
					</Link>
				);
			})}
		</div>
	);
}
