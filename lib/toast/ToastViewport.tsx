"use client";

import {
	useToastStore,
	type ToastMessage,
	type ToastVariant,
} from "./toast-store";
import {
	AlertCircle,
	CheckCircle2,
	Info,
	X,
	type LucideIcon,
} from "lucide-react";
import { useEffect } from "react";

const toastStyles: Record<
	ToastVariant,
	{
		icon: LucideIcon;
		iconClassName: string;
		accentClassName: string;
		progressClassName: string;
	}
> = {
	success: {
		icon: CheckCircle2,
		iconClassName: "bg-emerald-50 text-emerald-600 ring-emerald-100",
		accentClassName: "bg-emerald-500",
		progressClassName: "bg-emerald-500",
	},
	error: {
		icon: AlertCircle,
		iconClassName: "bg-red-50 text-red-600 ring-red-100",
		accentClassName: "bg-red-500",
		progressClassName: "bg-red-500",
	},
	info: {
		icon: Info,
		iconClassName: "bg-orange-50 text-orange-600 ring-orange-100",
		accentClassName: "bg-orange-500",
		progressClassName: "bg-orange-500",
	},
};

function ToastCard({ toast }: { toast: ToastMessage }) {
	const dismiss = useToastStore((state) => state.dismiss);
	const style = toastStyles[toast.variant];
	const Icon = style.icon;

	useEffect(() => {
		const timeoutId = window.setTimeout(() => dismiss(toast.id), toast.duration);

		return () => window.clearTimeout(timeoutId);
	}, [dismiss, toast.duration, toast.id]);

	return (
		<div className="group pointer-events-auto relative overflow-hidden rounded-lg border border-[#d7e3f1] bg-white/95 p-4 pr-11 text-[#071739] shadow-[0_18px_45px_rgba(13,50,104,0.16)] ring-1 ring-white/75 backdrop-blur-sm animate-in fade-in slide-in-from-right-4 duration-300">
			<div
				className={`absolute left-0 top-0 h-full w-1 ${style.accentClassName}`}
				aria-hidden="true"
			/>
			<div className="flex gap-3">
				<div
					className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ${style.iconClassName}`}
				>
					<Icon className="h-4 w-4" aria-hidden="true" />
				</div>
				<div className="min-w-0">
					<p className="text-sm font-black leading-5">{toast.title}</p>
					{toast.description && (
						<p className="mt-1 text-xs font-medium leading-5 text-[#526987]">
							{toast.description}
						</p>
					)}
				</div>
			</div>
			<button
				type="button"
				onClick={() => dismiss(toast.id)}
				className="absolute right-3 top-3 rounded-full p-1 text-[#7d8ca4] transition hover:bg-[#eef4fb] hover:text-[#0d3268]"
				aria-label="Close notification"
			>
				<X className="h-4 w-4" aria-hidden="true" />
			</button>
			<div className="absolute bottom-0 left-0 h-1 w-full bg-[#edf3fa]">
				<div
					className={`h-full origin-left animate-[toast-progress_linear_forwards] ${style.progressClassName}`}
					style={{ animationDuration: `${toast.duration}ms` }}
					aria-hidden="true"
				/>
			</div>
		</div>
	);
}

export default function ToastViewport() {
	const toasts = useToastStore((state) => state.toasts);

	return (
		<div
			className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3"
			aria-live="polite"
			aria-relevant="additions text"
		>
			{toasts.map((toast) => (
				<ToastCard key={toast.id} toast={toast} />
			))}
		</div>
	);
}
