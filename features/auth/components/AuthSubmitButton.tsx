"use client";

type AuthSubmitButtonProps = {
	children: React.ReactNode;
	isSubmitting?: boolean;
};

export default function AuthSubmitButton({
	children,
	isSubmitting,
}: AuthSubmitButtonProps) {
	return (
		<button
			type="submit"
			disabled={isSubmitting}
			className="mt-1 flex w-full items-center justify-center rounded-lg bg-[#2E86C1] px-4 py-3.5 text-sm font-bold tracking-wide text-white shadow-sm shadow-[#2E86C1]/25 transition hover:bg-[#2d72aa] focus:outline-none focus:ring-2 focus:ring-[#2E86C1]/30 disabled:cursor-not-allowed disabled:opacity-60"
		>
			{isSubmitting ? "Please wait..." : children}
		</button>
	);
}
