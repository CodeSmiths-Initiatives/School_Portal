import React from "react";

export default function RegistrationHeader() {
	return (
		<header className="shrink-0 bg-[#0D2B55] border-b-10 border-[#B7770D]">
			<div className="flex w-full flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-8 lg:py-5 xl:px-10 2xl:px-12">
				<div className="flex items-center gap-3 sm:gap-5 lg:gap-9">
					<div className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-[#B7770D] bg-linear-to-br from-[#1a3a6b] to-[#0d1b3e] sm:size-18 lg:size-[7.5rem]">
						<div className="rounded-full bg-linear-to-br from-[#0D2B55] to-[#0a1428] opacity-80" />
					</div>
					<div className="min-w-0">
						<h1 className="text-xl font-bold leading-none tracking-tight text-white sm:text-3xl">
							REGISTRATION
						</h1>
						<h3 className="mt-1.5 text-xs font-semibold leading-tight tracking-wide text-[#B7770D] sm:mt-2 sm:text-base lg:text-lg">
							KWARA STATE, NIGERIA &ndash; UNDERGRADUATE <br className="hidden sm:block" />
							ADMISSION PORTAL
						</h3>
					</div>
				</div>
				<div className="hidden w-fit self-start rounded-full border-2 border-[#B7770D] bg-[#B7770D]/20 px-4 py-2 text-center sm:px-6 lg:block lg:self-auto">
					<p className="text-xs font-bold leading-tight tracking-wider text-[#B7770D] sm:text-sm">
						2026/&nbsp;2027
					</p>
					<p className="text-xs font-bold uppercase tracking-widest text-[#B7770D] sm:text-sm">
						Session
					</p>
				</div>
			</div>
		</header>
	);
}
