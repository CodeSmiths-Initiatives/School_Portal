"use client";

const NETWORKS = [
	{ id: "737", label: "GTBank *737#", bank: "GTBank" },
	{ id: "894", label: "Access Bank *894#", bank: "Access Bank" },
	{ id: "822", label: "Sterling Bank *822#", bank: "Sterling Bank" },
	{ id: "966", label: "Zenith Bank *966#", bank: "Zenith Bank" },
];

interface UssdFieldsProps {
	network: string;
	error?: string;
	onChange: (network: string) => void;
	amount: number;
}

export default function UssdFields({
	network,
	error,
	onChange,
	amount,
}: UssdFieldsProps) {
	const selected = NETWORKS.find((n) => n.id === network);

	return (
		<div className="flex flex-col gap-4">
			<div>
				<label className="text-[11px] font-bold tracking-widest text-[#2d3f6b] uppercase mb-2 block">
					Select Your Bank
				</label>
				<div className="grid grid-cols-2 gap-3">
					{NETWORKS.map((net) => (
						<button
							key={net.id}
							type="button"
							onClick={() => onChange(net.id)}
							className={`text-left px-4 py-3 rounded-xl border-2 transition-all text-sm
                ${
									network === net.id
										? "border-[#3d5a9e] bg-white shadow-sm text-[#1a2b52] font-semibold"
										: "border-[#c8d8ec] bg-[#f0f5fb] text-[#6b7e9f] hover:border-[#9ab0cc]"
								}`}
						>
							<p className="font-bold text-xs mb-0.5">{net.bank}</p>
							<p className="text-[11px] font-mono">
								{net.label.split(" ").at(-1)}
							</p>
						</button>
					))}
				</div>
				{error && (
					<p className="text-[11px] text-red-500 font-medium mt-1">{error}</p>
				)}
			</div>

			{selected && (
				<div className="bg-[#f0f5fb] border border-[#c8d8ec] rounded-xl px-5 py-4">
					<p className="text-xs text-[#6b7e9f] mb-2">
						Dial the code below on your phone:
					</p>
					<p className="font-mono text-lg font-bold text-[#1a2b52] tracking-widest">
						*{selected.id}*Amount*Reference#
					</p>
					<p className="text-[11px] text-[#8a9ab5] mt-1">
						Replace <span className="font-bold">Amount</span> with ₦
						{amount.toLocaleString("en-NG")} and{" "}
						<span className="font-bold">Reference</span> with your application
						reference number.
					</p>
				</div>
			)}

			<div className="flex items-center justify-center gap-2 text-[11px] text-[#808B96]">
				<span>🔒</span>
				<span>
					Secured with 256-bit SSL encryption. Your card details are protected.
				</span>
			</div>
		</div>
	);
}
