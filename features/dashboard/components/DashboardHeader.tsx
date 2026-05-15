"use client";

export default function DashboardHeader({ title }: { title: string }) {
	return (
		<header className="bg-[#0d1b3e] text-white">
			<div className="flex items-center justify-between px-10 py-5 border-b border-white/10">
				<div className="flex items-center gap-5">
					<div className="w-16 h-16 rounded-full border-2 border-[#c9952a] flex items-center justify-center bg-[#162550] shrink-0">
						<div className="w-10 h-10 rounded-full linear-gradient-to-br from-[#1e3a7e] to-[#0a1530]" />
					</div>
					<div>
						<h1 className="text-2xl font-bold tracking-tight">{title}</h1>
						<p className="text-[#c9952a] text-xs font-bold tracking-widest uppercase mt-0.5">
							Kwara State, Nigeria – Undergraduate Admission Portal
						</p>
					</div>
				</div>
				<div className="border-2 border-[#c9952a] rounded-xl px-6 py-2 text-center">
					<p className="text-[#c9952a] font-bold text-lg leading-tight">
						2026 / 2027
					</p>
					<p className="text-[#c9952a] text-xs font-bold tracking-widest uppercase">
						Session
					</p>
				</div>
			</div>
			<div className="h-1 bg-[#c9952a]" />
		</header>
	);
}
