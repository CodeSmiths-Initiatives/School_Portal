"use client";

import {
	ArrowRight,
	BedDouble,
	Building2,
	CalendarDays,
	CheckCircle2,
	CircleDollarSign,
	CreditCard,
	DoorOpen,
	Edit3,
	Eye,
	Home,
	Menu,
	PanelLeftClose,
	PanelLeftOpen,
	Plus,
	ReceiptText,
	Search,
	Settings,
	ShieldCheck,
	Users,
	Wrench,
} from "lucide-react";
import { useMemo, useState, type ElementType, type ReactNode } from "react";
import {
	hasPermissions,
	type PermissionKey,
	type UserPermissionKey,
} from "@/lib/rbac";

type HostelModuleWorkspaceProps = {
	permissions: UserPermissionKey[];
	collegeName: string;
};

type HostelStatus = "available" | "filling" | "full";
type HostelView =
	| "dashboard"
	| "browse"
	| "details"
	| "booking"
	| "allocation"
	| "payment"
	| "maintenance"
	| "manage"
	| "rooms"
	| "porters"
	| "paymentConfig"
	| "allocations";

type HostelItem = {
	id: string;
	name: string;
	type: string;
	totalBeds: number;
	availableBeds: number;
	fee: string;
	blocks: string[];
	amenities: string[];
	status: HostelStatus;
	tag: string;
	tone: "rose" | "teal" | "slate";
};

type HostelMenuItem = {
	label: string;
	view: HostelView;
	icon: ElementType;
	requiredPermissions?: PermissionKey[];
};

const HOSTEL_STATS = [
	{
		label: "Available Hostels",
		value: "6",
		description: "Female 3, Male 3, Mixed 1",
		icon: Building2,
	},
	{
		label: "Beds Available",
		value: "246",
		description: "Out of 800 total available",
		icon: BedDouble,
	},
	{
		label: "Hostel Fee",
		value: "NGN 45,000",
		description: "Per session fee",
		icon: CircleDollarSign,
	},
	{
		label: "Booking Deadline",
		value: "Jan 31",
		description: "15 days remaining",
		icon: CalendarDays,
	},
];

const BOOKING_STEPS = [
	{
		title: "Pay hostel fee",
		description: "Pay the hostel accommodation fee for the session.",
		icon: ReceiptText,
	},
	{
		title: "Choose hostel",
		description: "Browse and select your preferred hostel.",
		icon: Home,
	},
	{
		title: "Pick a bed",
		description: "Select from available beds in your preferred room.",
		icon: BedDouble,
	},
	{
		title: "Get allocated",
		description: "Receive your official hostel allocation record.",
		icon: CheckCircle2,
	},
];

const HOSTELS: HostelItem[] = [
	{
		id: "moremi",
		name: "Moremi Hall",
		type: "Female Hostel",
		totalBeds: 320,
		availableBeds: 45,
		fee: "NGN 45,000",
		blocks: ["Block A", "Block B"],
		amenities: ["WiFi", "Running Water", "24hr Power", "Security", "Study Room", "Canteen"],
		status: "available",
		tag: "On Sale",
		tone: "rose",
	},
	{
		id: "awolowo",
		name: "Awolowo Hall",
		type: "Male Hostel",
		totalBeds: 280,
		availableBeds: 12,
		fee: "NGN 45,000",
		blocks: ["Block A", "Block B", "Block C"],
		amenities: ["WiFi", "Running Water", "24hr Power", "Security", "Canteen"],
		status: "filling",
		tag: "Filling Up",
		tone: "teal",
	},
	{
		id: "matters",
		name: "Matters Hall",
		type: "Female Hostel",
		totalBeds: 200,
		availableBeds: 0,
		fee: "NGN 45,000",
		blocks: ["Block A", "Block B"],
		amenities: ["Running Water", "Security", "Study Room"],
		status: "full",
		tag: "Full",
		tone: "slate",
	},
	{
		id: "queen",
		name: "Queen Hall",
		type: "Female Hostel",
		totalBeds: 240,
		availableBeds: 80,
		fee: "NGN 45,000",
		blocks: ["Block A", "Block B"],
		amenities: ["WiFi", "Running Water", "24hr Power", "Security", "Laundry"],
		status: "available",
		tag: "Book Now",
		tone: "rose",
	},
];

const STUDENT_MENU: HostelMenuItem[] = [
	{ label: "Dashboard", view: "dashboard", icon: Home },
	{ label: "Browse Hostels", view: "browse", icon: Search },
	{ label: "My Allocation", view: "allocation", icon: BedDouble },
	{ label: "Hostel Payment", view: "payment", icon: CreditCard },
	{ label: "Maintenance", view: "maintenance", icon: Wrench },
];

const ADMIN_MENU: HostelMenuItem[] = [
	{
		label: "Manage Hostels",
		view: "manage",
		icon: Building2,
		requiredPermissions: ["hostels.create"],
	},
	{
		label: "Rooms & Beds",
		view: "rooms",
		icon: DoorOpen,
		requiredPermissions: ["hostels.update"],
	},
	{
		label: "Porter Management",
		view: "porters",
		icon: Users,
		requiredPermissions: ["hostels.update"],
	},
	{
		label: "Payment Config",
		view: "paymentConfig",
		icon: Settings,
		requiredPermissions: ["payments.verify"],
	},
	{
		label: "Student Allocations",
		view: "allocations",
		icon: ShieldCheck,
		requiredPermissions: ["hostels.allocate"],
	},
];

const ROOMS = [
	{ id: "A101", block: "Block A", beds: 6, available: 4, status: "Available" },
	{ id: "A102", block: "Block A", beds: 6, available: 6, status: "Available" },
	{ id: "A103", block: "Block A", beds: 4, available: 2, status: "Partial" },
	{ id: "B101", block: "Block B", beds: 6, available: 5, status: "Available" },
	{ id: "B102", block: "Block B", beds: 4, available: 0, status: "Full" },
];

function getHostelToneClass(tone: HostelItem["tone"]) {
	if (tone === "rose") return "bg-[#d92672]";
	if (tone === "teal") return "bg-[#089985]";
	return "bg-[#4a5d78]";
}

function getStatusClass(status: HostelStatus | string) {
	const normalized = status.toLowerCase();
	if (normalized === "available") return "bg-[#eaf8f0] text-[#147b42]";
	if (normalized === "filling" || normalized === "partial") return "bg-[#fff5df] text-[#a36200]";
	if (normalized === "full") return "bg-[#fff0f0] text-[#b42318]";
	return "bg-[#eef4fb] text-[#35527d]";
}

function HostelStatCard({ stat }: { stat: (typeof HOSTEL_STATS)[number] }) {
	const Icon = stat.icon;

	return (
		<div className="rounded-2xl border border-[#dbe5f1] bg-white p-4 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8395AF]">
						{stat.label}
					</p>
					<p className="mt-2 text-2xl font-bold text-[#0D2B55]">{stat.value}</p>
					<p className="mt-1 text-xs leading-relaxed text-[#60728f]">
						{stat.description}
					</p>
				</div>
				<div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#2E86C1]">
					<Icon className="size-5" />
				</div>
			</div>
		</div>
	);
}

function BookingStepCard({
	step,
	index,
}: {
	step: (typeof BOOKING_STEPS)[number];
	index: number;
}) {
	const Icon = step.icon;

	return (
		<div className="rounded-2xl border border-[#e3eaf4] bg-white p-4 text-center shadow-sm">
			<div className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-[#fff7e8] text-[#B7770D]">
				<Icon className="size-5" />
			</div>
			<p className="mt-3 text-sm font-bold text-[#0D2B55]">
				{index + 1}. {step.title}
			</p>
			<p className="mt-1 text-xs leading-relaxed text-[#7b8ca7]">
				{step.description}
			</p>
		</div>
	);
}

function HostelCard({
	hostel,
	onView,
	onBook,
}: {
	hostel: HostelItem;
	onView: (hostel: HostelItem) => void;
	onBook: (hostel: HostelItem) => void;
}) {
	const canBook = hostel.status !== "full";

	return (
		<div className="overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
			<div
				className={`relative flex h-28 items-center justify-center ${getHostelToneClass(hostel.tone)}`}
			>
				<div className="flex size-14 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
					<Home className="size-7" />
				</div>
				<span
					className={`absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] font-bold ${getStatusClass(hostel.status)}`}
				>
					{hostel.tag}
				</span>
			</div>
			<div className="p-4">
				<h3 className="text-base font-bold text-[#0D2B55]">{hostel.name}</h3>
				<p className="mt-1 text-xs font-semibold text-[#72839f]">{hostel.type}</p>
				<p className="mt-3 text-sm font-bold text-[#B7770D]">
					{hostel.fee}
					<span className="ml-1 text-[11px] font-semibold text-[#8a9ab2]">
						per session
					</span>
				</p>
				<div className="mt-4 grid grid-cols-3 gap-2 text-xs">
					<div className="rounded-xl bg-[#f8fbff] px-3 py-2">
						<p className="font-bold text-[#0D2B55]">{hostel.totalBeds}</p>
						<p className="mt-0.5 text-[#8395AF]">beds</p>
					</div>
					<div className="rounded-xl bg-[#f8fbff] px-3 py-2">
						<p className="font-bold text-[#0D2B55]">{hostel.availableBeds}</p>
						<p className="mt-0.5 text-[#8395AF]">free</p>
					</div>
					<div className="rounded-xl bg-[#f8fbff] px-3 py-2">
						<p className="font-bold text-[#0D2B55]">{hostel.amenities.length}</p>
						<p className="mt-0.5 text-[#8395AF]">amenities</p>
					</div>
				</div>
				<div className="mt-4 flex flex-col gap-2 sm:flex-row">
					<button
						type="button"
						onClick={() => onView(hostel)}
						className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#d7e2f0] bg-white px-4 text-sm font-bold text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
					>
						<Eye className="size-4" />
						View Details
					</button>
					<button
						type="button"
						disabled={!canBook}
						onClick={() => onBook(hostel)}
						className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0f9d6a] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b8158] disabled:cursor-not-allowed disabled:bg-[#a6d9c4]"
					>
						<BedDouble className="size-4" />
						{canBook ? "Book Now" : "Full"}
					</button>
				</div>
			</div>
		</div>
	);
}

function HostelAside({
	activeView,
	collapsed,
	permissions,
	onToggle,
	onSelect,
}: {
	activeView: HostelView;
	collapsed: boolean;
	permissions: UserPermissionKey[];
	onToggle: () => void;
	onSelect: (view: HostelView) => void;
}) {
	const visibleAdminMenu = ADMIN_MENU.filter((item) =>
		hasPermissions(permissions, item.requiredPermissions ?? []),
	);

	function renderItem(item: HostelMenuItem) {
		const Icon = item.icon;
		const active = activeView === item.view;

		return (
			<button
				key={item.view}
				type="button"
				onClick={() => onSelect(item.view)}
				title={collapsed ? item.label : undefined}
				className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition ${
					active
						? "border border-[#d8a13a]/40 bg-[#fff7e8] text-[#B7770D]"
						: "text-[#314461] hover:bg-[#f4f8fd]"
				} ${collapsed ? "justify-center" : ""}`}
			>
				<Icon className="size-4.5 shrink-0" />
				<span className={collapsed ? "sr-only" : ""}>{item.label}</span>
			</button>
		);
	}

	return (
		<aside
			className={`h-fit shrink-0 transition-all duration-300 lg:sticky lg:top-0 ${
				collapsed ? "lg:w-[4.75rem]" : "lg:w-60"
			}`}
		>
			<div className="overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white shadow-sm">
				<div className="flex items-center justify-between bg-[#0D2B55] px-3 py-3 text-white">
					<div className={`min-w-0 ${collapsed ? "hidden" : "block"}`}>
						<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#E4A11B]">
							Hostel Menu
						</p>
					</div>
					<button
						type="button"
						onClick={onToggle}
						className="inline-flex size-9 items-center justify-center rounded-xl border border-white/12 bg-white/8 text-white transition hover:bg-white/15"
						aria-label={collapsed ? "Expand hostel menu" : "Collapse hostel menu"}
					>
						{collapsed ? (
							<PanelLeftOpen className="size-4" />
						) : (
							<PanelLeftClose className="size-4" />
						)}
					</button>
				</div>

				<nav className="space-y-2 p-3">
					<p
						className={`px-2 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8395AF] ${
							collapsed ? "sr-only" : ""
						}`}
					>
						Student
					</p>
					<div className="space-y-1">{STUDENT_MENU.map(renderItem)}</div>

					{visibleAdminMenu.length > 0 ? (
						<>
							<div className="my-3 h-px bg-[#edf1f6]" />
							<p
								className={`px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8395AF] ${
									collapsed ? "sr-only" : ""
								}`}
							>
								Admin
							</p>
							<div className="space-y-1">{visibleAdminMenu.map(renderItem)}</div>
						</>
					) : null}
				</nav>
			</div>
		</aside>
	);
}

function DashboardView({
	collegeName,
	onApply,
	onBrowse,
	onView,
	onBook,
}: {
	collegeName: string;
	onApply: () => void;
	onBrowse: () => void;
	onView: (hostel: HostelItem) => void;
	onBook: (hostel: HostelItem) => void;
}) {
	return (
		<div className="space-y-5">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
						{collegeName}
					</p>
					<h2 className="mt-2 text-2xl font-bold text-[#0D2B55]">
						Welcome back, Olusaseun
					</h2>
					<p className="mt-1 text-sm text-[#60728f]">
						2026/2027 session bed space booking is now open.
					</p>
				</div>
				<button
					type="button"
					onClick={onApply}
					className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0D2B55] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#173f77]"
				>
					<Home className="size-4" />
					Book a Bed Space
				</button>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{HOSTEL_STATS.map((stat) => (
					<HostelStatCard key={stat.label} stat={stat} />
				))}
			</div>

			<div className="rounded-2xl border border-[#f0cb7c] bg-[#fff8e8] p-4">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex items-start gap-3">
						<div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#B7770D]">
							<DoorOpen className="size-5" />
						</div>
						<div>
							<p className="text-sm font-bold text-[#7a4a00]">
								Bed Space Booking Now Open - 2026/2027
							</p>
							<p className="mt-1 text-sm leading-relaxed text-[#8a650d]">
								Complete your payment first, then select your preferred hall,
								block, room, and bed number.
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onApply}
						className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#B7770D] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#986006]"
					>
						Apply Now
						<ArrowRight className="size-4" />
					</button>
				</div>
			</div>

			<div>
				<h3 className="mb-3 text-sm font-bold text-[#0D2B55]">
					How to Get a Bed Space
				</h3>
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{BOOKING_STEPS.map((step, index) => (
						<BookingStepCard key={step.title} step={step} index={index} />
					))}
				</div>
			</div>

			<div>
				<div className="mb-3 flex items-center justify-between gap-3">
					<h3 className="text-sm font-bold text-[#0D2B55]">Featured Hostels</h3>
					<button
						type="button"
						onClick={onBrowse}
						className="inline-flex items-center gap-1 text-sm font-bold text-[#B7770D]"
					>
						Browse All
						<ArrowRight className="size-4" />
					</button>
				</div>
				<div className="grid gap-4 xl:grid-cols-3">
					{HOSTELS.slice(0, 3).map((hostel) => (
						<HostelCard
							key={hostel.id}
							hostel={hostel}
							onView={onView}
							onBook={onBook}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function BrowseView({
	onView,
	onBook,
}: {
	onView: (hostel: HostelItem) => void;
	onBook: (hostel: HostelItem) => void;
}) {
	return (
		<div className="space-y-5">
			<div>
				<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
					Browse Hostels
				</p>
				<h2 className="mt-2 text-2xl font-bold text-[#0D2B55]">
					All campus accommodation options
				</h2>
				<p className="mt-1 text-sm text-[#60728f]">
					Review hostel capacity, availability, and fee details before booking.
				</p>
			</div>
			<div className="grid gap-4 xl:grid-cols-3">
				{HOSTELS.map((hostel) => (
					<HostelCard
						key={hostel.id}
						hostel={hostel}
						onView={onView}
						onBook={onBook}
					/>
				))}
			</div>
		</div>
	);
}

function DetailsView({
	hostel,
	onBook,
	onBrowse,
}: {
	hostel: HostelItem;
	onBook: (hostel: HostelItem) => void;
	onBrowse: () => void;
}) {
	return (
		<div className="overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white shadow-sm">
			<div className={`h-36 ${getHostelToneClass(hostel.tone)}`} />
			<div className="p-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div>
						<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
							Hostel Details
						</p>
						<h2 className="mt-2 text-2xl font-bold text-[#0D2B55]">
							{hostel.name}
						</h2>
						<p className="mt-1 text-sm font-semibold text-[#60728f]">
							{hostel.type} with {hostel.availableBeds} free bed spaces.
						</p>
					</div>
					<span
						className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(hostel.status)}`}
					>
						{hostel.tag}
					</span>
				</div>
				<div className="mt-5 grid gap-3 sm:grid-cols-3">
					{[
						["Total Beds", hostel.totalBeds],
						["Available Beds", hostel.availableBeds],
						["Blocks", hostel.blocks.length],
					].map(([label, value]) => (
						<div key={label as string} className="rounded-2xl bg-[#f8fbff] p-4">
							<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8395AF]">
								{label as string}
							</p>
							<p className="mt-2 text-2xl font-bold text-[#0D2B55]">
								{value as number}
							</p>
						</div>
					))}
				</div>
				<div className="mt-5">
					<p className="text-sm font-bold text-[#0D2B55]">Amenities</p>
					<div className="mt-3 flex flex-wrap gap-2">
						{hostel.amenities.map((amenity) => (
							<span
								key={amenity}
								className="rounded-full border border-[#dbe5f1] bg-[#fbfdff] px-3 py-1 text-xs font-bold text-[#60728f]"
							>
								{amenity}
							</span>
						))}
					</div>
				</div>
				<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
					<button
						type="button"
						onClick={onBrowse}
						className="min-h-11 rounded-xl border border-[#d7e2f0] bg-white px-5 text-sm font-bold text-[#0D2B55]"
					>
						Back to Browse
					</button>
					<button
						type="button"
						disabled={hostel.status === "full"}
						onClick={() => onBook(hostel)}
						className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0D2B55] px-5 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-[#9fb0c6]"
					>
						<BedDouble className="size-4" />
						Book This Hostel
					</button>
				</div>
			</div>
		</div>
	);
}

function BookingView({
	selectedHostel,
	onChooseHostel,
}: {
	selectedHostel: HostelItem | null;
	onChooseHostel: (hostel: HostelItem) => void;
}) {
	if (!selectedHostel) {
		return (
			<div className="space-y-5">
				<div>
					<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
						Book a Bed Space
					</p>
					<h2 className="mt-2 text-2xl font-bold text-[#0D2B55]">
						Choose a hostel to continue
					</h2>
				</div>
				<div className="grid gap-4 xl:grid-cols-3">
					{HOSTELS.filter((hostel) => hostel.status !== "full").map((hostel) => (
						<HostelCard
							key={hostel.id}
							hostel={hostel}
							onView={onChooseHostel}
							onBook={onChooseHostel}
						/>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-5">
			<div className="overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white shadow-sm">
				<div className="bg-[#0D2B55] p-5 text-white">
					<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#E4A11B]">
						Booking Workspace
					</p>
					<h2 className="mt-2 text-2xl font-bold">{selectedHostel.name}</h2>
					<p className="mt-1 text-sm text-[#b8c8dd]">
						Select a room and preferred bed number.
					</p>
				</div>
				<div className="p-5">
					<div className="mb-4 flex flex-wrap gap-2">
						{selectedHostel.blocks.map((block) => (
							<span
								key={block}
								className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-bold text-[#2E86C1]"
							>
								{block}
							</span>
						))}
					</div>
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
						{ROOMS.map((room) => (
							<button
								key={room.id}
								type="button"
								disabled={room.status === "Full"}
								className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4 text-left transition hover:border-[#B7770D] disabled:cursor-not-allowed disabled:opacity-55"
							>
								<p className="text-sm font-bold text-[#0D2B55]">{room.id}</p>
								<p className="mt-1 text-xs text-[#60728f]">
									{room.block} - {room.available} available
								</p>
								<span
									className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusClass(room.status)}`}
								>
									{room.status}
								</span>
							</button>
						))}
					</div>
					<div className="mt-5 rounded-2xl border border-[#b7ebc8] bg-[#f2fbf5] p-4">
						<p className="text-sm font-bold text-[#167a3e]">
							Booking ready for confirmation
						</p>
						<p className="mt-1 text-sm text-[#477157]">
							This placeholder will connect to hostel payment and room selection
							APIs during real model integration.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function SimplePanel({
	badge,
	title,
	description,
	children,
}: {
	badge: string;
	title: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
			<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
				{badge}
			</p>
			<h2 className="mt-2 text-2xl font-bold text-[#0D2B55]">{title}</h2>
			<p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#60728f]">
				{description}
			</p>
			<div className="mt-5">{children}</div>
		</div>
	);
}

function AllocationView() {
	return (
		<SimplePanel
			badge="My Allocation"
			title="Current hostel allocation"
			description="Student-facing allocation details will appear here after confirmed payment and bed selection."
		>
			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
				{[
					["Hostel", "Moremi Hall"],
					["Room", "A101"],
					["Bed", "Bed 3"],
					["Status", "Paid"],
				].map(([label, value]) => (
					<div key={label} className="rounded-2xl bg-[#f8fbff] p-4">
						<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8395AF]">
							{label}
						</p>
						<p className="mt-2 text-lg font-bold text-[#0D2B55]">{value}</p>
					</div>
				))}
			</div>
		</SimplePanel>
	);
}

function PaymentView() {
	return (
		<SimplePanel
			badge="Hostel Payment"
			title="Accommodation payment"
			description="This section will connect to the college payment module for hostel fee verification."
		>
			<div className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<p className="text-sm font-bold text-[#0D2B55]">Hostel Fee</p>
						<p className="mt-2 text-3xl font-bold text-[#0D2B55]">NGN 45,000</p>
						<p className="mt-1 text-sm text-[#60728f]">
							Session accommodation charge.
						</p>
					</div>
					<button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0D2B55] px-5 text-sm font-bold text-white">
						<CreditCard className="size-4" />
						Pay Hostel Fee
					</button>
				</div>
			</div>
		</SimplePanel>
	);
}

function MaintenanceView() {
	return (
		<SimplePanel
			badge="Maintenance"
			title="Residence maintenance requests"
			description="Students can track room issues while staff can follow up on hostel operations."
		>
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
				<div className="space-y-3">
					{[
						["Broken door lock", "Room A101", "In Progress"],
						["Leaking ceiling", "Bathroom", "Resolved"],
						["Faulty socket", "Room A101", "Resolved"],
					].map(([issue, location, status]) => (
						<div
							key={issue}
							className="flex flex-col gap-3 rounded-2xl border border-[#e3eaf4] bg-[#fbfdff] p-4 sm:flex-row sm:items-center sm:justify-between"
						>
							<div>
								<p className="text-sm font-bold text-[#0D2B55]">{issue}</p>
								<p className="mt-1 text-xs text-[#60728f]">{location}</p>
							</div>
							<span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(status)}`}>
								{status}
							</span>
						</div>
					))}
				</div>
				<div className="rounded-2xl border border-[#dbe5f1] bg-white p-4">
					<p className="text-sm font-bold text-[#0D2B55]">New request</p>
					<div className="mt-3 space-y-3">
						<input
							className="min-h-11 w-full rounded-xl border border-[#d7e1ee] px-4 text-sm outline-none focus:border-[#2E86C1]"
							placeholder="Issue title"
						/>
						<textarea
							className="min-h-24 w-full rounded-xl border border-[#d7e1ee] px-4 py-3 text-sm outline-none focus:border-[#2E86C1]"
							placeholder="Describe the issue"
						/>
						<button className="min-h-11 w-full rounded-xl bg-[#0D2B55] text-sm font-bold text-white">
							Submit Request
						</button>
					</div>
				</div>
			</div>
		</SimplePanel>
	);
}

function AdminTableView({
	badge,
	title,
	description,
	rows,
}: {
	badge: string;
	title: string;
	description: string;
	rows: Array<[string, string, string]>;
}) {
	return (
		<SimplePanel badge={badge} title={title} description={description}>
			<div className="overflow-hidden rounded-2xl border border-[#dbe5f1]">
				<div className="grid grid-cols-3 gap-3 bg-[#f8fbff] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8395AF]">
					<span>Name</span>
					<span>Status</span>
					<span className="text-right">Action</span>
				</div>
				{rows.map(([name, status, action]) => (
					<div
						key={name}
						className="grid grid-cols-3 gap-3 border-t border-[#edf1f6] px-4 py-4 text-sm"
					>
						<span className="font-bold text-[#0D2B55]">{name}</span>
						<span>
							<span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(status)}`}>
								{status}
							</span>
						</span>
						<span className="text-right">
							<button className="font-bold text-[#B7770D]">{action}</button>
						</span>
					</div>
				))}
			</div>
		</SimplePanel>
	);
}

export default function HostelModuleWorkspace({
	permissions,
	collegeName,
}: HostelModuleWorkspaceProps) {
	const [activeView, setActiveView] = useState<HostelView>("dashboard");
	const [menuCollapsed, setMenuCollapsed] = useState(false);
	const [selectedHostel, setSelectedHostel] = useState<HostelItem | null>(HOSTELS[0]);

	const activeHostel = selectedHostel ?? HOSTELS[0];
	const canManage = useMemo(
		() =>
			hasPermissions(permissions, ["hostels.create"]) ||
			hasPermissions(permissions, ["hostels.update"]) ||
			hasPermissions(permissions, ["hostels.allocate"]),
		[permissions],
	);

	function viewHostel(hostel: HostelItem) {
		setSelectedHostel(hostel);
		setActiveView("details");
	}

	function bookHostel(hostel: HostelItem) {
		setSelectedHostel(hostel);
		setActiveView("booking");
	}

	function renderView() {
		if (activeView === "browse") {
			return <BrowseView onView={viewHostel} onBook={bookHostel} />;
		}

		if (activeView === "details") {
			return (
				<DetailsView
					hostel={activeHostel}
					onBook={bookHostel}
					onBrowse={() => setActiveView("browse")}
				/>
			);
		}

		if (activeView === "booking") {
			return (
				<BookingView
					selectedHostel={selectedHostel}
					onChooseHostel={bookHostel}
				/>
			);
		}

		if (activeView === "allocation") return <AllocationView />;
		if (activeView === "payment") return <PaymentView />;
		if (activeView === "maintenance") return <MaintenanceView />;

		if (activeView === "manage") {
			return (
				<AdminTableView
					badge="Manage Hostels"
					title="Hostel residence setup"
					description="Create and update hostel halls within the current college tenant."
					rows={HOSTELS.map((hostel) => [hostel.name, hostel.status, "Edit"])}
				/>
			);
		}

		if (activeView === "rooms") {
			return (
				<AdminTableView
					badge="Rooms and Beds"
					title="Room readiness"
					description="Manage bed spaces, room capacity, and block availability."
					rows={ROOMS.map((room) => [room.id, room.status, "Update"])}
				/>
			);
		}

		if (activeView === "porters") {
			return (
				<AdminTableView
					badge="Porter Management"
					title="Residence staff coverage"
					description="Assign porter coverage and monitor shift readiness."
					rows={[
						["Aminu Ibrahim", "Available", "Edit"],
						["Grace Bello", "Available", "Edit"],
						["Samuel Okon", "Partial", "Review"],
					]}
				/>
			);
		}

		if (activeView === "paymentConfig") {
			return (
				<AdminTableView
					badge="Payment Config"
					title="Hostel payment rules"
					description="Configure fee structures and payment requirements for hostel allocation."
					rows={[
						["Bed Space Fee", "Available", "Edit"],
						["Caution Deposit", "Available", "Edit"],
						["Late Payment Rule", "Partial", "Review"],
					]}
				/>
			);
		}

		if (activeView === "allocations") {
			return (
				<AdminTableView
					badge="Student Allocations"
					title="Allocation records"
					description="Track student room assignments and payment-cleared allocations."
					rows={[
						["Ibrahim Fatimah", "Available", "View"],
						["Adeyemi Blessing", "Available", "View"],
						["Okafor Chidi", "Partial", "Review"],
					]}
				/>
			);
		}

		return (
			<DashboardView
				collegeName={collegeName}
				onApply={() => setActiveView("booking")}
				onBrowse={() => setActiveView("browse")}
				onView={viewHostel}
				onBook={bookHostel}
			/>
		);
	}

	return (
		<div className="rounded-[1.5rem] border border-[#dbe5f1] bg-white p-3 shadow-sm sm:p-4 xl:p-5">
			<div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[#dbe5f1] bg-white px-4 py-3 shadow-sm lg:hidden">
				<div>
					<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B7770D]">
						Hostel
					</p>
					<p className="text-sm font-bold text-[#0D2B55]">Campus accommodation</p>
				</div>
				<button
					type="button"
					onClick={() => setMenuCollapsed((value) => !value)}
					className="inline-flex size-10 items-center justify-center rounded-xl bg-[#0D2B55] text-white"
					aria-label="Toggle hostel menu"
				>
					<Menu className="size-5" />
				</button>
			</div>

			<div
				className={`grid items-start gap-5 lg:grid-cols-[auto_minmax(0,1fr)] ${
					menuCollapsed ? "grid-cols-1" : "grid-cols-1"
				}`}
			>
				<div className={`${menuCollapsed ? "hidden lg:block" : "block"}`}>
					<HostelAside
						activeView={activeView}
						collapsed={menuCollapsed}
						permissions={permissions}
						onToggle={() => setMenuCollapsed((value) => !value)}
						onSelect={(view) => {
							setActiveView(view);
							if (view === "booking") {
								setSelectedHostel(null);
							}
						}}
					/>
				</div>

				<main className="min-w-0">{renderView()}</main>
			</div>

			{!canManage ? null : (
				<p className="mt-4 text-xs text-[#6b7d97]">
					Admin controls shown in this hostel module are based on current role
					permissions.
				</p>
			)}
		</div>
	);
}
