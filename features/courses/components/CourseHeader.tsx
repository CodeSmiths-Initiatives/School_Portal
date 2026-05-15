import React from "react";

export default function CourseHeader() {
	return (
		<header className="bg-[#0D2B55] border-b-10 border-[#B7770D]">
			{/* ── Top portal header ── */}
			<div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
				<div className="flex items-center gap-9">
					<div className="w-30 h-30 rounded-full border-2 border-[#B7770D] flex items-center justify-between shrink-0 bg-linear-to-br from-[#1a3a6b] to-[#0d1b3e]">
						<div className="rounded-full bg-linear-to-br from-[#0D2B55] to-[#0a1428] opacity-80"></div>
					</div>
					<div>
						<h3 className="text-white text-3xl font-bold tracking-tight leading-none">
							Standard University In Ilorin
						</h3>
						<p className="text-[#B7770D] text-lg font-semibold tracking-wide uppercase leading-tight mt-2">
							Academic portal - course registration
						</p>
					</div>
				</div>
				<div className="border-2 border-[#B7770D] bg-[#B7770D]/20 rounded-full px-6 py-2 text-center">
					<p className=" text-[#B7770D] text-sm font-bold tracking-wider leading-tight">
						2026/&nbsp;2027
					</p>
					<p className="text-[#B7770D] text-sm font-bold tracking-widest uppercase">
						Session
					</p>
				</div>
			</div>
		</header>
	);
}
