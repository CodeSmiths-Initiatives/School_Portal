"use client";

import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export type ToastMessage = {
	id: string;
	variant: ToastVariant;
	title: string;
	description?: string;
	duration: number;
};

type ToastInput =
	| string
	| {
			title: string;
			description?: string;
			duration?: number;
	  };

type ToastState = {
	toasts: ToastMessage[];
	show: (variant: ToastVariant, input: ToastInput) => string;
	dismiss: (id: string) => void;
	clear: () => void;
};

const DEFAULT_DURATION = 2200;
let toastId = 0;

function normalizeToastInput(input: ToastInput) {
	if (typeof input === "string") {
		return {
			title: input,
			duration: DEFAULT_DURATION,
		};
	}

	return {
		...input,
		duration: input.duration ?? DEFAULT_DURATION,
	};
}

export const useToastStore = create<ToastState>((set) => ({
	toasts: [],
	show: (variant, input) => {
		const id = `toast-${Date.now()}-${toastId++}`;
		const normalizedInput = normalizeToastInput(input);

		set((state) => ({
			toasts: [
				{
					id,
					variant,
					title: normalizedInput.title,
					description: normalizedInput.description,
					duration: normalizedInput.duration,
				},
				...state.toasts,
			].slice(0, 4),
		}));

		return id;
	},
	dismiss: (id) =>
		set((state) => ({
			toasts: state.toasts.filter((toast) => toast.id !== id),
		})),
	clear: () => set({ toasts: [] }),
}));

export const toast = {
	success(input: ToastInput) {
		return useToastStore.getState().show("success", input);
	},
	error(input: ToastInput) {
		return useToastStore.getState().show("error", input);
	},
	info(input: ToastInput) {
		return useToastStore.getState().show("info", input);
	},
	dismiss(id: string) {
		useToastStore.getState().dismiss(id);
	},
	clear() {
		useToastStore.getState().clear();
	},
};
