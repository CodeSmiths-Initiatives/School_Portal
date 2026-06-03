"use client";

import { useAuthStore } from "@/lib/store";
import { logoutThroughSessionRoute } from "@/lib/services/session.service";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
	const router = useRouter();
	const clearSessionSnapshot = useAuthStore((state) => state.clearSessionSnapshot);

	async function handleLogout() {
		clearSessionSnapshot();
		await logoutThroughSessionRoute();
		router.push("/");
	}

	return (
		<button
			type="button"
			onClick={handleLogout}
			className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white px-4 py-2.5 text-sm font-semibold text-[#0D2B55] shadow-sm transition hover:bg-[#f7faff]"
		>
			<LogOut className="size-4 text-[#B7770D]" />
			<span>Logout</span>
		</button>
	);
}
