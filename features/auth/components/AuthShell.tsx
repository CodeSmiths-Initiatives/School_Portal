import type { AuthExperienceRailProps } from "./AuthExperienceRail";
import AuthExperienceRail from "./AuthExperienceRail";
import RegistrationHeader from "@/features/admission/components/RegistrationHeader";

type AuthShellProps = {
	title: string;
	subtitle: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
	rail: AuthExperienceRailProps;
};

export default function AuthShell({
	title,
	subtitle,
	children,
	footer,
	rail,
}: AuthShellProps) {
	return (
		<div className="flex min-h-dvh flex-col overflow-y-auto bg-[#edf3fb] lg:h-dvh lg:overflow-hidden">
			<RegistrationHeader />

			<main className="focus-stage flex flex-1 items-start justify-center px-4 py-6 sm:px-6 sm:py-8 lg:app-scrollbar lg:min-h-0 lg:overflow-y-auto lg:px-0 lg:py-0">
				<div className="grid w-full gap-5 lg:min-h-full lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-stretch lg:gap-0 xl:grid-cols-[24rem_minmax(0,1fr)]">
					<div className="hidden overflow-hidden lg:block">
						<AuthExperienceRail {...rail} />
					</div>

					<div className="flex w-full max-w-lg flex-col gap-4 sm:gap-5 lg:max-w-none lg:justify-center lg:px-8 lg:py-8 xl:px-10 xl:py-10">
						<div className="lg:hidden">
							<AuthExperienceRail {...rail} />
						</div>

				<section className="auth-surface-card w-full border-[#d8e2f0] px-5 py-6 shadow-2xl shadow-[#d4deed]/40 sm:px-7 sm:py-8 lg:mx-auto lg:max-w-2xl">
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
					</div>
				</div>
			</main>
		</div>
	);
}
