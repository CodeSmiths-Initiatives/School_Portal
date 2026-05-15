"use client";

import { TabKey } from "../types/dashboard.types";

const TABS: { key: TabKey; label: string; icon?: string }[] = [
	{ key: "dashboard", label: "Dashboard" },
	{ key: "application", label: "Application" },
	{ key: "transfer", label: "Transfer", icon: "⇅" },
	{ key: "cutoff", label: "Cut - off Manager" },
	{ key: "result", label: "Result" },
];

interface NavBarProps {
	active: TabKey;
	onChange: (tab: TabKey) => void;
}

export default function NavBar({ active, onChange }: NavBarProps) {
	return (
		<div className="bg-[#dde8f5] rounded-xl p-1.5 flex gap-1 w-fit">
			{TABS.map((tab) => (
				<button
					key={tab.key}
					onClick={() => onChange(tab.key)}
					className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150
            ${
							active === tab.key
								? "bg-white text-[#0d1b3e] shadow-sm"
								: "text-[#3d5a9e] hover:text-[#0d1b3e]"
						}`}
				>
					{tab.icon && (
						<span
							className={`text-base ${active === tab.key ? "text-[#3d5a9e]" : "text-[#3d5a9e]"}`}
						>
							{tab.icon}
						</span>
					)}
					{tab.label}
				</button>
			))}
		</div>
	);
}
