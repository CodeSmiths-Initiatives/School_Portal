import RegistrationHeader from "@/features/admission/components/RegistrationHeader";

type AuthShellProps = {
	title: string;
	subtitle: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
};

export default function AuthShell({
	title,
	subtitle,
	children,
	footer,
}: AuthShellProps) {
	return (
		<div className="flex h-dvh flex-col overflow-hidden bg-[#edf3fb]">
			<RegistrationHeader />

			<main className="focus-stage app-scrollbar flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
				<section className="auth-surface-card w-full max-w-md border-[#d8e2f0] px-5 py-6 shadow-2xl shadow-[#d4deed]/40 sm:max-w-lg sm:px-7 sm:py-8">
						<div className="mb-7">
							<p className="text-xs font-bold uppercase tracking-[0.22em] text-[#B7770D]">
								Account Access
							</p>
							<h2 className="mt-2 text-xl font-bold tracking-tight text-[#0d1b3e] sm:text-2xl">
								{title}
							</h2>
							<p className="mt-2 text-sm font-medium leading-6 text-[#6f7f98]">
								{subtitle}
							</p>
						</div>

						{children}

						{footer && (
							<div className="mt-7 border-t border-[#e6edf6] pt-5 text-center text-sm text-[#6f7f98]">
								{footer}
							</div>
						)}
				</section>
			</main>
		</div>
	);
}
