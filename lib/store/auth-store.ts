"use client";

import type { AuthSession } from "@/lib/auth/accounts";
import { AUTH_SESSION_STORAGE_KEY } from "@/lib/auth/session";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AuthStore = {
	session: AuthSession | null;
	setSession: (session: AuthSession) => void;
	setSessionSnapshot: (session: AuthSession) => void;
	clearSession: () => void;
	clearSessionSnapshot: () => void;
};

export const useAuthStore = create<AuthStore>()(
	persist(
		(set) => ({
			session: null,
			setSession: (session) => {
				set({ session });
			},
			setSessionSnapshot: (session) => {
				set({ session });
			},
			clearSession: () => {
				set({ session: null });
			},
			clearSessionSnapshot: () => {
				set({ session: null });
			},
		}),
		{
			name: AUTH_SESSION_STORAGE_KEY,
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({ session: state.session }),
		},
	),
);
