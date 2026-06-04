"use client";

import { useState } from "react";
import { TIMETABLE, DAYS } from "../utils/data";
import { Level } from "../types/course.types";
import { Button } from "@/components/ui/button";

// ─── Time slots shown as row headers ─────────────────────────────────────────
const TIME_SLOTS = [
	"8:00-10:00",
	"10:00-12:00",
	"12:00-14:00",
	"14:00-16:00",
	"16:00-18:00",
];

// Display label with space before dash (matches screenshot "8:00 10:00")
function formatTime(slot: string) {
	return slot.replace("-", " ");
}

// ─── Card color per mode ──────────────────────────────────────────────────────
const MODE_CARD: Record<
	string,
	{ bg: string; code: string; title: string; venue: string; dot: string }
> = {
	"On-Site": {
		bg: "bg-[#e8f8f4] border border-[#b2e4d8]",
		code: "text-[#0d7f63] font-bold text-xs",
		title: "text-[#0d7f63] text-xs",
		venue: "text-[#e05252]",
		dot: "bg-[#e05252]",
	},
	Online: {
		bg: "bg-[#e8eef8] border border-[#b2c4e8]",
		code: "text-[#2d4e9e] font-bold text-xs",
		title: "text-[#2d4e9e] text-xs",
		venue: "text-[#2d7fd4]",
		dot: "bg-[#2d7fd4]",
	},
	Hybrid: {
		bg: "bg-[#f3eef8] border border-[#d0b8e8]",
		code: "text-[#6b2da0] font-bold text-xs",
		title: "text-[#6b2da0] text-xs",
		venue: "text-[#8b4fc8]",
		dot: "bg-[#8b4fc8]",
	},
};

const LEVELS: Level[] = ["100L", "200L", "300L", "400L"];

// ─── Add Slot modal ───────────────────────────────────────────────────────────
interface SlotForm {
	code: string;
	title: string;
	day: string;
	time: string;
	room: string;
	mode: string;
	level: Level;
}

function AddSlotModal({
	onAdd,
	onClose,
}: {
	onAdd: (slot: SlotForm) => void;
	onClose: () => void;
}) {
	const [form, setForm] = useState<SlotForm>({
		code: "",
		title: "",
		day: "Monday",
		time: "8:00-10:00",
		room: "",
		mode: "On-Site",
		level: "200L",
	});

	const sel = `w-full border border-[#dce6f2] rounded-xl px-3 py-2.5 text-sm text-[#1a2b52]
		bg-white outline-none focus:border-[#3d5a9e] appearance-none`;
	const inp = `w-full border border-[#dce6f2] rounded-xl px-3 py-2.5 text-sm text-[#1a2b52]
		bg-white placeholder:text-[#b0bcd4] outline-none focus:border-[#3d5a9e]`;

	function F({
		label,
		children,
	}: {
		label: string;
		children: React.ReactNode;
	}) {
		return (
			<div className="flex flex-col gap-1">
				<label className="text-[10px] font-bold tracking-widest text-[#4a5a7a] uppercase">
					{label}
				</label>
				{children}
			</div>
		);
	}

	return (
		<div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
			<div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7">
				<div className="flex items-center justify-between mb-5">
					<h3 className="text-base font-bold text-[#1a2b52]">
						Add Timetable Slot
					</h3>
					<button
						onClick={onClose}
						className="w-8 h-8 rounded-lg border border-[#dce6f2] flex items-center justify-center text-[#8a9ab5] hover:text-[#1a2b52] text-sm"
					>
						✕
					</button>
				</div>

				<div className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-3">
						<F label="Course Code">
							<input
								className={inp}
								placeholder="e.g. CSC301"
								value={form.code}
								onChange={(e) =>
									setForm((p) => ({ ...p, code: e.target.value }))
								}
							/>
						</F>
						<F label="Course Title">
							<input
								className={inp}
								placeholder="e.g. Software Eng."
								value={form.title}
								onChange={(e) =>
									setForm((p) => ({ ...p, title: e.target.value }))
								}
							/>
						</F>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<F label="Day">
							<div className="relative">
								<select
									className={sel}
									value={form.day}
									onChange={(e) =>
										setForm((p) => ({ ...p, day: e.target.value }))
									}
								>
									{DAYS.map((d) => (
										<option key={d} value={d}>
											{d}
										</option>
									))}
								</select>
								<span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a9ab5] pointer-events-none text-xs">
									▾
								</span>
							</div>
						</F>
						<F label="Time Slot">
							<div className="relative">
								<select
									className={sel}
									value={form.time}
									onChange={(e) =>
										setForm((p) => ({ ...p, time: e.target.value }))
									}
								>
									{TIME_SLOTS.map((t) => (
										<option key={t} value={t}>
											{t}
										</option>
									))}
								</select>
								<span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a9ab5] pointer-events-none text-xs">
									▾
								</span>
							</div>
						</F>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<F label="Mode">
							<div className="relative">
								<select
									className={sel}
									value={form.mode}
									onChange={(e) =>
										setForm((p) => ({ ...p, mode: e.target.value }))
									}
								>
									{["On-Site", "Online", "Hybrid"].map((m) => (
										<option key={m} value={m}>
											{m}
										</option>
									))}
								</select>
								<span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a9ab5] pointer-events-none text-xs">
									▾
								</span>
							</div>
						</F>
						<F label="Level">
							<div className="relative">
								<select
									className={sel}
									value={form.level}
									onChange={(e) =>
										setForm((p) => ({ ...p, level: e.target.value as Level }))
									}
								>
									{LEVELS.map((l) => (
										<option key={l} value={l}>
											{l}
										</option>
									))}
								</select>
								<span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a9ab5] pointer-events-none text-xs">
									▾
								</span>
							</div>
						</F>
					</div>
					<F label="Venue / Room">
						<input
							className={inp}
							placeholder="e.g. LT2, Block A"
							value={form.room}
							onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))}
						/>
					</F>

					<div className="flex gap-3 pt-1">
						<button
							disabled={!form.code.trim() || !form.title.trim()}
							onClick={() => {
								onAdd(form);
								onClose();
							}}
							className="flex-1 py-3 rounded-xl bg-[#3d5a9e] hover:bg-[#2d4a8e]
								disabled:opacity-40 text-white text-sm font-bold transition-all"
						>
							Add Slot
						</button>
						<button
							onClick={onClose}
							className="flex-1 py-3 rounded-xl border-2 border-[#dce6f2] text-[#4a5a7a] text-sm font-semibold hover:border-[#8a9ab5] transition-colors"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Timetable({
	canManageTimetable = true,
}: {
	canManageTimetable?: boolean;
}) {
	// Normalise TIMETABLE entries into a lookup: day → time → entries[]
	type TEntry = {
		code: string;
		course: string;
		room: string;
		level: Level;
		mode: string;
		day: string;
		time: string;
	};

	const [slots, setSlots] = useState<TEntry[]>(() =>
		TIMETABLE.map((t) => ({
			code: t.code,
			course: t.course,
			room: t.room,
			level: t.level as Level,
			mode: t.room.toLowerCase() === "online" ? "Online" : "On-Site",
			day: t.day,
			// normalise time format to match TIME_SLOTS keys
			time: t.time.replace(/\s/g, "").replace("–", "-").replace("—", "-"),
		})),
	);

	const [levelFilter, setLevelFilter] = useState<Level | "All Levels">(
		"All Levels",
	);
	const [showModal, setShowModal] = useState(false);

	function addSlot(form: {
		code: string;
		title: string;
		day: string;
		time: string;
		room: string;
		mode: string;
		level: Level;
	}) {
		setSlots((prev) => [
			...prev,
			{
				code: form.code,
				course: form.title,
				room: form.room,
				level: form.level,
				mode: form.mode,
				day: form.day,
				time: form.time,
			},
		]);
	}

	// Get entries for a specific cell
	function getCell(day: string, timeSlot: string): TEntry[] {
		return slots.filter((s) => {
			const dayMatch = s.day === day;
			// loose time match — compare normalised
			const norm = (v: string) => v.replace(/\s/g, "");
			const timeMatch = norm(s.time) === norm(timeSlot);
			const levelMatch =
				levelFilter === "All Levels" || s.level === levelFilter;
			return dayMatch && timeMatch && levelMatch;
		});
	}

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="text-2xl text-black font-semibold mb-1">
						Weekly Timetable
					</h2>
					<p className="text-xs text-[#8a9ab5]">
						Dept. of Computer Science · 2025/2026
					</p>
				</div>
				<div>
					<Button className="border border-[#dce6f2] rounded-full px-4 py-1.5 text-xs font-bold text-[#4a5a7a] bg-white mt-1">
						2025/2026
					</Button>
				</div>
			</div>
			{/* Page heading */}
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold text-[#1a2b52] mt-1">
						Weekly Timetable
					</h1>
					<p className="text-xs text-[#8a9ab5] mt-0.5">
						Course schedule grid — Approved courses only
					</p>
				</div>
			</div>

			{/* Controls row: legend + level filter + add slot */}
			<div className="flex items-center justify-between flex-wrap gap-3">
				{/* Legend */}
				<div className="flex items-center gap-3">
					<span className="flex items-center gap-1.5 text-xs font-semibold text-[#0d7f63] bg-[#e8f8f4] border border-[#b2e4d8] px-3 py-1.5 rounded-full">
						<span className="w-2 h-2 rounded-full bg-[#0d7f63]" />
						On-Site Class
					</span>
					<span className="flex items-center gap-1.5 text-xs font-semibold text-[#2d4e9e] bg-[#e8eef8] border border-[#b2c4e8] px-3 py-1.5 rounded-full">
						<span className="w-2 h-2 rounded-full bg-[#2d4e9e]" />
						Online Class
					</span>
				</div>

				{/* Right: filter + button */}
				<div className="flex items-center gap-3">
					<div className="relative">
						<select
							value={levelFilter}
							onChange={(e) =>
								setLevelFilter(e.target.value as Level | "All Levels")
							}
							className="border border-[#dce6f2] rounded-xl px-4 py-2.5 text-sm text-[#1a2b52]
								bg-white outline-none focus:border-[#3d5a9e] appearance-none pr-8 cursor-pointer"
						>
							<option value="All Levels">All Levels</option>
							{LEVELS.map((l) => (
								<option key={l} value={l}>
									{l}
								</option>
							))}
						</select>
						<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9ab5] pointer-events-none text-xs">
							▾
						</span>
					</div>
					{canManageTimetable ? (
						<button
							onClick={() => setShowModal(true)}
							className="flex items-center gap-1.5 bg-[#0D2B55] hover:bg-[#092244] text-white
								text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-[#0D2B55]/20"
						>
							+ Add Slot
						</button>
					) : null}
				</div>
			</div>

			{/* ── Calendar grid ── */}
			<div className="overflow-x-auto rounded-2xl border border-[#e4eaf4] bg-white shadow-sm">
				{/* Column headers */}
				<div className="grid min-w-[920px] grid-cols-[90px_1fr_1fr_1fr_1fr_1fr]">
					{/* Time header */}
					<div className="bg-[#0d1b3e] px-4 py-3.5 flex items-center justify-center border-r border-white/10">
						<span className="text-xs font-bold text-white/70 uppercase tracking-widest">
							Time
						</span>
					</div>
					{/* Day headers */}
					{DAYS.map((day) => (
						<div
							key={day}
							className="bg-[#0d1b3e] px-4 py-3.5 text-center border-r border-white/10 last:border-0"
						>
							<span className="text-sm font-bold text-white">{day}</span>
						</div>
					))}
				</div>

				{/* Time rows */}
				{TIME_SLOTS.map((slot, rowIdx) => (
					<div
						key={slot}
						className={`grid min-w-[920px] grid-cols-[90px_1fr_1fr_1fr_1fr_1fr] border-t border-[#eef3fb]
							${rowIdx % 2 === 0 ? "bg-white" : "bg-[#fafbff]"}`}
						style={{ minHeight: "80px" }}
					>
						{/* Time label */}
						<div className="px-3 py-3 flex items-start justify-center border-r border-[#eef3fb]">
							<span className="text-xs font-semibold text-[#8a9ab5] text-center leading-tight">
								{formatTime(slot)}
							</span>
						</div>

						{/* Day cells */}
						{DAYS.map((day) => {
							const entries = getCell(day, slot);
							return (
								<div
									key={day}
									className="px-2 py-2 border-r border-[#eef3fb] last:border-0 flex flex-col gap-1.5 min-h-[80px]"
								>
									{entries.map((entry, i) => {
										const style = MODE_CARD[entry.mode] ?? MODE_CARD["On-Site"];
										const isOnline = entry.mode === "Online";
										return (
											<div
												key={i}
												className={`${style.bg} rounded-xl px-3 py-2.5 flex flex-col gap-1`}
											>
												<span className={style.code}>{entry.code}</span>
												<span className={style.title}>{entry.course}</span>
												<div className="flex items-center gap-1 mt-0.5">
													{isOnline ? (
														<span
															className={`text-[10px] ${style.venue} flex items-center gap-1`}
														>
															<span>🌐</span> Online
														</span>
													) : (
														<span
															className={`text-[10px] ${style.venue} flex items-center gap-1`}
														>
															<span
																className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`}
															/>
															{entry.room}
														</span>
													)}
												</div>
											</div>
										);
									})}
								</div>
							);
						})}
					</div>
				))}
			</div>

			{/* Add Slot modal */}
			{showModal && (
				<AddSlotModal onAdd={addSlot} onClose={() => setShowModal(false)} />
			)}
		</div>
	);
}
