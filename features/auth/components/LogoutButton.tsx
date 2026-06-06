"use client";

import { useAuthStore } from "@/lib/store";
import { LogOut } from "lucide-react";
import { useState } from "react";

export default function LogoutButton() {
	const clearSessionSnapshot = useAuthStore((state) => state.clearSessionSnapshot);
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	function handleLogout() {
		if (isLoggingOut) {
			return;
		}

		setIsLoggingOut(true);
		clearSessionSnapshot();
	}

	return (
		<form action="/api/auth/logout?next=/" method="post" onSubmit={handleLogout}>
			<button
				type="submit"
				disabled={isLoggingOut}
				className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white px-4 py-2.5 text-sm font-semibold text-[#0D2B55] shadow-sm transition hover:bg-[#f7faff] disabled:cursor-not-allowed disabled:opacity-70"
			>
				<LogOut className="size-4 text-[#B7770D]" />
				<span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
			</button>
		</form>
	);
}
