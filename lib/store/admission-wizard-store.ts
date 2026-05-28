"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AdmissionStep = 1 | 2 | 3 | 4 | 5;

type AdmissionWizardState = {
	currentStep: AdmissionStep;
	draft: Record<string, unknown>;
	setStep: (step: AdmissionStep) => void;
	nextStep: () => void;
	previousStep: () => void;
	mergeDraft: (values: Record<string, unknown>) => void;
	resetWizard: () => void;
};

const FIRST_STEP: AdmissionStep = 1;
const LAST_STEP: AdmissionStep = 5;

export const useAdmissionWizardStore = create<AdmissionWizardState>()(
	persist(
		(set) => ({
			currentStep: FIRST_STEP,
			draft: {},
			setStep: (step) => set({ currentStep: step }),
			nextStep: () =>
				set((state) => ({
					currentStep: Math.min(state.currentStep + 1, LAST_STEP) as AdmissionStep,
				})),
			previousStep: () =>
				set((state) => ({
					currentStep: Math.max(state.currentStep - 1, FIRST_STEP) as AdmissionStep,
				})),
			mergeDraft: (values) =>
				set((state) => ({ draft: { ...state.draft, ...values } })),
			resetWizard: () => set({ currentStep: FIRST_STEP, draft: {} }),
		}),
		{
			name: "school-portal-admission-wizard",
			storage: createJSONStorage(() => sessionStorage),
			partialize: (state) => ({
				currentStep: state.currentStep,
				draft: state.draft,
			}),
		},
	),
);
