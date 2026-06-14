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
	Filter,
	Home,
	Plus,
	ReceiptText,
	Search,
	ShieldCheck,
	Wrench,
	X,
} from "lucide-react";
import { useMemo, useState, type ElementType, type ReactNode } from "react";
import { RowActionMenu } from "@/components/ui/row-action-menu";
import type { DashboardDomain } from "@/lib/auth";
import {
	hasPermissions,
	type PermissionKey,
	type UserPermissionKey,
} from "@/lib/rbac";

type HostelModuleWorkspaceProps = {
	permissions: UserPermissionKey[];
	collegeName: string;
	domain: DashboardDomain;
};

type HostelStatus = "available" | "filling" | "full" | "maintenance";
type HostelGender = "Female" | "Male" | "Mixed";
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
	| "allocations";
type HostelModalMode = "create" | "view" | "edit";
type RoomModalMode = "create" | "view" | "edit";
type RoomStatus = "Available" | "Partial" | "Full" | "Maintenance";

type HostelItem = {
	id: string;
	name: string;
	gender: HostelGender;
	warden: string;
	totalBeds: number;
	availableBeds: number;
	fee: string;
	blocks: string[];
	amenities: string[];
	status: HostelStatus;
	tag: string;
	tone: "rose" | "teal" | "slate";
	updatedAt: string;
};

type HostelDraft = {
	name: string;
	gender: HostelGender;
	warden: string;
	totalBeds: string;
	availableBeds: string;
	fee: string;
	status: HostelStatus;
	blocks: string;
	amenities: string;
};

type RoomItem = {
	id: string;
	hostel: string;
	block: string;
	floor: string;
	beds: number;
	available: number;
	occupied: number;
	status: RoomStatus;
	wardenNote: string;
	updatedAt: string;
};

type RoomDraft = {
	id: string;
	hostel: string;
	block: string;
	floor: string;
	beds: string;
	available: string;
	status: RoomStatus;
	wardenNote: string;
};

type HostelMenuItem = {
	label: string;
	view: HostelView;
	icon: ElementType;
	requiredPermissions?: PermissionKey[];
};

const PAGE_SIZE = 20;

const HOSTEL_STATS = [
	{
		label: "Available Hostels",
		value: "6",
		description: "Female 3, Male 2, Mixed 1",
		icon: Building2,
	},
	{
		label: "Beds Available",
		value: "246",
		description: "Out of 800 total bed spaces",
		icon: BedDouble,
	},
	{
		label: "Hostel Fee",
		value: "NGN 45,000",
		description: "Default session charge",
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

const INITIAL_HOSTELS: HostelItem[] = [
	{
		id: "moremi",
		name: "Moremi Hall",
		gender: "Female",
		warden: "Mrs. Grace Bello",
		totalBeds: 320,
		availableBeds: 45,
		fee: "NGN 45,000",
		blocks: ["Block A", "Block B"],
		amenities: ["WiFi", "Running Water", "24hr Power", "Security", "Study Room", "Canteen"],
		status: "available",
		tag: "On Sale",
		tone: "rose",
		updatedAt: "2026-01-16T09:30:00.000Z",
	},
	{
		id: "awolowo",
		name: "Awolowo Hall",
		gender: "Male",
		warden: "Mr. Aminu Ibrahim",
		totalBeds: 280,
		availableBeds: 12,
		fee: "NGN 45,000",
		blocks: ["Block A", "Block B", "Block C"],
		amenities: ["WiFi", "Running Water", "24hr Power", "Security", "Canteen"],
		status: "filling",
		tag: "Filling Up",
		tone: "teal",
		updatedAt: "2026-01-15T14:05:00.000Z",
	},
	{
		id: "matters",
		name: "Matters Hall",
		gender: "Female",
		warden: "Dr. Mariam Yusuf",
		totalBeds: 200,
		availableBeds: 0,
		fee: "NGN 45,000",
		blocks: ["Block A", "Block B"],
		amenities: ["Running Water", "Security", "Study Room"],
		status: "full",
		tag: "Full",
		tone: "slate",
		updatedAt: "2026-01-13T11:20:00.000Z",
	},
	{
		id: "queen",
		name: "Queen Hall",
		gender: "Female",
		warden: "Mrs. Yetunde Ajayi",
		totalBeds: 240,
		availableBeds: 80,
		fee: "NGN 45,000",
		blocks: ["Block A", "Block B"],
		amenities: ["WiFi", "Running Water", "24hr Power", "Security", "Laundry"],
		status: "available",
		tag: "Book Now",
		tone: "rose",
		updatedAt: "2026-01-12T10:15:00.000Z",
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
		label: "Analytics",
		view: "manage",
		icon: Building2,
		requiredPermissions: ["hostels.view"],
	},
	{
		label: "Rooms & Beds",
		view: "rooms",
		icon: DoorOpen,
		requiredPermissions: ["hostels.update"],
	},
	{
		label: "Allocations",
		view: "allocations",
		icon: ShieldCheck,
		requiredPermissions: ["hostels.allocate"],
	},
];

const INITIAL_ROOMS: RoomItem[] = [
	{
		id: "A101",
		hostel: "Moremi Hall",
		block: "Block A",
		floor: "Ground Floor",
		beds: 6,
		available: 4,
		occupied: 2,
		status: "Available",
		wardenNote: "Ready for allocation",
		updatedAt: "2026-01-16T10:15:00.000Z",
	},
	{
		id: "A102",
		hostel: "Moremi Hall",
		block: "Block A",
		floor: "Ground Floor",
		beds: 6,
		available: 6,
		occupied: 0,
		status: "Available",
		wardenNote: "Newly cleaned",
		updatedAt: "2026-01-15T13:40:00.000Z",
	},
	{
		id: "A103",
		hostel: "Moremi Hall",
		block: "Block A",
		floor: "First Floor",
		beds: 4,
		available: 2,
		occupied: 2,
		status: "Partial",
		wardenNote: "Two beds assigned",
		updatedAt: "2026-01-14T09:05:00.000Z",
	},
	{
		id: "B101",
		hostel: "Awolowo Hall",
		block: "Block B",
		floor: "Ground Floor",
		beds: 6,
		available: 5,
		occupied: 1,
		status: "Available",
		wardenNote: "One reserved allocation",
		updatedAt: "2026-01-13T16:30:00.000Z",
	},
	{
		id: "B102",
		hostel: "Awolowo Hall",
		block: "Block B",
		floor: "First Floor",
		beds: 4,
		available: 0,
		occupied: 4,
		status: "Full",
		wardenNote: "No vacant bed space",
		updatedAt: "2026-01-12T12:20:00.000Z",
	},
	{
		id: "C201",
		hostel: "Queen Hall",
		block: "Block C",
		floor: "Second Floor",
		beds: 4,
		available: 0,
		occupied: 0,
		status: "Maintenance",
		wardenNote: "Plumbing repair pending",
		updatedAt: "2026-01-11T08:45:00.000Z",
	},
];

const STATUS_LABELS: Record<HostelStatus, string> = {
	available: "Available",
	filling: "Filling",
	full: "Full",
	maintenance: "Maintenance",
};

const GENDER_OPTIONS: HostelGender[] = ["Female", "Male", "Mixed"];

function getHostelToneClass(tone: HostelItem["tone"]) {
	if (tone === "rose") return "bg-[#d92672]";
	if (tone === "teal") return "bg-[#089985]";
	return "bg-[#4a5d78]";
}

function getStatusClass(status: HostelStatus | string) {
	const normalized = status.toLowerCase();
	if (normalized === "available") return "border-emerald-200 bg-emerald-50 text-emerald-700";
	if (normalized === "filling" || normalized === "partial") return "border-amber-200 bg-amber-50 text-amber-700";
	if (normalized === "full") return "border-red-200 bg-red-50 text-red-700";
	if (normalized === "maintenance") return "border-sky-200 bg-sky-50 text-sky-700";
	return "border-slate-200 bg-slate-50 text-slate-700";
}

function formatDate(value?: string) {
	if (!value) {
		return "Not saved";
	}

	return new Intl.DateTimeFormat("en-NG", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

function getHostelDraft(hostel?: HostelItem | null): HostelDraft {
	return {
		name: hostel?.name ?? "",
		gender: hostel?.gender ?? "Female",
		warden: hostel?.warden ?? "",
		totalBeds: hostel ? String(hostel.totalBeds) : "",
		availableBeds: hostel ? String(hostel.availableBeds) : "",
		fee: hostel?.fee ?? "NGN 45,000",
		status: hostel?.status ?? "available",
		blocks: hostel?.blocks.join(", ") ?? "",
		amenities: hostel?.amenities.join(", ") ?? "",
	};
}

function getRoomDraft(room?: RoomItem | null): RoomDraft {
	return {
		id: room?.id ?? "",
		hostel: room?.hostel ?? INITIAL_HOSTELS[0]?.name ?? "",
		block: room?.block ?? "",
		floor: room?.floor ?? "",
		beds: room ? String(room.beds) : "",
		available: room ? String(room.available) : "",
		status: room?.status ?? "Available",
		wardenNote: room?.wardenNote ?? "",
	};
}

function getRoomStatusFromAvailability(available: number, beds: number): RoomStatus {
	if (beds <= 0 || available <= 0) return "Full";
	if (available >= beds) return "Available";
	return "Partial";
}

function parseCsvList(value: string) {
	return value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

function HostelStatCard({ stat }: { stat: (typeof HOSTEL_STATS)[number] }) {
	const Icon = stat.icon;

	return (
		<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
						{stat.label}
					</p>
					<p className="mt-2 text-3xl font-black text-[#0D2B55]">{stat.value}</p>
					<p className="mt-1 text-xs font-semibold leading-relaxed text-[#60728f]">
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
					className={`absolute right-4 top-4 rounded-full border px-3 py-1 text-[10px] font-black ${getStatusClass(hostel.status)}`}
				>
					{hostel.tag}
				</span>
			</div>
			<div className="p-4">
				<h3 className="text-base font-bold text-[#0D2B55]">{hostel.name}</h3>
				<p className="mt-1 text-xs font-semibold text-[#72839f]">
					{hostel.gender} Hostel
				</p>
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

function HostelTabs({
	activeView,
	permissions,
	domain,
	onSelect,
}: {
	activeView: HostelView;
	permissions: UserPermissionKey[];
	domain: DashboardDomain;
	onSelect: (view: HostelView) => void;
}) {
	const menu =
		domain === "student"
			? STUDENT_MENU
			: ADMIN_MENU.filter((item) =>
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
				className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition ${
					active
						? "border-[#d8a13a]/60 bg-[#fff7e8] text-[#B7770D] shadow-sm"
						: "border-transparent text-[#314461] hover:border-[#dbe5f1] hover:bg-[#f4f8fd]"
				}`}
			>
				<Icon className="size-4.5 shrink-0" />
				<span>{item.label}</span>
			</button>
		);
	}

	return (
		<div className="rounded-2xl border border-[#dbe5f1] bg-white p-3 shadow-sm">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B7770D]">
						Hostel
					</p>
					<p className="mt-1 text-sm font-bold text-[#0D2B55]">
						{domain === "student" ? "Student accommodation" : "Admin accommodation"}
					</p>
				</div>
				<nav
					aria-label="Hostel views"
					className="flex gap-2 overflow-x-auto pb-1"
				>
					{menu.map(renderItem)}
				</nav>
			</div>
		</div>
	);
}

function DashboardView({
	collegeName,
	hostels,
	onApply,
	onBrowse,
	onView,
	onBook,
}: {
	collegeName: string;
	hostels: HostelItem[];
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
						Welcome back
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
					{hostels.slice(0, 3).map((hostel) => (
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
	hostels,
	onView,
	onBook,
}: {
	hostels: HostelItem[];
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
				{hostels.map((hostel) => (
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
							{hostel.gender} hostel with {hostel.availableBeds} free bed spaces.
						</p>
					</div>
					<span
						className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(hostel.status)}`}
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
	hostels,
	onChooseHostel,
}: {
	selectedHostel: HostelItem | null;
	hostels: HostelItem[];
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
					{hostels.filter((hostel) => hostel.status !== "full").map((hostel) => (
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
						{INITIAL_ROOMS.filter((room) => room.hostel === selectedHostel.name).map((room) => (
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
									className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(room.status)}`}
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
							<span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(status)}`}>
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

function RoomsView({
	rooms,
	hostels,
	permissions,
	onCreate,
	onView,
	onEdit,
}: {
	rooms: RoomItem[];
	hostels: HostelItem[];
	permissions: UserPermissionKey[];
	onCreate: () => void;
	onView: (room: RoomItem) => void;
	onEdit: (room: RoomItem) => void;
}) {
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<RoomStatus | "all">("all");
	const [hostelFilter, setHostelFilter] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [openActionsId, setOpenActionsId] = useState<string | number | null>(null);
	const canCreate = hasPermissions(permissions, ["hostels.create"], { mode: "any" });
	const canUpdate = hasPermissions(permissions, ["hostels.update"], { mode: "any" });
	const stats = useMemo(
		() => ({
			totalRooms: rooms.length,
			totalBeds: rooms.reduce((total, room) => total + room.beds, 0),
			availableBeds: rooms.reduce((total, room) => total + room.available, 0),
			maintenance: rooms.filter((room) => room.status === "Maintenance").length,
		}),
		[rooms],
	);
	const filteredRooms = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return rooms.filter((room) => {
			const haystack = [
				room.id,
				room.hostel,
				room.block,
				room.floor,
				room.status,
				room.wardenNote,
			]
				.join(" ")
				.toLowerCase();

			return (
				(!normalizedSearch || haystack.includes(normalizedSearch)) &&
				(status === "all" || room.status === status) &&
				(hostelFilter === "all" || room.hostel === hostelFilter)
			);
		});
	}, [hostelFilter, rooms, search, status]);
	const pageCount = Math.max(1, Math.ceil(filteredRooms.length / PAGE_SIZE));
	const safePage = Math.min(currentPage, pageCount);
	const paginatedRooms = filteredRooms.slice(
		(safePage - 1) * PAGE_SIZE,
		safePage * PAGE_SIZE,
	);
	const hostelOptions = useMemo(
		() =>
			Array.from(new Set([...hostels.map((hostel) => hostel.name), ...rooms.map((room) => room.hostel)]))
				.filter(Boolean)
				.sort((left, right) => left.localeCompare(right)),
		[hostels, rooms],
	);

	function updateFilter<T>(setter: (value: T) => void, value: T) {
		setter(value);
		setCurrentPage(1);
	}

	function clearFilters() {
		setSearch("");
		setStatus("all");
		setHostelFilter("all");
		setCurrentPage(1);
	}

	return (
		<section className="space-y-5">
			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							Rooms & Beds Analytics
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							Room and bed management
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#556987]">
							Manage hostel rooms, bed capacity, available bed spaces, and
							maintenance readiness from one responsive admin table.
						</p>
					</div>
					<button
						type="button"
						onClick={onCreate}
						disabled={!canCreate}
						className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<Plus className="size-4" />
						Create Room
					</button>
				</div>

				<div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{[
						["Total Rooms", stats.totalRooms],
						["Total Beds", stats.totalBeds],
						["Available Beds", stats.availableBeds],
						["Maintenance", stats.maintenance],
					].map(([label, value]) => (
						<div
							key={label}
							className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4"
						>
							<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
								{label}
							</p>
							<p className="mt-2 text-3xl font-black text-[#0D2B55]">{value}</p>
						</div>
					))}
				</div>
			</div>

			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-4 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
						<Filter className="size-4" />
						Filters
					</div>
					<button
						type="button"
						onClick={clearFilters}
						className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#d3dfed] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
					>
						Reset filters
					</button>
				</div>
				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_13rem_13rem]">
					<label className="relative">
						<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
						<input
							value={search}
							onChange={(event) => updateFilter(setSearch, event.target.value)}
							placeholder="Search room, hostel, block, or note"
							className="h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] pl-11 pr-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>
					<select
						value={hostelFilter}
						onChange={(event) => updateFilter(setHostelFilter, event.target.value)}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="all">All hostels</option>
						{hostelOptions.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
					<select
						value={status}
						onChange={(event) =>
							updateFilter(setStatus, event.target.value as RoomStatus | "all")
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="all">All status</option>
						<option value="Available">Available</option>
						<option value="Partial">Partial</option>
						<option value="Full">Full</option>
						<option value="Maintenance">Maintenance</option>
					</select>
				</div>
			</div>

			<div className="overflow-hidden rounded-3xl border border-[#d7e2f0] bg-white shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe5f1] px-4 py-4 sm:px-5">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
							Rooms Table
						</p>
						<p className="mt-1 text-sm font-semibold text-[#60728f]">
							Showing {paginatedRooms.length} of {filteredRooms.length} rooms
						</p>
					</div>
					<div className="flex items-center gap-2 rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-4 py-2 text-xs font-black text-[#0D2B55]">
						Page {safePage} of {pageCount}
					</div>
				</div>

				{filteredRooms.length === 0 ? (
					<div className="p-8 text-center">
						<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eef4fb] text-[#2E86C1]">
							<DoorOpen className="size-6" />
						</div>
						<h3 className="mt-4 text-lg font-black text-[#06183A]">
							No rooms found
						</h3>
						<p className="mt-2 text-sm text-[#60728f]">
							Adjust the filters or create a room for this hostel module.
						</p>
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className="min-w-[1080px] w-full border-collapse text-left">
								<thead className="bg-[#f8fbff]">
									<tr className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
										<th className="px-5 py-4">Room</th>
										<th className="px-5 py-4">Hostel</th>
										<th className="px-5 py-4">Block</th>
										<th className="px-5 py-4">Beds</th>
										<th className="px-5 py-4">Available</th>
										<th className="px-5 py-4">Status</th>
										<th className="px-5 py-4">Last Updated</th>
										<th className="px-5 py-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[#dbe5f1]">
									{paginatedRooms.map((room) => (
										<tr key={room.id} className="bg-white transition hover:bg-[#f8fbff]">
											<td className="px-5 py-4">
												<p className="font-black text-[#06183A]">{room.id}</p>
												<p className="mt-1 max-w-[14rem] break-words text-sm font-semibold text-[#60728f]">
													{room.floor}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-black text-[#0D2B55]">
													{room.hostel}
												</p>
											</td>
											<td className="px-5 py-4 text-sm font-bold text-[#60728f]">
												{room.block}
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-black text-[#0D2B55]">
													{room.occupied} / {room.beds}
												</p>
												<p className="mt-1 text-xs font-bold text-[#60728f]">
													occupied beds
												</p>
											</td>
											<td className="px-5 py-4 text-sm font-black text-[#0D2B55]">
												{room.available}
											</td>
											<td className="px-5 py-4">
												<span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${getStatusClass(room.status)}`}>
													{room.status}
												</span>
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-bold text-[#60728f]">
													{formatDate(room.updatedAt)}
												</p>
											</td>
											<td className="px-5 py-4">
												<RowActionMenu
													label={`Open actions for room ${room.id}`}
													open={openActionsId === room.id}
													onOpenChange={(open) => setOpenActionsId(open ? room.id : null)}
													menuClassName="z-[100]"
													items={[
														{
															label: "View",
															icon: <Eye className="size-4" />,
															onSelect: () => {
																onView(room);
																setOpenActionsId(null);
															},
														},
														{
															label: "Edit",
															icon: <Edit3 className="size-4" />,
															disabled: !canUpdate,
															className: "text-[#0D2B55] hover:bg-[#eef4fb]",
															onSelect: () => {
																onEdit(room);
																setOpenActionsId(null);
															},
														},
													]}
												/>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div className="flex flex-col gap-3 border-t border-[#dbe5f1] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
							<p className="text-sm font-semibold text-[#60728f]">
								Rows per page: {PAGE_SIZE}
							</p>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
									disabled={safePage === 1}
									className="h-10 rounded-2xl border border-[#d3dfed] bg-white px-4 text-sm font-black text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D] disabled:cursor-not-allowed disabled:opacity-40"
								>
									Previous
								</button>
								<button
									type="button"
									onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
									disabled={safePage === pageCount}
									className="h-10 rounded-2xl bg-[#0D2B55] px-4 text-sm font-black text-white transition hover:bg-[#123866] disabled:cursor-not-allowed disabled:opacity-40"
								>
									Next
								</button>
							</div>
						</div>
					</>
				)}
			</div>
		</section>
	);
}

function RoomModal({
	mode,
	room,
	draft,
	hostels,
	canSave,
	onClose,
	onDraftChange,
	onSave,
}: {
	mode: RoomModalMode | null;
	room: RoomItem | null;
	draft: RoomDraft;
	hostels: HostelItem[];
	canSave: boolean;
	onClose: () => void;
	onDraftChange: (draft: RoomDraft) => void;
	onSave: () => void;
}) {
	if (!mode) {
		return null;
	}

	const isView = mode === "view";
	const title =
		mode === "create" ? "Create room" : mode === "edit" ? "Edit room" : "Room details";
	const hostelOptions = Array.from(
		new Set([...hostels.map((hostel) => hostel.name), draft.hostel].filter(Boolean)),
	);

	return (
		<div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
				<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
							Manage Room & Beds
						</p>
						<h2 className="mt-2 text-xl font-black sm:text-2xl">{title}</h2>
						<p className="mt-1 text-sm font-semibold text-[#c5d4e8]">
							{room?.id ?? "New hostel room"}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#0D2B55]"
						aria-label="Close room modal"
					>
						<X className="size-5" />
					</button>
				</div>

				<div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-5 sm:p-6">
					{isView && room ? (
						<div className="space-y-5">
							<div className="grid gap-3 md:grid-cols-3">
								{[
									["Hostel", room.hostel],
									["Block", room.block],
									["Floor", room.floor],
									["Total Beds", room.beds],
									["Occupied Beds", room.occupied],
									["Available Beds", room.available],
									["Status", room.status],
									["Last Updated", formatDate(room.updatedAt)],
								].map(([label, value]) => (
									<div
										key={label as string}
										className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4"
									>
										<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
											{label as string}
										</p>
										<p className="mt-2 break-words text-sm font-black text-[#0D2B55]">
											{value as ReactNode}
										</p>
									</div>
								))}
							</div>
							<div className="rounded-2xl border border-[#dbe5f1] bg-white p-4">
								<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
									Warden Note
								</p>
								<p className="mt-2 text-sm font-semibold leading-6 text-[#60728f]">
									{room.wardenNote || "No room note has been recorded."}
								</p>
							</div>
						</div>
					) : (
						<div className="grid gap-3 md:grid-cols-2">
							<input
								value={draft.id}
								onChange={(event) => onDraftChange({ ...draft, id: event.target.value })}
								placeholder="Room number, e.g. A101"
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							/>
							<select
								value={draft.hostel}
								onChange={(event) =>
									onDraftChange({ ...draft, hostel: event.target.value })
								}
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							>
								{hostelOptions.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
							<input
								value={draft.block}
								onChange={(event) => onDraftChange({ ...draft, block: event.target.value })}
								placeholder="Block"
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							/>
							<input
								value={draft.floor}
								onChange={(event) => onDraftChange({ ...draft, floor: event.target.value })}
								placeholder="Floor"
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							/>
							<input
								value={draft.beds}
								onChange={(event) => onDraftChange({ ...draft, beds: event.target.value })}
								inputMode="numeric"
								placeholder="Total beds"
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							/>
							<input
								value={draft.available}
								onChange={(event) =>
									onDraftChange({ ...draft, available: event.target.value })
								}
								inputMode="numeric"
								placeholder="Available beds"
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							/>
							<select
								value={draft.status}
								onChange={(event) =>
									onDraftChange({ ...draft, status: event.target.value as RoomStatus })
								}
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							>
								<option value="Available">Available</option>
								<option value="Partial">Partial</option>
								<option value="Full">Full</option>
								<option value="Maintenance">Maintenance</option>
							</select>
							<textarea
								value={draft.wardenNote}
								onChange={(event) =>
									onDraftChange({ ...draft, wardenNote: event.target.value })
								}
								placeholder="Warden note"
								className="min-h-24 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-[#0D2B55] outline-none focus:border-[#2E86C1] md:col-span-2"
							/>
						</div>
					)}

					<div className="sticky bottom-0 mt-5 flex flex-col gap-3 border-t border-[#dbe5f1] bg-white/95 pt-4 backdrop-blur sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={onClose}
							className="inline-flex items-center justify-center rounded-2xl border border-[#dbe5f1] px-5 py-3 text-sm font-black text-[#0D2B55] transition hover:border-[#0D2B55]"
						>
							Close
						</button>
						{isView ? null : (
							<button
								type="button"
								onClick={onSave}
								disabled={!canSave || !draft.id.trim() || !draft.hostel.trim()}
								className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866] disabled:cursor-not-allowed disabled:opacity-50"
							>
								{mode === "create" ? <Plus className="size-4" /> : <Edit3 className="size-4" />}
								{mode === "create" ? "Create room" : "Save room"}
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function AllocationsView() {
	return (
		<SimplePanel
			badge="Student Allocations"
			title="Allocation records"
			description="Track student room assignments and payment-cleared allocations."
		>
			<div className="grid gap-3 md:grid-cols-3">
				{[
					["Ibrahim Fatimah", "Moremi Hall", "Paid"],
					["Adeyemi Blessing", "Queen Hall", "Paid"],
					["Okafor Chidi", "Awolowo Hall", "Review"],
				].map(([student, hostel, status]) => (
					<div key={student} className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
						<p className="font-black text-[#06183A]">{student}</p>
						<p className="mt-1 text-sm font-bold text-[#60728f]">{hostel}</p>
						<span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${getStatusClass(status)}`}>
							{status}
						</span>
					</div>
				))}
			</div>
		</SimplePanel>
	);
}

function HostelModal({
	mode,
	hostel,
	draft,
	canSave,
	onClose,
	onDraftChange,
	onSave,
}: {
	mode: HostelModalMode | null;
	hostel: HostelItem | null;
	draft: HostelDraft;
	canSave: boolean;
	onClose: () => void;
	onDraftChange: (draft: HostelDraft) => void;
	onSave: () => void;
}) {
	if (!mode) {
		return null;
	}

	const isView = mode === "view";
	const title =
		mode === "create" ? "Create hostel" : mode === "edit" ? "Edit hostel" : "Hostel details";

	return (
		<div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
				<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
							Manage Hostel
						</p>
						<h2 className="mt-2 text-xl font-black sm:text-2xl">{title}</h2>
						<p className="mt-1 text-sm font-semibold text-[#c5d4e8]">
							{hostel?.name ?? "New college residence"}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#0D2B55]"
						aria-label="Close hostel modal"
					>
						<X className="size-5" />
					</button>
				</div>

				<div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-5 sm:p-6">
					{isView && hostel ? (
						<div className="space-y-5">
							<div className="grid gap-3 md:grid-cols-3">
								{[
									["Gender", `${hostel.gender} Hostel`],
									["Warden", hostel.warden],
									["Last Updated", formatDate(hostel.updatedAt)],
									["Total Beds", hostel.totalBeds],
									["Available Beds", hostel.availableBeds],
									["Fee", hostel.fee],
								].map(([label, value]) => (
									<div key={label as string} className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
										<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
											{label as string}
										</p>
										<p className="mt-2 break-words text-sm font-black text-[#0D2B55]">
											{value as ReactNode}
										</p>
									</div>
								))}
							</div>
							<div className="rounded-2xl border border-[#dbe5f1] bg-white p-4">
								<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
									Amenities
								</p>
								<div className="mt-3 flex flex-wrap gap-2">
									{hostel.amenities.map((amenity) => (
										<span key={amenity} className="rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-3 py-1 text-xs font-bold text-[#60728f]">
											{amenity}
										</span>
									))}
								</div>
							</div>
						</div>
					) : (
						<div className="grid gap-3 md:grid-cols-2">
							<input
								value={draft.name}
								onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
								placeholder="Hostel name"
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							/>
							<select
								value={draft.gender}
								onChange={(event) => onDraftChange({ ...draft, gender: event.target.value as HostelGender })}
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							>
								{GENDER_OPTIONS.map((option) => (
									<option key={option} value={option}>
										{option} Hostel
									</option>
								))}
							</select>
							<input
								value={draft.warden}
								onChange={(event) => onDraftChange({ ...draft, warden: event.target.value })}
								placeholder="Warden name"
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							/>
							<select
								value={draft.status}
								onChange={(event) => onDraftChange({ ...draft, status: event.target.value as HostelStatus })}
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							>
								{Object.entries(STATUS_LABELS).map(([value, label]) => (
									<option key={value} value={value}>
										{label}
									</option>
								))}
							</select>
							<input
								value={draft.totalBeds}
								onChange={(event) => onDraftChange({ ...draft, totalBeds: event.target.value })}
								inputMode="numeric"
								placeholder="Total beds"
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							/>
							<input
								value={draft.availableBeds}
								onChange={(event) => onDraftChange({ ...draft, availableBeds: event.target.value })}
								inputMode="numeric"
								placeholder="Available beds"
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							/>
							<input
								value={draft.fee}
								onChange={(event) => onDraftChange({ ...draft, fee: event.target.value })}
								placeholder="Fee"
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							/>
							<input
								value={draft.blocks}
								onChange={(event) => onDraftChange({ ...draft, blocks: event.target.value })}
								placeholder="Blocks, comma separated"
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							/>
							<textarea
								value={draft.amenities}
								onChange={(event) => onDraftChange({ ...draft, amenities: event.target.value })}
								placeholder="Amenities, comma separated"
								className="min-h-24 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-[#0D2B55] outline-none focus:border-[#2E86C1] md:col-span-2"
							/>
						</div>
					)}

					<div className="sticky bottom-0 mt-5 flex flex-col gap-3 border-t border-[#dbe5f1] bg-white/95 pt-4 backdrop-blur sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={onClose}
							className="inline-flex items-center justify-center rounded-2xl border border-[#dbe5f1] px-5 py-3 text-sm font-black text-[#0D2B55] transition hover:border-[#0D2B55]"
						>
							Close
						</button>
						{isView ? null : (
							<button
								type="button"
								onClick={onSave}
								disabled={!canSave || !draft.name.trim()}
								className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866] disabled:cursor-not-allowed disabled:opacity-50"
							>
								{mode === "create" ? <Plus className="size-4" /> : <Edit3 className="size-4" />}
								{mode === "create" ? "Create hostel" : "Save hostel"}
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function AdminHostelView({
	hostels,
	collegeName,
	permissions,
	onCreate,
	onView,
	onEdit,
}: {
	hostels: HostelItem[];
	collegeName: string;
	permissions: UserPermissionKey[];
	onCreate: () => void;
	onView: (hostel: HostelItem) => void;
	onEdit: (hostel: HostelItem) => void;
}) {
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<HostelStatus | "all">("all");
	const [gender, setGender] = useState<HostelGender | "all">("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [openActionsId, setOpenActionsId] = useState<string | number | null>(null);
	const canCreate = hasPermissions(permissions, ["hostels.create"], { mode: "any" });
	const canUpdate = hasPermissions(permissions, ["hostels.update"], { mode: "any" });
	const stats = useMemo(
		() => ({
			total: hostels.length,
			available: hostels.filter((hostel) => hostel.status === "available").length,
			beds: hostels.reduce((total, hostel) => total + hostel.availableBeds, 0),
			capacity: hostels.reduce((total, hostel) => total + hostel.totalBeds, 0),
		}),
		[hostels],
	);
	const filteredHostels = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return hostels.filter((hostel) => {
			const haystack = [
				hostel.name,
				hostel.gender,
				hostel.warden,
				hostel.status,
				hostel.fee,
				...hostel.blocks,
				...hostel.amenities,
			]
				.join(" ")
				.toLowerCase();

			return (
				(!normalizedSearch || haystack.includes(normalizedSearch)) &&
				(status === "all" || hostel.status === status) &&
				(gender === "all" || hostel.gender === gender)
			);
		});
	}, [gender, hostels, search, status]);
	const pageCount = Math.max(1, Math.ceil(filteredHostels.length / PAGE_SIZE));
	const safePage = Math.min(currentPage, pageCount);
	const paginatedHostels = filteredHostels.slice(
		(safePage - 1) * PAGE_SIZE,
		safePage * PAGE_SIZE,
	);

	function updateFilter<T>(setter: (value: T) => void, value: T) {
		setter(value);
		setCurrentPage(1);
	}

	function clearFilters() {
		setSearch("");
		setStatus("all");
		setGender("all");
		setCurrentPage(1);
	}

	return (
		<section className="space-y-5">
			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							Hostel Analytics
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							Hostel management table
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#556987]">
							Manage college-scoped hostels for {collegeName}. Create, view, and
							edit residences from the action menu without exposing student
							hostel options to admin users.
						</p>
					</div>
					<button
						type="button"
						onClick={onCreate}
						disabled={!canCreate}
						className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<Plus className="size-4" />
						Create Hostel
					</button>
				</div>

				<div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{[
						["Total Hostels", stats.total],
						["Available Hostels", stats.available],
						["Beds Available", stats.beds],
						["Total Capacity", stats.capacity],
					].map(([label, value]) => (
						<div
							key={label}
							className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4"
						>
							<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
								{label}
							</p>
							<p className="mt-2 text-3xl font-black text-[#0D2B55]">{value}</p>
						</div>
					))}
				</div>
			</div>

			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-4 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
						<Filter className="size-4" />
						Filters
					</div>
					<button
						type="button"
						onClick={clearFilters}
						className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#d3dfed] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
					>
						Reset filters
					</button>
				</div>
				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
					<label className="relative xl:col-span-2">
						<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
						<input
							value={search}
							onChange={(event) => updateFilter(setSearch, event.target.value)}
							placeholder="Search hostel, warden, amenity"
							className="h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] pl-11 pr-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>
					<select
						value={status}
						onChange={(event) =>
							updateFilter(setStatus, event.target.value as HostelStatus | "all")
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="all">All status</option>
						{Object.entries(STATUS_LABELS).map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
					<select
						value={gender}
						onChange={(event) =>
							updateFilter(setGender, event.target.value as HostelGender | "all")
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="all">All hostel types</option>
						{GENDER_OPTIONS.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="overflow-hidden rounded-3xl border border-[#d7e2f0] bg-white shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe5f1] px-4 py-4 sm:px-5">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
							Hostel Table
						</p>
						<p className="mt-1 text-sm font-semibold text-[#60728f]">
							Showing {paginatedHostels.length} of {filteredHostels.length} hostels
						</p>
					</div>
					<div className="flex items-center gap-2 rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-4 py-2 text-xs font-black text-[#0D2B55]">
						Page {safePage} of {pageCount}
					</div>
				</div>

				{filteredHostels.length === 0 ? (
					<div className="p-8 text-center">
						<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eef4fb] text-[#2E86C1]">
							<Building2 className="size-6" />
						</div>
						<h3 className="mt-4 text-lg font-black text-[#06183A]">
							No hostels found
						</h3>
						<p className="mt-2 text-sm text-[#60728f]">
							Adjust the filters or create a college-scoped hostel.
						</p>
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className="min-w-[980px] w-full border-collapse text-left">
								<thead className="bg-[#f8fbff]">
									<tr className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
										<th className="px-5 py-4">Hostel</th>
										<th className="px-5 py-4">Type</th>
										<th className="px-5 py-4">Beds</th>
										<th className="px-5 py-4">Fee</th>
										<th className="px-5 py-4">Status</th>
										<th className="px-5 py-4">Last Updated</th>
										<th className="px-5 py-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[#dbe5f1]">
									{paginatedHostels.map((hostel) => (
										<tr key={hostel.id} className="bg-white transition hover:bg-[#f8fbff]">
											<td className="px-5 py-4">
												<p className="font-black text-[#06183A]">{hostel.name}</p>
												<p className="mt-1 max-w-[18rem] break-words text-sm font-semibold text-[#60728f]">
													{hostel.warden}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-black text-[#0D2B55]">
													{hostel.gender}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-black text-[#0D2B55]">
													{hostel.availableBeds} / {hostel.totalBeds}
												</p>
												<p className="mt-1 text-xs font-bold text-[#60728f]">
													{hostel.blocks.join(", ")}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-black text-[#0D2B55]">{hostel.fee}</p>
											</td>
											<td className="px-5 py-4">
												<span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${getStatusClass(hostel.status)}`}>
													{STATUS_LABELS[hostel.status]}
												</span>
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-bold text-[#60728f]">
													{formatDate(hostel.updatedAt)}
												</p>
											</td>
											<td className="px-5 py-4">
												<RowActionMenu
													label={`Open actions for ${hostel.name}`}
													open={openActionsId === hostel.id}
													onOpenChange={(open) => setOpenActionsId(open ? hostel.id : null)}
													menuClassName="z-[90]"
													items={[
														{
															label: "View",
															icon: <Eye className="size-4" />,
															onSelect: () => {
																onView(hostel);
																setOpenActionsId(null);
															},
														},
														{
															label: "Edit",
															icon: <Edit3 className="size-4" />,
															disabled: !canUpdate,
															className: "text-[#0D2B55] hover:bg-[#eef4fb]",
															onSelect: () => {
																onEdit(hostel);
																setOpenActionsId(null);
															},
														},
													]}
												/>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div className="flex flex-col gap-3 border-t border-[#dbe5f1] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
							<p className="text-sm font-semibold text-[#60728f]">
								Rows per page: {PAGE_SIZE}
							</p>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
									disabled={safePage === 1}
									className="h-10 rounded-2xl border border-[#d3dfed] bg-white px-4 text-sm font-black text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D] disabled:cursor-not-allowed disabled:opacity-40"
								>
									Previous
								</button>
								<button
									type="button"
									onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
									disabled={safePage === pageCount}
									className="h-10 rounded-2xl bg-[#0D2B55] px-4 text-sm font-black text-white transition hover:bg-[#123866] disabled:cursor-not-allowed disabled:opacity-40"
								>
									Next
								</button>
							</div>
						</div>
					</>
				)}
			</div>
		</section>
	);
}

export default function HostelModuleWorkspace({
	permissions,
	collegeName,
	domain,
}: HostelModuleWorkspaceProps) {
	const isStudentDomain = domain === "student";
	const [hostels, setHostels] = useState(INITIAL_HOSTELS);
	const [rooms, setRooms] = useState(INITIAL_ROOMS);
	const [activeView, setActiveView] = useState<HostelView>(
		isStudentDomain ? "dashboard" : "manage",
	);
	const [selectedHostel, setSelectedHostel] = useState<HostelItem | null>(INITIAL_HOSTELS[0]);
	const [modalMode, setModalMode] = useState<HostelModalMode | null>(null);
	const [modalHostel, setModalHostel] = useState<HostelItem | null>(null);
	const [hostelDraft, setHostelDraft] = useState<HostelDraft>(getHostelDraft());
	const [roomModalMode, setRoomModalMode] = useState<RoomModalMode | null>(null);
	const [modalRoom, setModalRoom] = useState<RoomItem | null>(null);
	const [roomDraft, setRoomDraft] = useState<RoomDraft>(getRoomDraft());
	const canManage = useMemo(
		() =>
			!isStudentDomain &&
			(hasPermissions(permissions, ["hostels.create"]) ||
				hasPermissions(permissions, ["hostels.update"]) ||
				hasPermissions(permissions, ["hostels.allocate"])),
		[isStudentDomain, permissions],
	);
	const canSaveHostel =
		modalMode === "create"
			? hasPermissions(permissions, ["hostels.create"], { mode: "any" })
			: hasPermissions(permissions, ["hostels.update"], { mode: "any" });
	const canSaveRoom =
		roomModalMode === "create"
			? hasPermissions(permissions, ["hostels.create"], { mode: "any" })
			: hasPermissions(permissions, ["hostels.update"], { mode: "any" });
	const activeHostel = selectedHostel ?? hostels[0];

	function viewHostel(hostel: HostelItem) {
		setSelectedHostel(hostel);
		setActiveView("details");
	}

	function bookHostel(hostel: HostelItem) {
		setSelectedHostel(hostel);
		setActiveView("booking");
	}

	function openCreateModal() {
		setModalHostel(null);
		setHostelDraft(getHostelDraft());
		setModalMode("create");
	}

	function openHostelModal(hostel: HostelItem, mode: Exclude<HostelModalMode, "create">) {
		setModalHostel(hostel);
		setHostelDraft(getHostelDraft(hostel));
		setModalMode(mode);
	}

	function closeHostelModal() {
		setModalMode(null);
		setModalHostel(null);
	}

	function saveHostel() {
		if (!canSaveHostel || !hostelDraft.name.trim()) {
			return;
		}

		const nextHostel: HostelItem = {
			id: modalHostel?.id ?? `hostel-${Date.now()}`,
			name: hostelDraft.name.trim(),
			gender: hostelDraft.gender,
			warden: hostelDraft.warden.trim() || "Not assigned",
			totalBeds: Number(hostelDraft.totalBeds) || 0,
			availableBeds: Number(hostelDraft.availableBeds) || 0,
			fee: hostelDraft.fee.trim() || "NGN 0",
			blocks: parseCsvList(hostelDraft.blocks),
			amenities: parseCsvList(hostelDraft.amenities),
			status: hostelDraft.status,
			tag: STATUS_LABELS[hostelDraft.status],
			tone: modalHostel?.tone ?? "teal",
			updatedAt: new Date().toISOString(),
		};

		setHostels((current) =>
			modalMode === "create"
				? [...current, nextHostel]
				: current.map((hostel) =>
						hostel.id === nextHostel.id ? nextHostel : hostel,
					),
		);
		setSelectedHostel(nextHostel);
		closeHostelModal();
	}

	function openCreateRoomModal() {
		setModalRoom(null);
		setRoomDraft(getRoomDraft());
		setRoomModalMode("create");
	}

	function openRoomModal(room: RoomItem, mode: Exclude<RoomModalMode, "create">) {
		setModalRoom(room);
		setRoomDraft(getRoomDraft(room));
		setRoomModalMode(mode);
	}

	function closeRoomModal() {
		setRoomModalMode(null);
		setModalRoom(null);
	}

	function saveRoom() {
		if (!canSaveRoom || !roomDraft.id.trim() || !roomDraft.hostel.trim()) {
			return;
		}

		const beds = Math.max(0, Number(roomDraft.beds) || 0);
		const available = Math.min(Math.max(0, Number(roomDraft.available) || 0), beds);
		const status =
			roomDraft.status === "Maintenance"
				? roomDraft.status
				: getRoomStatusFromAvailability(available, beds);
		const nextRoom: RoomItem = {
			id: roomDraft.id.trim().toUpperCase(),
			hostel: roomDraft.hostel.trim(),
			block: roomDraft.block.trim() || "Unassigned block",
			floor: roomDraft.floor.trim() || "Unassigned floor",
			beds,
			available,
			occupied: Math.max(0, beds - available),
			status,
			wardenNote: roomDraft.wardenNote.trim(),
			updatedAt: new Date().toISOString(),
		};

		setRooms((current) =>
			roomModalMode === "create"
				? [...current, nextRoom]
				: current.map((room) => (room.id === modalRoom?.id ? nextRoom : room)),
		);
		closeRoomModal();
	}

	function renderView() {
		if (!isStudentDomain && activeView === "manage") {
			return (
				<AdminHostelView
					hostels={hostels}
					collegeName={collegeName}
					permissions={permissions}
					onCreate={openCreateModal}
					onView={(hostel) => openHostelModal(hostel, "view")}
					onEdit={(hostel) => openHostelModal(hostel, "edit")}
				/>
			);
		}

		if (!isStudentDomain && activeView === "rooms") {
			return (
				<RoomsView
					rooms={rooms}
					hostels={hostels}
					permissions={permissions}
					onCreate={openCreateRoomModal}
					onView={(room) => openRoomModal(room, "view")}
					onEdit={(room) => openRoomModal(room, "edit")}
				/>
			);
		}

		if (!isStudentDomain && activeView === "allocations") {
			return <AllocationsView />;
		}

		if (activeView === "browse") {
			return <BrowseView hostels={hostels} onView={viewHostel} onBook={bookHostel} />;
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
					hostels={hostels}
					onChooseHostel={bookHostel}
				/>
			);
		}

		if (activeView === "allocation") return <AllocationView />;
		if (activeView === "payment") return <PaymentView />;
		if (activeView === "maintenance") return <MaintenanceView />;

		return (
			<DashboardView
				collegeName={collegeName}
				hostels={hostels}
				onApply={() => setActiveView("booking")}
				onBrowse={() => setActiveView("browse")}
				onView={viewHostel}
				onBook={bookHostel}
			/>
		);
	}

	return (
		<div className="rounded-[1.5rem] border border-[#dbe5f1] bg-white p-3 shadow-sm sm:p-4 xl:p-5">
			<div className="space-y-5">
				<HostelTabs
					activeView={activeView}
					permissions={permissions}
					domain={domain}
					onSelect={(view) => {
						setActiveView(view);
						if (view === "booking") {
							setSelectedHostel(null);
						}
					}}
				/>

				<main className="min-w-0">{renderView()}</main>
			</div>

			{!canManage ? null : (
				<p className="mt-4 text-xs text-[#6b7d97]">
					Admin controls shown in this hostel module are based on current role
					permissions.
				</p>
			)}

			<HostelModal
				mode={modalMode}
				hostel={modalHostel}
				draft={hostelDraft}
				canSave={canSaveHostel}
				onClose={closeHostelModal}
				onDraftChange={setHostelDraft}
				onSave={saveHostel}
			/>
			<RoomModal
				mode={roomModalMode}
				room={modalRoom}
				draft={roomDraft}
				hostels={hostels}
				canSave={canSaveRoom}
				onClose={closeRoomModal}
				onDraftChange={setRoomDraft}
				onSave={saveRoom}
			/>
		</div>
	);
}
