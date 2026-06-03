import { ArrowRight, type LucideIcon } from "lucide-react";

type StudentModulePlaceholderProps = {
	badge: string;
	title: string;
	description: string;
	icon: LucideIcon;
	items: string[];
};

export default function StudentModulePlaceholder({
	badge,
	title,
	description,
	icon: Icon,
	items,
}: StudentModulePlaceholderProps) {
	return (
		<div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
						{badge}
					</p>
					<h2 className="mt-2 text-xl font-bold text-[#0D2B55]">{title}</h2>
					<p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#60728f]">
						{description}
					</p>
				</div>
				<div className="flex size-12 items-center justify-center rounded-2xl bg-[#eef4fb] text-[#2E86C1]">
					<Icon className="size-5" />
				</div>
			</div>

			<div className="mt-5 grid gap-3 md:grid-cols-2">
				{items.map((item) => (
					<div
						key={item}
						className="flex items-center justify-between gap-3 rounded-xl border border-[#e3eaf4] bg-[#fbfdff] px-4 py-3"
					>
						<p className="text-sm font-semibold text-[#17305f]">{item}</p>
						<ArrowRight className="size-4 text-[#B7770D]" />
					</div>
				))}
			</div>
		</div>
	);
}
