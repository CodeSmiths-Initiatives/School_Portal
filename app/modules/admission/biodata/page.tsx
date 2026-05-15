import BioDataForm from "@/features/admission/biodata/BioDataForm";

export default function page() {
	return (
		<div className="min-h-screen flex flex-col bg-white">
			{/* Header */}
			<header className="bg-[#15295a] text-white">
				<div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
					<div className="flex items-center gap-7">
						<div className="w-22 h-22 rounded-full border-2 border-[#B7770D]  flex items-center justify-center bg-[#162550] shrink-0">
							<div className="rounded-full bg-linear-to-br from-[#1e4a8a] to-[#0a1428] opacity-80" />
						</div>
						<div>
							<h1 className="text-3xl font-semibold tracking-tight">
								Personal Bio Data
							</h1>
							<p className="text-[#B7770D]  text-lg font-bold tracking-wide uppercase mt-2">
								Kwara State, Nigeria – Undergraduate <br />
								Admission Portal
							</p>
						</div>
					</div>
					<div className="border-2 border-[#B7770D] rounded-full px-5 py-1.5 text-center">
						<p className="text-[#B7770D] font-bold text-base leading-tight">
							2026 / 2027
						</p>
						<p className="text-[#B7770D] text-[10px] font-bold tracking-widest uppercase">
							Session
						</p>
					</div>
				</div>
				<div className="h-1 bg-[#B7770D]" />
			</header>

			<main className="flex-1 flex justify-center px-6 py-8">
				<div className="w-full max-w-7xl">
					<BioDataForm />
				</div>
			</main>
		</div>
	);
}
