"use client";

import { ArrowLeftRight } from "lucide-react";
import { TabKey } from "../types/dashboard.types";

const TABS: { key: TabKey; label: string; showTransferIcon?: boolean }[] = [
	{ key: "dashboard", label: "Dashboard" },
	{ key: "application", label: "Application" },
	{ key: "transfer", label: "Transfer", showTransferIcon: true },
	{ key: "cutoff", label: "Cutoff Manager" },
	{ key: "result", label: "Result" },
];

interface NavBarProps {
	active: TabKey;
	onChange: (tab: TabKey) => void;
}

export default function NavBar({ active, onChange }: NavBarProps) {
	return (
		<div className="flex w-fit flex-wrap gap-1 rounded-xl bg-[#dde8f5] p-1.5">
			{TABS.map((tab) => (
				<button
					key={tab.key}
					onClick={() => onChange(tab.key)}
					className={`flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-150 ${
						active === tab.key
							? "bg-white text-[#0d1b3e] shadow-sm"
							: "text-[#3d5a9e] hover:text-[#0d1b3e]"
					}`}
				>
					{tab.showTransferIcon ? (
						<ArrowLeftRight className="size-4 text-[#3d5a9e]" />
					) : null}
					{tab.label}
				</button>
			))}
		</div>
	);
}
