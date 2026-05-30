import PortalEntrySwitch from "./PortalEntrySwitch";

type RailItem = {
	label: string;
	value: string;
};

export type AuthExperienceRailProps = {
	badge: string;
	titleStart: string;
	titleAccent: string;
	titleEnd?: string;
	description: string;
	activePortal: "student" | "staff";
	items: RailItem[];
};

export default function AuthExperienceRail({
	badge,
	titleStart,
	titleAccent,
	titleEnd,
	description,
	activePortal,
	items,
}: AuthExperienceRailProps) {
	return (
		<div className="rounded-3xl bg-[#0D2B55] px-5 py-6 text-white shadow-xl shadow-[#0d2b55]/20 sm:px-6 sm:py-7 lg:h-full lg:min-h-[34rem] lg:rounded-none lg:px-7 lg:py-8 xl:px-8 xl:py-10">
			<div className="mb-6">
				<span className="rounded-full border border-[#B7770D] bg-[#B7770D]/14 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#E4A11B]">
					{badge}
				</span>
			</div>

			<div className="max-w-xs">
				<h2 className="text-3xl font-extrabold leading-tight xl:text-4xl">
					{titleStart} <span className="text-[#B7770D]">{titleAccent}</span>
					{titleEnd ? ` ${titleEnd}` : ""}
				</h2>
				<p className="mt-4 text-sm leading-relaxed text-[#94A7C3]">
					{description}
				</p>
				<div className="mt-5">
					<p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#8ea1be]">
						Portal Access
					</p>
					<PortalEntrySwitch activePortal={activePortal} />
				</div>
			</div>

			<div className="mt-8 space-y-5">
				{items.map((item, index) => (
					<div key={`${item.label}-${index}`} className="flex items-start gap-4">
						<div className="flex flex-col items-center">
							<div
								className={`flex size-9 items-center justify-center rounded-full text-sm font-bold ${
									index === 0
										? "bg-[#B7770D] text-[#0D2B55]"
										: "border-2 border-white text-white"
								}`}
							>
								{index + 1}
							</div>
							{index < items.length - 1 && (
								<div className="mt-1 h-8 w-px bg-[#2a3a5a]" />
							)}
						</div>
						<div className="pt-1">
							<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8092AE]">
								{item.label}
							</p>
							<p className="mt-1 text-base font-semibold text-white">
								{item.value}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
