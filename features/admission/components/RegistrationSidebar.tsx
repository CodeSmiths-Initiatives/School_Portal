"use client";

import { PortalEntrySwitch } from "@/features/auth/components";
import Link from "next/link";

// import { REGISTRATION_STEPS } from "@/features/auth";
export const REGISTRATION_STEPS: RegistrationStep[] = [
  { id: 1, label: "Create Account", description: "STEP #1" },
  { id: 2, label: "Select Programme", description: "STEP #2" },
  { id: 3, label: "Payment", description: "STEP #3" },
  { id: 4, label: "Confirmation", description: "STEP #4" },
];

export interface RegistrationStep {
  id: number;
  label: string;
  description: string;
}

interface RegistrationSidebarProps {
  currentStep: number;
  collegeName?: string;
  collegeCode?: string;
}

function RegistrationStepsList({
  currentStep,
  compact = false,
}: RegistrationSidebarProps & { compact?: boolean }) {
  return (
    <div
      className={`flex ${compact ? "gap-3 overflow-x-auto pb-1" : "flex-col gap-0"}`}
    >
      {REGISTRATION_STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;

        return (
          <div
            key={step.id}
            className={
              compact
                ? "min-w-[10.5rem] rounded-xl border border-[#d8e2f0] bg-white px-3 py-3"
                : "flex items-stretch gap-4"
            }
          >
            <div
              className={
                compact
                  ? "flex items-center gap-3"
                  : "flex flex-col items-center"
              }
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold z-10
                    ${
                      isActive
                        ? "bg-[#B7770D] text-black"
                        : isCompleted
                          ? "bg-[#B7770D]/40 text-[#B7770D]"
                          : compact
                            ? "border border-[#c8d8ec] bg-[#f6f9fd] text-[#4a5a7a]"
                            : "bg-transparent border-2 border-[#F2F3F4] text-[#F2F3F4]"
                    }`}
              >
                {step.id}
              </div>
              {!compact && index < REGISTRATION_STEPS.length - 1 && (
                <div className="my-1 w-px flex-1 bg-[#2a3a5a]" />
              )}
            </div>

            <div className={compact ? "min-w-0" : "pb-6"}>
              <p
                className={`text-[10px] font-semibold uppercase tracking-widest ${compact ? "text-[#8a9ab5]" : "text-[#808B96]"}`}
              >
                {step.description}
              </p>
              <p
                className={`mt-0.5 text-sm font-semibold ${
                  isActive
                    ? compact
                      ? "text-[#0d1b3e]"
                      : "text-[#F2F3F4]"
                    : compact
                      ? "text-[#4a5a7a]"
                      : "text-gray-300"
                }`}
              >
                {step.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MobileRegistrationSteps({
  currentStep,
  collegeName,
  collegeCode,
}: RegistrationSidebarProps) {
  return (
    <div className="lg:hidden">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[#B7770D] bg-[#B7770D]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#B7770D]">
          Admission Open 2025
        </span>
        {collegeName && (
          <span className="rounded-full border border-[#d8e2f0] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#35527d]">
            {collegeCode ? `${collegeCode} - ` : ""}
            {collegeName}
          </span>
        )}
      </div>
      <RegistrationStepsList currentStep={currentStep} compact />
    </div>
  );
}

export default function RegistrationSidebar({
  currentStep,
  collegeName,
  collegeCode,
}: RegistrationSidebarProps) {
  return (
    <aside className="app-scrollbar hidden h-full overflow-y-auto bg-[#0D2B55] px-7 py-8 lg:flex lg:flex-col xl:px-8 xl:py-10">
      {/* Badge */}
      <div className="mb-7">
        <span className="bg-[#B7770D]/20 border border-[#B7770D] text-[#B7770D] text-[10px] font-bold tracking-widest uppercase px-3 py-3 rounded-full">
          Admission Open 2025
        </span>
      </div>

      {/* Headline */}
      <div className="mb-8 max-w-xs">
        <h2 className="text-white text-3xl font-extrabold leading-tight xl:text-4xl">
          Begin <span className="text-[#B7770D]">Academic</span> Journey.
        </h2>
        <p className="mt-4 text-sm leading-snug text-[#808B96]">
          Create your applicant account and complete your registration in
          minutes.
        </p>
        {collegeName && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8ea1be]">
              Selected College
            </p>
            <p className="mt-1 text-sm font-bold leading-snug text-white">
              {collegeName}
            </p>
            {collegeCode && (
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B7770D]">
                {collegeCode}
              </p>
            )}
          </div>
        )}
        <div className="mt-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#8ea1be]">
            Portal Access
          </p>
          <PortalEntrySwitch activePortal="student" />
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-xs">
        <RegistrationStepsList currentStep={currentStep} />
      </div>
      <div className="mt-auto pt-10 flex flex-col gap-2 text-xs text-[#808B96]">
        {/* <p>
					Already have an account?{" "}
					<Link href="/signin" className="text-[#B7770D] font-semibold hover:underline">
						Sign in here
					</Link>
				</p> */}
        <p>
          Need help?{" "}
          <Link
            href="#"
            className="text-[#B7770D] font-semibold hover:underline"
          >
            Contact Admissions Office
          </Link>
        </p>
      </div>
    </aside>
  );
}
