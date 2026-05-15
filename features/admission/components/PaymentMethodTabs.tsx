"use client";

import { CreditCard, Building2, Hash } from "lucide-react";
import { PaymentMethod } from "../types/payment.types";

interface Tab {
	id: PaymentMethod;
	label: string;
	icon: React.ReactNode;
}

const TABS: Tab[] = [
	{ id: "card", label: "Card", icon: <CreditCard size={22} /> },
	{
		id: "bank_transfer",
		label: "Bank Transfer",
		icon: <Building2 size={22} />,
	},
	{ id: "ussd", label: "USSD", icon: <Hash size={22} /> },
];

interface PaymentMethodTabsProps {
	active: PaymentMethod;
	onChange: (method: PaymentMethod) => void;
}

export default function PaymentMethodTabs({
	active,
	onChange,
}: PaymentMethodTabsProps) {
	return (
		<div className="grid grid-cols-3 gap-3 mb-6">
			{TABS.map((tab) => {
				const isActive = tab.id === active;
				return (
					<button
						key={tab.id}
						type="button"
						onClick={() => onChange(tab.id)}
						className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all duration-200
              ${
								isActive
									? "border-[#3d5a9e] bg-white shadow-md shadow-[#3d5a9e]/10"
									: "border-[#c8d8ec] bg-[#f8fafc] hover:border-[#9ab0cc] hover:bg-white"
							}`}
					>
						<span className={isActive ? "text-[#3d5a9e]" : "text-[#8a9ab5]"}>
							{tab.icon}
						</span>
						<span
							className={`text-xs font-semibold ${isActive ? "text-[#1a2b52]" : "text-[#8a9ab5]"}`}
						>
							{tab.label}
						</span>
					</button>
				);
			})}
		</div>
	);
}
