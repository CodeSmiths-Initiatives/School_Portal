"use client";

import {
	ArrowRight,
	BedDouble,
	Building2,
	CreditCard,
	Download,
	DoorOpen,
	Edit3,
	Eye,
	Filter,
	Home,
	Plus,
	Printer,
	ReceiptText,
	Search,
	ShieldCheck,
	Wrench,
	X,
} from "lucide-react";
import {
	useEffect,
	useMemo,
	useRef,
	useState,
	type ElementType,
	type ReactNode,
} from "react";
import { RowActionMenu } from "@/components/ui/row-action-menu";
import type { DashboardDomain } from "@/lib/auth";
import {
	hasPermissions,
	type PermissionKey,
	type UserPermissionKey,
} from "@/lib/rbac";
import {
	createHostelComplaintRecord,
	createHostelRecord,
	createHostelRoomRecord,
	initializeHostelPayment,
	loadHostelData,
	reserveHostelBedRecord,
	resumeHostelPaystackPayment,
	updateHostelRecord,
	updateHostelRoomRecord,
	updateHostelComplaintRecord,
	verifyHostelPayment,
} from "@/features/college-modules/services/hostel.client";
import type { HostelPayload } from "@/lib/services/hostel.service";

type HostelModuleWorkspaceProps = {
	permissions: UserPermissionKey[];
	collegeName: string;
	collegeSlug: string;
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
type AllocationModalMode = "create" | "view" | "edit";
type AllocationStatus = "Pending" | "Allocated" | "Paid" | "Review" | "Cancelled";
type MaintenanceModalMode = "view" | "manage";
type MaintenanceStatus = "Open" | "In Progress" | "Resolved" | "Escalated";
type MaintenancePriority = "Low" | "Medium" | "High" | "Critical";
type HostelPaymentStatus = "Paid" | "Pending" | "Review" | "Failed";
type HostelInvoiceStatus = "Issued" | "Paid" | "Overdue" | "Voided";

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
	recordId?: string;
	hostel: string;
	block: string;
	floor: string;
	beds: number;
	available: number;
	occupied: number;
	status: RoomStatus;
	wardenNote: string;
	updatedAt: string;
	bedIdsByLabel?: Record<string, string>;
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

type AllocationItem = {
	id: string;
	studentName: string;
	matricNo: string;
	level: string;
	gender: HostelGender;
	hostel: string;
	room: string;
	bed: string;
	paymentStatus: "Paid" | "Pending" | "Review";
	status: AllocationStatus;
	allocatedBy: string;
	updatedAt: string;
	note: string;
};

type AllocationDraft = {
	studentName: string;
	matricNo: string;
	level: string;
	gender: HostelGender;
	hostel: string;
	room: string;
	bed: string;
	paymentStatus: AllocationItem["paymentStatus"];
	status: AllocationStatus;
	allocatedBy: string;
	note: string;
};

type MaintenanceRequestItem = {
	id: string;
	studentName: string;
	matricNo: string;
	hostel: string;
	room: string;
	bed: string;
	category: string;
	issue: string;
	description: string;
	priority: MaintenancePriority;
	status: MaintenanceStatus;
	assignedTo: string;
	reportedAt: string;
	updatedAt: string;
	resolutionNote: string;
};

type MaintenanceRequestDraft = {
	status: MaintenanceStatus;
	priority: MaintenancePriority;
	assignedTo: string;
	resolutionNote: string;
};

type HostelPaymentRecord = {
	id: string;
	invoiceNo: string;
	reference: string;
	studentName: string;
	matricNo: string;
	level: string;
	hostel: string;
	room: string;
	bed: string;
	amount: number;
	currency: "NGN";
	paymentStatus: HostelPaymentStatus;
	invoiceStatus: HostelInvoiceStatus;
	channel: "Card" | "Bank Transfer" | "USSD" | "Manual Review";
	issuedAt: string;
	paidAt?: string;
	updatedAt: string;
	verifiedBy: string;
	note: string;
};

type StudentMaintenanceDraft = {
	category: string;
	issue: string;
	description: string;
	priority: MaintenancePriority;
};

type HostelMenuItem = {
	label: string;
	view: HostelView;
	icon: ElementType;
	requiredPermissions?: PermissionKey[];
};

const PAGE_SIZE = 20;

const BOOKING_STEPS = [
	{
		title: "Choose hostel",
		description: "Review available halls and select the preferred hostel.",
		icon: Home,
	},
	{
		title: "Book a bed",
		description: "Pick from available rooms and reserve the bed space.",
		icon: BedDouble,
	},
	{
		title: "Pay hostel fee",
		description: "Pay the accommodation fee after the bed is reserved.",
		icon: ReceiptText,
	},
	{
		title: "Raise maintenance",
		description: "Report room issues after allocation when support is needed.",
		icon: Wrench,
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
	{ label: "Dashboard", view: "dashboard", icon: Building2 },
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
	{
		label: "Payment",
		view: "payment",
		icon: CreditCard,
		requiredPermissions: ["hostels.view"],
	},
	{
		label: "Maintenance",
		view: "maintenance",
		icon: Wrench,
		requiredPermissions: ["hostels.view"],
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

const INITIAL_ALLOCATIONS: AllocationItem[] = [
	{
		id: "alloc-001",
		studentName: "Ibrahim Fatimah",
		matricNo: "KASU/ND/25/0142",
		level: "ND 1",
		gender: "Female",
		hostel: "Moremi Hall",
		room: "A101",
		bed: "Bed 3",
		paymentStatus: "Paid",
		status: "Allocated",
		allocatedBy: "Mrs. Grace Bello",
		updatedAt: "2026-01-16T10:35:00.000Z",
		note: "Payment verified and student checked in.",
	},
	{
		id: "alloc-002",
		studentName: "Adeyemi Blessing",
		matricNo: "KASU/HND/25/0088",
		level: "HND 1",
		gender: "Female",
		hostel: "Queen Hall",
		room: "C201",
		bed: "Bed 1",
		paymentStatus: "Review",
		status: "Review",
		allocatedBy: "Hostel Admin",
		updatedAt: "2026-01-15T12:10:00.000Z",
		note: "Awaiting final warden room readiness confirmation.",
	},
	{
		id: "alloc-003",
		studentName: "Okafor Chidi",
		matricNo: "KASU/ND/25/0231",
		level: "ND 2",
		gender: "Male",
		hostel: "Awolowo Hall",
		room: "B101",
		bed: "Bed 2",
		paymentStatus: "Paid",
		status: "Paid",
		allocatedBy: "Mr. Aminu Ibrahim",
		updatedAt: "2026-01-14T09:45:00.000Z",
		note: "Bed assigned after successful hostel fee payment.",
	},
	{
		id: "alloc-004",
		studentName: "Salihu Musa",
		matricNo: "KASU/ND/25/0305",
		level: "ND 1",
		gender: "Male",
		hostel: "Awolowo Hall",
		room: "B102",
		bed: "Bed 4",
		paymentStatus: "Pending",
		status: "Pending",
		allocatedBy: "Hostel Admin",
		updatedAt: "2026-01-13T15:20:00.000Z",
		note: "Pending payment clearance before check-in.",
	},
];

const INITIAL_MAINTENANCE_REQUESTS: MaintenanceRequestItem[] = [
	{
		id: "mnt-001",
		studentName: "Ibrahim Fatimah",
		matricNo: "KASU/ND/25/0142",
		hostel: "Moremi Hall",
		room: "A101",
		bed: "Bed 3",
		category: "Door and security",
		issue: "Broken door lock",
		description:
			"The door lock is loose and does not close properly after evening roll call.",
		priority: "High",
		status: "In Progress",
		assignedTo: "Maintenance Desk",
		reportedAt: "2026-01-16T08:20:00.000Z",
		updatedAt: "2026-01-16T11:05:00.000Z",
		resolutionNote: "Technician assigned; replacement lock requested from store.",
	},
	{
		id: "mnt-002",
		studentName: "Adeyemi Blessing",
		matricNo: "KASU/HND/25/0088",
		hostel: "Queen Hall",
		room: "C201",
		bed: "Bed 1",
		category: "Plumbing",
		issue: "Leaking bathroom ceiling",
		description:
			"Water drops from the bathroom ceiling after morning water pumping.",
		priority: "Critical",
		status: "Escalated",
		assignedTo: "Works Unit",
		reportedAt: "2026-01-15T07:40:00.000Z",
		updatedAt: "2026-01-15T13:15:00.000Z",
		resolutionNote: "Escalated because the room is already marked for readiness review.",
	},
	{
		id: "mnt-003",
		studentName: "Okafor Chidi",
		matricNo: "KASU/ND/25/0231",
		hostel: "Awolowo Hall",
		room: "B101",
		bed: "Bed 2",
		category: "Electrical",
		issue: "Faulty wall socket",
		description: "The socket beside bed 2 sparks when a charger is plugged in.",
		priority: "Medium",
		status: "Resolved",
		assignedTo: "Electrical Unit",
		reportedAt: "2026-01-14T10:10:00.000Z",
		updatedAt: "2026-01-14T16:25:00.000Z",
		resolutionNote: "Socket replaced and tested by the electrical unit.",
	},
	{
		id: "mnt-004",
		studentName: "Salihu Musa",
		matricNo: "KASU/ND/25/0305",
		hostel: "Awolowo Hall",
		room: "B102",
		bed: "Bed 4",
		category: "Furniture",
		issue: "Damaged reading chair",
		description: "The reading chair assigned to bed 4 has a cracked support leg.",
		priority: "Low",
		status: "Open",
		assignedTo: "Unassigned",
		reportedAt: "2026-01-13T18:45:00.000Z",
		updatedAt: "2026-01-13T18:45:00.000Z",
		resolutionNote: "",
	},
];

const INITIAL_HOSTEL_PAYMENTS: HostelPaymentRecord[] = [
	{
		id: "hst-pay-001",
		invoiceNo: "HST-2026-0001",
		reference: "HST-KASU-0142-250116",
		studentName: "Ibrahim Fatimah",
		matricNo: "KASU/ND/25/0142",
		level: "ND 1",
		hostel: "Moremi Hall",
		room: "A101",
		bed: "Bed 3",
		amount: 45000,
		currency: "NGN",
		paymentStatus: "Paid",
		invoiceStatus: "Paid",
		channel: "Card",
		issuedAt: "2026-01-15T08:05:00.000Z",
		paidAt: "2026-01-16T09:50:00.000Z",
		updatedAt: "2026-01-16T10:20:00.000Z",
		verifiedBy: "Hostel Admin",
		note: "Payment verified before allocation confirmation.",
	},
	{
		id: "hst-pay-002",
		invoiceNo: "HST-2026-0002",
		reference: "HST-KASU-0088-250115",
		studentName: "Adeyemi Blessing",
		matricNo: "KASU/HND/25/0088",
		level: "HND 1",
		hostel: "Queen Hall",
		room: "C201",
		bed: "Bed 1",
		amount: 45000,
		currency: "NGN",
		paymentStatus: "Review",
		invoiceStatus: "Issued",
		channel: "Bank Transfer",
		issuedAt: "2026-01-15T08:35:00.000Z",
		updatedAt: "2026-01-15T12:10:00.000Z",
		verifiedBy: "Finance Desk",
		note: "Student uploaded transfer evidence; awaiting finance confirmation.",
	},
	{
		id: "hst-pay-003",
		invoiceNo: "HST-2026-0003",
		reference: "HST-KASU-0231-250114",
		studentName: "Okafor Chidi",
		matricNo: "KASU/ND/25/0231",
		level: "ND 2",
		hostel: "Awolowo Hall",
		room: "B101",
		bed: "Bed 2",
		amount: 45000,
		currency: "NGN",
		paymentStatus: "Paid",
		invoiceStatus: "Paid",
		channel: "USSD",
		issuedAt: "2026-01-13T16:30:00.000Z",
		paidAt: "2026-01-14T08:25:00.000Z",
		updatedAt: "2026-01-14T09:40:00.000Z",
		verifiedBy: "Mr. Aminu Ibrahim",
		note: "Gateway confirmation matched the hostel invoice reference.",
	},
	{
		id: "hst-pay-004",
		invoiceNo: "HST-2026-0004",
		reference: "HST-KASU-0305-250113",
		studentName: "Salihu Musa",
		matricNo: "KASU/ND/25/0305",
		level: "ND 1",
		hostel: "Awolowo Hall",
		room: "B102",
		bed: "Bed 4",
		amount: 45000,
		currency: "NGN",
		paymentStatus: "Pending",
		invoiceStatus: "Overdue",
		channel: "Manual Review",
		issuedAt: "2026-01-12T14:10:00.000Z",
		updatedAt: "2026-01-13T15:20:00.000Z",
		verifiedBy: "Not verified",
		note: "Allocation remains pending until hostel fee payment is cleared.",
	},
	{
		id: "hst-pay-005",
		invoiceNo: "HST-2026-0005",
		reference: "HST-KASU-0417-250112",
		studentName: "Nwachukwu Ada",
		matricNo: "KASU/HND/25/0417",
		level: "HND 2",
		hostel: "Moremi Hall",
		room: "A103",
		bed: "Bed 1",
		amount: 45000,
		currency: "NGN",
		paymentStatus: "Failed",
		invoiceStatus: "Issued",
		channel: "Card",
		issuedAt: "2026-01-12T10:05:00.000Z",
		updatedAt: "2026-01-12T10:12:00.000Z",
		verifiedBy: "Gateway",
		note: "Card attempt failed; student can retry payment before allocation.",
	},
];

void [
	INITIAL_HOSTELS,
	INITIAL_ROOMS,
	INITIAL_ALLOCATIONS,
	INITIAL_MAINTENANCE_REQUESTS,
	INITIAL_HOSTEL_PAYMENTS,
];

const STATUS_LABELS: Record<HostelStatus, string> = {
	available: "Available",
	filling: "Filling",
	full: "Full",
	maintenance: "Maintenance",
};

const GENDER_OPTIONS: HostelGender[] = ["Female", "Male", "Mixed"];
const ALLOCATION_STATUSES: AllocationStatus[] = [
	"Pending",
	"Allocated",
	"Paid",
	"Review",
	"Cancelled",
];
const PAYMENT_STATUSES: AllocationItem["paymentStatus"][] = [
	"Pending",
	"Paid",
	"Review",
];
const MAINTENANCE_STATUSES: MaintenanceStatus[] = [
	"Open",
	"In Progress",
	"Resolved",
	"Escalated",
];
const MAINTENANCE_PRIORITIES: MaintenancePriority[] = [
	"Low",
	"Medium",
	"High",
	"Critical",
];
const HOSTEL_PAYMENT_STATUSES: HostelPaymentStatus[] = [
	"Pending",
	"Review",
	"Paid",
	"Failed",
];
const HOSTEL_INVOICE_STATUSES: HostelInvoiceStatus[] = [
	"Issued",
	"Paid",
	"Overdue",
	"Voided",
];

function getHostelToneClass(tone: HostelItem["tone"]) {
	if (tone === "rose") return "bg-[#d92672]";
	if (tone === "teal") return "bg-[#089985]";
	return "bg-[#4a5d78]";
}

function getStatusClass(status: HostelStatus | string) {
	const normalized = status.toLowerCase();
	if (normalized === "available") return "border-emerald-200 bg-emerald-50 text-emerald-700";
	if (normalized === "allocated" || normalized === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-700";
	if (normalized === "resolved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
	if (normalized === "filling" || normalized === "partial") return "border-amber-200 bg-amber-50 text-amber-700";
	if (normalized === "pending" || normalized === "review") return "border-amber-200 bg-amber-50 text-amber-700";
	if (normalized === "open" || normalized === "in progress") return "border-amber-200 bg-amber-50 text-amber-700";
	if (normalized === "full") return "border-red-200 bg-red-50 text-red-700";
	if (normalized === "cancelled") return "border-red-200 bg-red-50 text-red-700";
	if (normalized === "failed" || normalized === "overdue" || normalized === "voided") return "border-red-200 bg-red-50 text-red-700";
	if (normalized === "escalated" || normalized === "critical") return "border-red-200 bg-red-50 text-red-700";
	if (normalized === "maintenance") return "border-sky-200 bg-sky-50 text-sky-700";
	if (normalized === "high") return "border-orange-200 bg-orange-50 text-orange-700";
	if (normalized === "medium") return "border-sky-200 bg-sky-50 text-sky-700";
	if (normalized === "low") return "border-slate-200 bg-slate-50 text-slate-700";
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

function formatCurrency(amount: number, currency = "NGN") {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency,
		maximumFractionDigits: 0,
	}).format(amount);
}

function escapeCsvValue(value: string | number | undefined) {
	const text = String(value ?? "");
	return `"${text.replaceAll('"', '""')}"`;
}

function escapeHtml(value: string | number | undefined) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function exportHostelPaymentCsv(payment: HostelPaymentRecord) {
	const rows = [
		[
			"Invoice No",
			"Reference",
			"Student",
			"Matric No",
			"Hostel",
			"Room",
			"Bed",
			"Amount",
			"Payment Status",
			"Invoice Status",
			"Channel",
			"Issued At",
			"Paid At",
			"Verified By",
		],
		[
			payment.invoiceNo,
			payment.reference,
			payment.studentName,
			payment.matricNo,
			payment.hostel,
			payment.room,
			payment.bed,
			formatCurrency(payment.amount, payment.currency),
			payment.paymentStatus,
			payment.invoiceStatus,
			payment.channel,
			formatDate(payment.issuedAt),
			payment.paidAt ? formatDate(payment.paidAt) : "Not paid",
			payment.verifiedBy,
		],
	];
	const csv = rows
		.map((row) => row.map((value) => escapeCsvValue(value)).join(","))
		.join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `${payment.invoiceNo.toLowerCase()}-hostel-payment.csv`;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

function printHostelPaymentInvoice(payment: HostelPaymentRecord) {
	const printWindow = window.open("", "_blank", "width=900,height=700");

	if (!printWindow) {
		return;
	}

	printWindow.document.write(`
		<!doctype html>
		<html>
			<head>
				<title>${escapeHtml(payment.invoiceNo)} Hostel Invoice</title>
				<style>
					body { font-family: Arial, sans-serif; color: #06183A; margin: 32px; }
					.header { border-bottom: 2px solid #0D2B55; padding-bottom: 16px; margin-bottom: 24px; }
					.badge { color: #B7770D; font-size: 11px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; }
					h1 { margin: 8px 0 0; font-size: 28px; }
					.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
					.card { border: 1px solid #dbe5f1; border-radius: 14px; padding: 14px; }
					.label { color: #8395AF; font-size: 10px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; }
					.value { margin-top: 6px; font-size: 14px; font-weight: 800; }
					.amount { font-size: 30px; color: #0D2B55; }
					.note { margin-top: 20px; border-top: 1px solid #dbe5f1; padding-top: 16px; color: #60728f; line-height: 1.6; }
					@media print { body { margin: 24px; } }
				</style>
			</head>
			<body>
				<div class="header">
					<div class="badge">Hostel Payment Invoice</div>
					<h1>${escapeHtml(payment.invoiceNo)}</h1>
					<p>${escapeHtml(payment.reference)}</p>
				</div>
				<div class="grid">
					<div class="card"><div class="label">Student</div><div class="value">${escapeHtml(payment.studentName)}</div></div>
					<div class="card"><div class="label">Matric No</div><div class="value">${escapeHtml(payment.matricNo)}</div></div>
					<div class="card"><div class="label">Hostel</div><div class="value">${escapeHtml(payment.hostel)}</div></div>
					<div class="card"><div class="label">Room / Bed</div><div class="value">${escapeHtml(payment.room)} / ${escapeHtml(payment.bed)}</div></div>
					<div class="card"><div class="label">Payment Status</div><div class="value">${escapeHtml(payment.paymentStatus)}</div></div>
					<div class="card"><div class="label">Invoice Status</div><div class="value">${escapeHtml(payment.invoiceStatus)}</div></div>
					<div class="card"><div class="label">Channel</div><div class="value">${escapeHtml(payment.channel)}</div></div>
					<div class="card"><div class="label">Verified By</div><div class="value">${escapeHtml(payment.verifiedBy)}</div></div>
					<div class="card"><div class="label">Issued</div><div class="value">${escapeHtml(formatDate(payment.issuedAt))}</div></div>
					<div class="card"><div class="label">Paid</div><div class="value">${escapeHtml(payment.paidAt ? formatDate(payment.paidAt) : "Not paid")}</div></div>
					<div class="card"><div class="label">Amount</div><div class="value amount">${escapeHtml(formatCurrency(payment.amount, payment.currency))}</div></div>
				</div>
				<div class="note">${escapeHtml(payment.note || "No payment note recorded.")}</div>
				<script>
					window.addEventListener("load", () => {
						window.print();
						window.close();
					});
				</script>
			</body>
		</html>
	`);
	printWindow.document.close();
}

function statusFromLiveHostel(status: string, availableBeds: number): HostelStatus {
	if (status === "maintenance") return "maintenance";
	if (availableBeds <= 0) return "full";
	if (availableBeds < 10) return "filling";
	return "available";
}

function mapLiveHostel(hostel: HostelPayload["hostels"][number]): HostelItem {
	return {
		id: hostel.id,
		name: hostel.name,
		gender: hostel.gender,
		warden: hostel.warden || "Not assigned",
		totalBeds: hostel.totalBeds,
		availableBeds: hostel.availableBeds,
		fee: formatCurrency(hostel.fee, hostel.currency),
		blocks: [],
		amenities: hostel.amenities,
		status: statusFromLiveHostel(hostel.status, hostel.availableBeds),
		tag: hostel.availableBeds > 0 ? "Book Now" : "Full",
		tone: hostel.gender === "Female" ? "rose" : hostel.gender === "Male" ? "teal" : "slate",
		updatedAt: hostel.updatedAt || new Date().toISOString(),
	};
}

function mapLiveRoom(room: HostelPayload["rooms"][number]): RoomItem {
	const status: RoomStatus =
		room.status === "maintenance"
			? "Maintenance"
			: room.available === 0
				? "Full"
				: room.available === room.capacity
					? "Available"
					: "Partial";

	return {
		id: room.roomNumber,
		recordId: room.id,
		hostel: room.hostelName,
		block: room.block || "Unassigned block",
		floor: room.floor || "Unassigned floor",
		beds: room.capacity || room.beds.length,
		available: room.available,
		occupied: room.occupied,
		status,
		wardenNote: room.wardenNote,
		updatedAt: room.updatedAt || new Date().toISOString(),
		bedIdsByLabel: Object.fromEntries(
			room.beds
				.filter((bed) => bed.status === "available")
				.map((bed) => [bed.label, bed.id]),
		),
	};
}

function mapLiveAllocation(allocation: HostelPayload["allocations"][number]): AllocationItem {
	return {
		id: allocation.id,
		studentName: allocation.studentName,
		matricNo: allocation.studentIdentifier || allocation.studentEmail || "Student Profile",
		level: allocation.level || "Current Level",
		gender: "Mixed",
		hostel: allocation.hostelName,
		room: allocation.roomNumber,
		bed: allocation.bedLabel,
		paymentStatus:
			allocation.paymentStatus === "paid"
				? "Paid"
				: allocation.paymentStatus === "review"
					? "Review"
					: "Pending",
		status:
			allocation.status === "allocated"
				? "Allocated"
				: allocation.status === "cancelled"
					? "Cancelled"
					: "Pending",
		allocatedBy: allocation.allocatedBy || "Student self-service",
		updatedAt: allocation.updatedAt || new Date().toISOString(),
		note: allocation.note,
	};
}

function mapLiveComplaint(complaint: HostelPayload["complaints"][number]): MaintenanceRequestItem {
	return {
		id: complaint.id,
		studentName: complaint.studentName || "Student",
		matricNo: complaint.studentIdentifier || "Student Profile",
		hostel: complaint.hostelName,
		room: complaint.roomNumber,
		bed: complaint.bedLabel,
		category: complaint.category,
		issue: complaint.issue,
		description: complaint.description,
		priority: complaint.priority,
		status: complaint.status,
		assignedTo: complaint.assignedTo || "Maintenance Desk",
		reportedAt: complaint.createdAt || complaint.updatedAt || new Date().toISOString(),
		updatedAt: complaint.updatedAt || new Date().toISOString(),
		resolutionNote: complaint.resolutionNote,
	};
}

function mapLivePayment(allocation: HostelPayload["allocations"][number]): HostelPaymentRecord {
	return {
		id: allocation.invoiceNumber || allocation.id,
		invoiceNo: allocation.invoiceNumber || "Hostel invoice",
		reference: allocation.allocationNumber,
		studentName: allocation.studentName,
		matricNo: allocation.studentIdentifier || allocation.studentEmail || "Student Profile",
		level: allocation.level || "Current Level",
		hostel: allocation.hostelName,
		room: allocation.roomNumber,
		bed: allocation.bedLabel,
		amount: allocation.amount,
		currency: "NGN",
		paymentStatus:
			allocation.paymentStatus === "paid"
				? "Paid"
				: allocation.paymentStatus === "failed"
					? "Failed"
					: allocation.paymentStatus === "review"
						? "Review"
						: "Pending",
		invoiceStatus: allocation.invoiceStatus === "paid" ? "Paid" : "Issued",
		channel: "Card",
		issuedAt: allocation.updatedAt || new Date().toISOString(),
		paidAt: allocation.paymentStatus === "paid" ? allocation.updatedAt : undefined,
		updatedAt: allocation.updatedAt || new Date().toISOString(),
		verifiedBy: allocation.paymentStatus === "paid" ? "Gateway" : "Not verified",
		note: allocation.note,
	};
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
		hostel: room?.hostel ?? "",
		block: room?.block ?? "",
		floor: room?.floor ?? "",
		beds: room ? String(room.beds) : "",
		available: room ? String(room.available) : "",
		status: room?.status ?? "Available",
		wardenNote: room?.wardenNote ?? "",
	};
}

function getAllocationDraft(allocation?: AllocationItem | null): AllocationDraft {
	return {
		studentName: allocation?.studentName ?? "",
		matricNo: allocation?.matricNo ?? "",
		level: allocation?.level ?? "ND 1",
		gender: allocation?.gender ?? "Female",
		hostel: allocation?.hostel ?? "",
		room: allocation?.room ?? "",
		bed: allocation?.bed ?? "",
		paymentStatus: allocation?.paymentStatus ?? "Pending",
		status: allocation?.status ?? "Pending",
		allocatedBy: allocation?.allocatedBy ?? "",
		note: allocation?.note ?? "",
	};
}

function getMaintenanceDraft(
	request?: MaintenanceRequestItem | null,
): MaintenanceRequestDraft {
	return {
		status: request?.status ?? "Open",
		priority: request?.priority ?? "Medium",
		assignedTo: request?.assignedTo ?? "",
		resolutionNote: request?.resolutionNote ?? "",
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
						View Data
					</button>
					<button
						type="button"
						disabled={!canBook}
						onClick={() => onBook(hostel)}
						className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0f9d6a] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b8158] disabled:cursor-not-allowed disabled:bg-[#a6d9c4]"
					>
						<BedDouble className="size-4" />
						{canBook ? "Book Hostel" : "Full"}
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
	onMaintenance,
}: {
	collegeName: string;
	hostels: HostelItem[];
	onApply: () => void;
	onBrowse: () => void;
	onView: (hostel: HostelItem) => void;
	onBook: (hostel: HostelItem) => void;
	onMaintenance: () => void;
}) {
	const [listView, setListView] = useState<"table" | "cards">("table");
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<HostelStatus | "all">("all");
	const [gender, setGender] = useState<HostelGender | "all">("all");
	const [openActionsId, setOpenActionsId] = useState<string | number | null>(null);
	const stats = useMemo(
		() => ({
			totalHostels: hostels.length,
			bookableHostels: hostels.filter((hostel) => hostel.status !== "full").length,
			availableBeds: hostels.reduce((total, hostel) => total + hostel.availableBeds, 0),
			totalBeds: hostels.reduce((total, hostel) => total + hostel.totalBeds, 0),
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

	function clearFilters() {
		setSearch("");
		setStatus("all");
		setGender("all");
	}

	return (
		<section className="space-y-5">
			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							Hostel Analytics
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							Student hostel dashboard
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#556987]">
							Review {collegeName} hostel options, confirm available beds, book
							a bed space, pay the hostel fee, and raise a maintenance request
							when residence support is needed.
						</p>
					</div>
					<div className="flex flex-col gap-2 sm:flex-row">
						<button
							type="button"
							onClick={onApply}
							className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866]"
						>
							<BedDouble className="size-4" />
							Book Bed
						</button>
					</div>
				</div>

				<div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{[
						["Total Hostels", stats.totalHostels],
						["Bookable Hostels", stats.bookableHostels],
						["Beds Available", stats.availableBeds],
						["Total Capacity", stats.totalBeds],
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
					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={clearFilters}
							className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#d3dfed] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
						>
							Reset filters
						</button>
					</div>
				</div>
				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
					<label className="relative xl:col-span-2">
						<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
						<input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search hostel, warden, block, or amenity"
							className="h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] pl-11 pr-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>
					<select
						value={status}
						onChange={(event) => setStatus(event.target.value as HostelStatus | "all")}
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
						onChange={(event) => setGender(event.target.value as HostelGender | "all")}
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

			<div className="rounded-3xl border border-[#d7e2f0] bg-white shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe5f1] px-4 py-4 sm:px-5">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
							Hostel Options
						</p>
						<p className="mt-1 text-sm font-semibold text-[#60728f]">
							Showing {filteredHostels.length} of {hostels.length} hostels
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<div
							className="inline-flex rounded-2xl border border-[#d3dfed] bg-[#f8fbff] p-1"
							role="tablist"
							aria-label="Hostel result views"
						>
							{[
								["table", "Responsive Table"],
								["cards", "Hostel Cards"],
							].map(([value, label]) => (
								<button
									key={value}
									type="button"
									role="tab"
									aria-selected={listView === value}
									onClick={() => setListView(value as "table" | "cards")}
									className={`h-10 rounded-xl px-4 text-xs font-black uppercase tracking-[0.12em] transition ${
										listView === value
											? "bg-[#0D2B55] text-white shadow-sm"
											: "text-[#60728f] hover:text-[#0D2B55]"
									}`}
								>
									{label}
								</button>
							))}
						</div>
						<button
							type="button"
							onClick={onMaintenance}
							className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-black text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
						>
							<Wrench className="size-4" />
							Maintenance
						</button>
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
							Adjust the filters to find an available bed space.
						</p>
					</div>
				) : listView === "table" ? (
					<div role="tabpanel" className="overflow-x-auto">
						<table className="min-w-[980px] w-full border-collapse text-left">
							<thead className="bg-[#f8fbff]">
								<tr className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
									<th className="px-5 py-4">Hostel</th>
									<th className="px-5 py-4">Type</th>
									<th className="px-5 py-4">Availability</th>
									<th className="px-5 py-4">Fee</th>
									<th className="px-5 py-4">Status</th>
									<th className="px-5 py-4">Updated</th>
									<th className="px-5 py-4 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-[#dbe5f1]">
								{filteredHostels.map((hostel) => (
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
												{hostel.availableBeds} / {hostel.totalBeds} beds
											</p>
											<p className="mt-1 max-w-[16rem] truncate text-xs font-bold text-[#60728f]">
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
										<td className="px-5 py-4 text-right">
											<RowActionMenu
												label={`Open actions for ${hostel.name}`}
												open={openActionsId === hostel.id}
												onOpenChange={(open) => setOpenActionsId(open ? hostel.id : null)}
												menuClassName="z-[999]"
												width={216}
												items={[
													{
														label: "View Data",
														icon: <Eye className="size-4" />,
														onSelect: () => {
															onView(hostel);
															setOpenActionsId(null);
														},
													},
													{
														label: "Book Hostel",
														icon: <BedDouble className="size-4" />,
														disabled: hostel.status === "full",
														onSelect: () => {
															onBook(hostel);
															setOpenActionsId(null);
														},
													},
													{
														label: "Maintenance",
														icon: <Wrench className="size-4" />,
														onSelect: () => {
															onMaintenance();
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
				) : (
					<div role="tabpanel" className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
						{filteredHostels.map((hostel) => (
							<HostelCard
								key={hostel.id}
								hostel={hostel}
								onView={onView}
								onBook={onBook}
							/>
						))}
					</div>
				)}
			</div>

			<div>
				<h3 className="mb-3 text-sm font-bold text-[#0D2B55]">
					Hostel Booking Flow
				</h3>
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{BOOKING_STEPS.map((step, index) => (
						<BookingStepCard key={step.title} step={step} index={index} />
					))}
				</div>
			</div>

			<div className="rounded-2xl border border-[#f0cb7c] bg-[#fff8e8] p-4">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex items-start gap-3">
						<div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#B7770D]">
							<DoorOpen className="size-5" />
						</div>
						<div>
							<p className="text-sm font-bold text-[#7a4a00]">
								Bed space booking is open for 2026/2027
							</p>
							<p className="mt-1 text-sm leading-relaxed text-[#8a650d]">
								Start from an available hostel, reserve a bed, complete payment,
								then use maintenance only when an allocated room needs attention.
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onBrowse}
						className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#B7770D] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#986006]"
					>
						Browse All
						<ArrowRight className="size-4" />
					</button>
				</div>
			</div>
		</section>
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
	rooms,
	selectedRoomId,
	selectedBed,
	onChooseHostel,
	onSelectRoom,
	onSelectBed,
	onConfirm,
}: {
	selectedHostel: HostelItem | null;
	hostels: HostelItem[];
	rooms: RoomItem[];
	selectedRoomId: string;
	selectedBed: string;
	onChooseHostel: (hostel: HostelItem) => void;
	onSelectRoom: (roomId: string) => void;
	onSelectBed: (bed: string) => void;
	onConfirm: () => void;
}) {
	const availableRooms = selectedHostel
		? rooms.filter(
				(room) =>
					room.hostel === selectedHostel.name &&
					room.status !== "Full" &&
					room.status !== "Maintenance" &&
					room.available > 0,
			)
		: [];
	const selectedRoom = availableRooms.find((room) => room.id === selectedRoomId);
	const bedOptions = selectedRoom
		? Array.from({ length: selectedRoom.beds }, (_, index) => `Bed ${index + 1}`)
		: [];

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
					<p className="mt-1 text-sm text-[#60728f]">
						The student flow starts here: pick a hostel, then select an available
						room and bed before payment is shown.
					</p>
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
						Select an available room and preferred bed number.
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
						{rooms.filter((room) => room.hostel === selectedHostel.name).map((room) => (
							<button
								key={room.id}
								type="button"
								disabled={
									room.status === "Full" ||
									room.status === "Maintenance" ||
									room.available === 0
								}
								onClick={() => onSelectRoom(room.id)}
								className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${
									selectedRoomId === room.id
										? "border-[#B7770D] bg-[#fff8e8] shadow-sm"
										: "border-[#dbe5f1] bg-[#fbfdff] hover:border-[#B7770D]"
								}`}
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

					<div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
						<div className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4">
							<p className="text-sm font-bold text-[#0D2B55]">Available bed spaces</p>
							{selectedRoom ? (
								<div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
									{bedOptions.map((bed, index) => {
										const disabled = index >= selectedRoom.available;
										return (
											<button
												key={bed}
												type="button"
												disabled={disabled}
												onClick={() => onSelectBed(bed)}
												className={`min-h-11 rounded-xl border px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:bg-[#edf2f7] disabled:text-[#9aabc0] ${
													selectedBed === bed
														? "border-[#0D2B55] bg-[#0D2B55] text-white"
														: "border-[#d7e1ee] bg-white text-[#0D2B55] hover:border-[#B7770D]"
												}`}
											>
												{bed}
											</button>
										);
									})}
								</div>
							) : (
								<p className="mt-2 text-sm text-[#60728f]">
									Select a room above to see available bed spaces.
								</p>
							)}
						</div>
						<div className="rounded-2xl border border-[#b7ebc8] bg-[#f2fbf5] p-4">
							<p className="text-sm font-bold text-[#167a3e]">Reservation summary</p>
							<div className="mt-3 space-y-2 text-sm">
								<p className="font-semibold text-[#477157]">
									Hostel: <span className="font-bold">{selectedHostel.name}</span>
								</p>
								<p className="font-semibold text-[#477157]">
									Room: <span className="font-bold">{selectedRoom?.id ?? "Select room"}</span>
								</p>
								<p className="font-semibold text-[#477157]">
									Bed: <span className="font-bold">{selectedBed || "Select bed"}</span>
								</p>
								<p className="font-semibold text-[#477157]">
									Fee: <span className="font-bold">{selectedHostel.fee}</span>
								</p>
							</div>
							<button
								type="button"
								disabled={!selectedRoom || !selectedBed}
								onClick={onConfirm}
								className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0D2B55] px-5 text-sm font-bold text-white transition hover:bg-[#123866] disabled:cursor-not-allowed disabled:bg-[#9fb0c6]"
							>
								<CreditCard className="size-4" />
								Proceed to Payment
							</button>
						</div>
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

function AllocationView({
	allocation,
	payment,
	onBrowse,
	onPayment,
	onMaintenance,
}: {
	allocation: AllocationItem | null;
	payment: HostelPaymentRecord | null;
	onBrowse: () => void;
	onPayment: () => void;
	onMaintenance: () => void;
}) {
	if (!allocation) {
		return (
			<SimplePanel
				badge="My Allocation"
				title="No hostel allocation yet"
				description="Choose a hostel and reserve an available room or bed before allocation details appear here."
			>
				<button
					type="button"
					onClick={onBrowse}
					className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0D2B55] px-5 text-sm font-bold text-white"
				>
					<Search className="size-4" />
					Browse Hostels
				</button>
			</SimplePanel>
		);
	}

	return (
		<SimplePanel
			badge="My Allocation"
			title="Current hostel allocation"
			description="Your selected hostel, room, bed, payment state, and next residence action are shown here."
		>
			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
				{[
					["Hostel", allocation.hostel],
					["Room", allocation.room],
					["Bed", allocation.bed],
					["Status", allocation.status],
				].map(([label, value]) => (
					<div key={label} className="rounded-2xl bg-[#f8fbff] p-4">
						<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8395AF]">
							{label}
						</p>
						<p className="mt-2 text-lg font-bold text-[#0D2B55]">{value}</p>
					</div>
				))}
			</div>
			<div className="mt-5 rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4">
				<p className="text-sm font-bold text-[#0D2B55]">
					{payment?.paymentStatus === "Paid"
						? "Payment completed. Maintenance requests are now available for this allocation."
						: "Complete hostel payment to confirm your allocation."}
				</p>
				<p className="mt-1 text-sm leading-relaxed text-[#60728f]">
					{allocation.note}
				</p>
				<div className="mt-4 flex flex-col gap-3 sm:flex-row">
					<button
						type="button"
						onClick={onPayment}
						className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d7e2f0] bg-white px-5 text-sm font-bold text-[#0D2B55]"
					>
						<CreditCard className="size-4" />
						View Payment
					</button>
					<button
						type="button"
						disabled={payment?.paymentStatus !== "Paid"}
						onClick={onMaintenance}
						className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0D2B55] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#9fb0c6]"
					>
						<Wrench className="size-4" />
						Raise Maintenance
					</button>
				</div>
			</div>
		</SimplePanel>
	);
}

function StudentPaymentView({
	allocation,
	payment,
	onPay,
	isPaying,
	paymentMessage,
	onBrowse,
	onAllocation,
}: {
	allocation: AllocationItem | null;
	payment: HostelPaymentRecord | null;
	onPay: () => void;
	isPaying: boolean;
	paymentMessage: string;
	onBrowse: () => void;
	onAllocation: () => void;
}) {
	if (!allocation || !payment) {
		return (
			<SimplePanel
				badge="Hostel Payment"
				title="No hostel payment due"
				description="Hostel payment appears only after you select a hostel room and reserve a bed."
			>
				<button
					type="button"
					onClick={onBrowse}
					className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0D2B55] px-5 text-sm font-bold text-white"
				>
					<Search className="size-4" />
					Browse Hostels
				</button>
			</SimplePanel>
		);
	}

	return (
		<SimplePanel
			badge="Hostel Payment"
			title="Accommodation payment"
			description="Confirm the hostel fee after reserving a room and bed. Checkout opens securely through Paystack."
		>
			<div className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<p className="text-sm font-bold text-[#0D2B55]">
							{allocation.hostel} - {allocation.room} / {allocation.bed}
						</p>
						<p className="mt-2 text-3xl font-bold text-[#0D2B55]">
							{formatCurrency(payment.amount, payment.currency)}
						</p>
						<p className="mt-1 text-sm text-[#60728f]">
							Invoice {payment.invoiceNo} is currently {payment.paymentStatus.toLowerCase()}.
						</p>
						{paymentMessage ? (
							<p className="mt-2 text-sm font-bold text-[#0D2B55]">
								{paymentMessage}
							</p>
						) : null}
					</div>
					<div className="flex flex-col gap-2 sm:flex-row">
						<button
							type="button"
							onClick={onPay}
							disabled={isPaying || payment.paymentStatus === "Paid"}
							className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0D2B55] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#9fb0c6]"
						>
							<CreditCard className="size-4" />
							{payment.paymentStatus === "Paid"
								? "Payment Completed"
								: isPaying
									? "Opening Paystack..."
									: "Pay Hostel Fee"}
						</button>
						<button
							type="button"
							onClick={onAllocation}
							className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d7e2f0] bg-white px-5 text-sm font-bold text-[#0D2B55]"
						>
							<BedDouble className="size-4" />
							My Allocation
						</button>
					</div>
				</div>
			</div>
		</SimplePanel>
	);
}

function AdminHostelPaymentView({
	payments,
	allocations,
	hostels,
	permissions,
	onView,
	onPrint,
	onExport,
}: {
	payments: HostelPaymentRecord[];
	allocations: AllocationItem[];
	hostels: HostelItem[];
	permissions: UserPermissionKey[];
	onView: (payment: HostelPaymentRecord) => void;
	onPrint: (payment: HostelPaymentRecord) => void;
	onExport: (payment: HostelPaymentRecord) => void;
}) {
	const [search, setSearch] = useState("");
	const [paymentStatus, setPaymentStatus] = useState<HostelPaymentStatus | "all">("all");
	const [invoiceStatus, setInvoiceStatus] = useState<HostelInvoiceStatus | "all">("all");
	const [hostelFilter, setHostelFilter] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [openActionsId, setOpenActionsId] = useState<string | number | null>(null);
	const canViewPayment = hasPermissions(permissions, ["hostels.view"], { mode: "any" });
	const stats = useMemo(
		() => ({
			totalInvoices: payments.length,
			collected: payments
				.filter((payment) => payment.paymentStatus === "Paid")
				.reduce((total, payment) => total + payment.amount, 0),
			pending: payments.filter((payment) =>
				["Pending", "Review"].includes(payment.paymentStatus),
			).length,
			outstanding: payments
				.filter((payment) => payment.paymentStatus !== "Paid")
				.reduce((total, payment) => total + payment.amount, 0),
		}),
		[payments],
	);
	const hostelOptions = useMemo(
		() =>
			Array.from(
				new Set([
					...hostels.map((hostel) => hostel.name),
					...payments.map((payment) => payment.hostel),
				]),
			)
				.filter(Boolean)
				.sort((left, right) => left.localeCompare(right)),
		[hostels, payments],
	);
	const filteredPayments = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return payments.filter((payment) => {
			const haystack = [
				payment.invoiceNo,
				payment.reference,
				payment.studentName,
				payment.matricNo,
				payment.level,
				payment.hostel,
				payment.room,
				payment.bed,
				payment.paymentStatus,
				payment.invoiceStatus,
				payment.channel,
				payment.verifiedBy,
				payment.note,
			]
				.join(" ")
				.toLowerCase();

			return (
				(!normalizedSearch || haystack.includes(normalizedSearch)) &&
				(paymentStatus === "all" || payment.paymentStatus === paymentStatus) &&
				(invoiceStatus === "all" || payment.invoiceStatus === invoiceStatus) &&
				(hostelFilter === "all" || payment.hostel === hostelFilter)
			);
		});
	}, [hostelFilter, invoiceStatus, paymentStatus, payments, search]);
	const pageCount = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
	const safePage = Math.min(currentPage, pageCount);
	const paginatedPayments = filteredPayments.slice(
		(safePage - 1) * PAGE_SIZE,
		safePage * PAGE_SIZE,
	);

	function updateFilter<T>(setter: (value: T) => void, value: T) {
		setter(value);
		setCurrentPage(1);
	}

	function clearFilters() {
		setSearch("");
		setPaymentStatus("all");
		setInvoiceStatus("all");
		setHostelFilter("all");
		setCurrentPage(1);
	}

	return (
		<section className="space-y-5">
			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							Hostel Payment Analytics
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							Hostel invoice and payment status
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#556987]">
							Track student hostel fee invoices, payment clearance, room
							allocation links, and print-ready hostel receipts inside this
							college-scoped hostel workspace.
						</p>
					</div>
					<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] px-4 py-3 text-sm font-black text-[#0D2B55]">
						{allocations.length} allocation records checked
					</div>
				</div>

				<div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{[
						["Total Invoices", stats.totalInvoices],
						["Collected", formatCurrency(stats.collected)],
						["Pending Review", stats.pending],
						["Outstanding", formatCurrency(stats.outstanding)],
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
				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_13rem_13rem_13rem]">
					<label className="relative">
						<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
						<input
							value={search}
							onChange={(event) => updateFilter(setSearch, event.target.value)}
							placeholder="Search invoice, student, reference, or room"
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
						value={paymentStatus}
						onChange={(event) =>
							updateFilter(
								setPaymentStatus,
								event.target.value as HostelPaymentStatus | "all",
							)
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="all">All payment status</option>
						{HOSTEL_PAYMENT_STATUSES.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
					<select
						value={invoiceStatus}
						onChange={(event) =>
							updateFilter(
								setInvoiceStatus,
								event.target.value as HostelInvoiceStatus | "all",
							)
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="all">All invoice status</option>
						{HOSTEL_INVOICE_STATUSES.map((option) => (
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
							Hostel Payment Table
						</p>
						<p className="mt-1 text-sm font-semibold text-[#60728f]">
							Showing {paginatedPayments.length} of {filteredPayments.length} hostel payments
						</p>
					</div>
					<div className="flex items-center gap-2 rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-4 py-2 text-xs font-black text-[#0D2B55]">
						Page {safePage} of {pageCount}
					</div>
				</div>

				{filteredPayments.length === 0 ? (
					<div className="p-8 text-center">
						<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eef4fb] text-[#2E86C1]">
							<CreditCard className="size-6" />
						</div>
						<h3 className="mt-4 text-lg font-black text-[#06183A]">
							No hostel payments found
						</h3>
						<p className="mt-2 text-sm text-[#60728f]">
							Adjust the filters to review student hostel invoice status.
						</p>
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className="min-w-[1280px] w-full border-collapse text-left">
								<thead className="bg-[#f8fbff]">
									<tr className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
										<th className="px-5 py-4">Invoice</th>
										<th className="px-5 py-4">Student</th>
										<th className="px-5 py-4">Room / Bed</th>
										<th className="px-5 py-4">Amount</th>
										<th className="px-5 py-4">Payment</th>
										<th className="px-5 py-4">Invoice Status</th>
										<th className="px-5 py-4">Paid / Updated</th>
										<th className="px-5 py-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[#dbe5f1]">
									{paginatedPayments.map((payment) => (
										<tr key={payment.id} className="bg-white transition hover:bg-[#f8fbff]">
											<td className="px-5 py-4">
												<p className="font-black text-[#06183A]">{payment.invoiceNo}</p>
												<p className="mt-1 max-w-[15rem] break-words text-sm font-semibold text-[#60728f]">
													{payment.reference}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="font-black text-[#0D2B55]">{payment.studentName}</p>
												<p className="mt-1 text-xs font-bold text-[#60728f]">
													{payment.matricNo} / {payment.level}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="max-w-[14rem] text-sm font-black text-[#0D2B55]">
													{payment.hostel}
												</p>
												<p className="mt-1 text-xs font-bold text-[#60728f]">
													{payment.room} / {payment.bed}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-black text-[#0D2B55]">
													{formatCurrency(payment.amount, payment.currency)}
												</p>
												<p className="mt-1 text-xs font-bold text-[#60728f]">
													{payment.channel}
												</p>
											</td>
											<td className="px-5 py-4">
												<span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${getStatusClass(payment.paymentStatus)}`}>
													{payment.paymentStatus}
												</span>
											</td>
											<td className="px-5 py-4">
												<span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${getStatusClass(payment.invoiceStatus)}`}>
													{payment.invoiceStatus}
												</span>
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-bold text-[#60728f]">
													{payment.paidAt ? formatDate(payment.paidAt) : "Not paid"}
												</p>
												<p className="mt-1 text-xs font-bold text-[#8395AF]">
													Updated {formatDate(payment.updatedAt)}
												</p>
											</td>
											<td className="px-5 py-4">
												<RowActionMenu
													label={`Open actions for hostel payment ${payment.invoiceNo}`}
													open={openActionsId === payment.id}
													onOpenChange={(open) => setOpenActionsId(open ? payment.id : null)}
													menuClassName="z-[160]"
													width={216}
													items={[
														{
															label: "View",
															icon: <Eye className="size-4" />,
															disabled: !canViewPayment,
															onSelect: () => {
																onView(payment);
																setOpenActionsId(null);
															},
														},
														{
															label: "Print Invoice",
															icon: <Printer className="size-4" />,
															disabled: !canViewPayment,
															className: "text-[#0D2B55] hover:bg-[#eef4fb]",
															onSelect: () => {
																onPrint(payment);
																setOpenActionsId(null);
															},
														},
														{
															label: "Export CSV",
															icon: <Download className="size-4" />,
															disabled: !canViewPayment,
															className: "text-[#0D2B55] hover:bg-[#eef4fb]",
															onSelect: () => {
																onExport(payment);
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

function HostelPaymentModal({
	payment,
	onClose,
	onPrint,
	onExport,
}: {
	payment: HostelPaymentRecord | null;
	onClose: () => void;
	onPrint: (payment: HostelPaymentRecord) => void;
	onExport: (payment: HostelPaymentRecord) => void;
}) {
	if (!payment) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-[170] flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
				<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
							Manage Hostel Payment
						</p>
						<h2 className="mt-2 text-xl font-black sm:text-2xl">
							Hostel payment invoice
						</h2>
						<p className="mt-1 text-sm font-semibold text-[#c5d4e8]">
							{payment.invoiceNo} - {payment.reference}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#0D2B55]"
						aria-label="Close hostel payment modal"
					>
						<X className="size-5" />
					</button>
				</div>

				<div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-5 sm:p-6">
					<div className="grid gap-3 md:grid-cols-3">
						{[
							["Student", payment.studentName],
							["Matric No", payment.matricNo],
							["Level", payment.level],
							["Hostel", payment.hostel],
							["Room / Bed", `${payment.room} / ${payment.bed}`],
							["Amount", formatCurrency(payment.amount, payment.currency)],
							["Payment", payment.paymentStatus],
							["Invoice", payment.invoiceStatus],
							["Channel", payment.channel],
							["Issued", formatDate(payment.issuedAt)],
							["Paid", payment.paidAt ? formatDate(payment.paidAt) : "Not paid"],
							["Verified By", payment.verifiedBy],
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

					<div className="mt-5 rounded-2xl border border-[#dbe5f1] bg-white p-4">
						<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
							Payment Note
						</p>
						<p className="mt-2 text-sm font-semibold leading-6 text-[#60728f]">
							{payment.note || "No hostel payment note has been recorded."}
						</p>
					</div>

					<div className="sticky bottom-0 mt-5 flex flex-col gap-3 border-t border-[#dbe5f1] bg-white/95 pt-4 backdrop-blur sm:flex-row sm:justify-between">
						<div className="flex flex-col gap-3 sm:flex-row">
							<button
								type="button"
								onClick={() => onPrint(payment)}
								className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dbe5f1] px-5 py-3 text-sm font-black text-[#0D2B55] transition hover:border-[#0D2B55]"
							>
								<Printer className="size-4" />
								Print invoice
							</button>
							<button
								type="button"
								onClick={() => onExport(payment)}
								className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dbe5f1] px-5 py-3 text-sm font-black text-[#0D2B55] transition hover:border-[#0D2B55]"
							>
								<Download className="size-4" />
								Export CSV
							</button>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="inline-flex items-center justify-center rounded-2xl bg-[#0D2B55] px-5 py-3 text-sm font-black text-white transition hover:bg-[#123866]"
						>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function StudentMaintenanceView({
	allocation,
	payment,
	requests,
	onSubmit,
	onBrowse,
	onPayment,
}: {
	allocation: AllocationItem | null;
	payment: HostelPaymentRecord | null;
	requests: MaintenanceRequestItem[];
	onSubmit: (draft: StudentMaintenanceDraft) => void;
	onBrowse: () => void;
	onPayment: () => void;
}) {
	const [draft, setDraft] = useState<StudentMaintenanceDraft>({
		category: "General",
		issue: "",
		description: "",
		priority: "Medium",
	});
	const canSubmit =
		Boolean(allocation) &&
		payment?.paymentStatus === "Paid" &&
		draft.issue.trim().length > 0 &&
		draft.description.trim().length > 0;

	function submitRequest() {
		if (!canSubmit) {
			return;
		}

		onSubmit(draft);
		setDraft({
			category: "General",
			issue: "",
			description: "",
			priority: "Medium",
		});
	}

	return (
		<SimplePanel
			badge="Maintenance"
			title="Residence maintenance requests"
			description="Create a room complaint only after your hostel payment confirms the allocation."
		>
			{!allocation || payment?.paymentStatus !== "Paid" ? (
				<div className="mb-4 rounded-2xl border border-[#f0cb7c] bg-[#fff8e8] p-4">
					<p className="text-sm font-bold text-[#7a4a00]">
						Maintenance opens after confirmed hostel allocation.
					</p>
					<div className="mt-3 flex flex-col gap-2 sm:flex-row">
						<button
							type="button"
							onClick={onBrowse}
							className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d7e2f0] bg-white px-5 text-sm font-bold text-[#0D2B55]"
						>
							Browse Hostels
						</button>
						<button
							type="button"
							onClick={onPayment}
							className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0D2B55] px-5 text-sm font-bold text-white"
						>
							<CreditCard className="size-4" />
							Hostel Payment
						</button>
					</div>
				</div>
			) : null}
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
				<div className="space-y-3">
					{requests.length > 0 ? requests.map((request) => (
						<div
							key={request.id}
							className="flex flex-col gap-3 rounded-2xl border border-[#e3eaf4] bg-[#fbfdff] p-4 sm:flex-row sm:items-center sm:justify-between"
						>
							<div>
								<p className="text-sm font-bold text-[#0D2B55]">{request.issue}</p>
								<p className="mt-1 text-xs text-[#60728f]">
									{request.hostel} - {request.room} / {request.bed}
								</p>
							</div>
							<span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(request.status)}`}>
								{request.status}
							</span>
						</div>
					)) : (
						<div className="rounded-2xl border border-dashed border-[#d7e2f0] bg-[#fbfdff] p-5 text-sm font-semibold text-[#60728f]">
							No maintenance request has been submitted for this allocation.
						</div>
					)}
				</div>
				<div className="rounded-2xl border border-[#dbe5f1] bg-white p-4">
					<p className="text-sm font-bold text-[#0D2B55]">New request</p>
					<div className="mt-3 space-y-3">
						<select
							value={draft.category}
							onChange={(event) =>
								setDraft((current) => ({ ...current, category: event.target.value }))
							}
							disabled={!allocation || payment?.paymentStatus !== "Paid"}
							className="min-h-11 w-full rounded-xl border border-[#d7e1ee] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1] disabled:bg-[#edf2f7]"
						>
							{["General", "Plumbing", "Electrical", "Furniture", "Door and security"].map((category) => (
								<option key={category} value={category}>
									{category}
								</option>
							))}
						</select>
						<input
							value={draft.issue}
							onChange={(event) =>
								setDraft((current) => ({ ...current, issue: event.target.value }))
							}
							disabled={!allocation || payment?.paymentStatus !== "Paid"}
							className="min-h-11 w-full rounded-xl border border-[#d7e1ee] px-4 text-sm outline-none focus:border-[#2E86C1]"
							placeholder="Issue title"
						/>
						<textarea
							value={draft.description}
							onChange={(event) =>
								setDraft((current) => ({ ...current, description: event.target.value }))
							}
							disabled={!allocation || payment?.paymentStatus !== "Paid"}
							className="min-h-24 w-full rounded-xl border border-[#d7e1ee] px-4 py-3 text-sm outline-none focus:border-[#2E86C1]"
							placeholder="Describe the issue"
						/>
						<select
							value={draft.priority}
							onChange={(event) =>
								setDraft((current) => ({
									...current,
									priority: event.target.value as MaintenancePriority,
								}))
							}
							disabled={!allocation || payment?.paymentStatus !== "Paid"}
							className="min-h-11 w-full rounded-xl border border-[#d7e1ee] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1] disabled:bg-[#edf2f7]"
						>
							{MAINTENANCE_PRIORITIES.map((priority) => (
								<option key={priority} value={priority}>
									{priority}
								</option>
							))}
						</select>
						<button
							type="button"
							disabled={!canSubmit}
							onClick={submitRequest}
							className="min-h-11 w-full rounded-xl bg-[#0D2B55] text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#9fb0c6]"
						>
							Submit Request
						</button>
					</div>
				</div>
			</div>
		</SimplePanel>
	);
}

function AdminMaintenanceView({
	requests,
	allocations,
	hostels,
	permissions,
	onView,
	onManage,
	onViewAllocation,
}: {
	requests: MaintenanceRequestItem[];
	allocations: AllocationItem[];
	hostels: HostelItem[];
	permissions: UserPermissionKey[];
	onView: (request: MaintenanceRequestItem) => void;
	onManage: (request: MaintenanceRequestItem) => void;
	onViewAllocation: (request: MaintenanceRequestItem) => void;
}) {
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<MaintenanceStatus | "all">("all");
	const [priority, setPriority] = useState<MaintenancePriority | "all">("all");
	const [hostelFilter, setHostelFilter] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [openActionsId, setOpenActionsId] = useState<string | number | null>(null);
	const canManage = hasPermissions(permissions, ["hostels.update"], { mode: "any" });
	const stats = useMemo(
		() => ({
			total: requests.length,
			open: requests.filter((request) => request.status === "Open").length,
			inProgress: requests.filter((request) => request.status === "In Progress").length,
			critical: requests.filter((request) =>
				request.priority === "Critical" || request.status === "Escalated",
			).length,
		}),
		[requests],
	);
	const hostelOptions = useMemo(
		() =>
			Array.from(
				new Set([
					...hostels.map((hostel) => hostel.name),
					...requests.map((request) => request.hostel),
				]),
			)
				.filter(Boolean)
				.sort((left, right) => left.localeCompare(right)),
		[hostels, requests],
	);
	const filteredRequests = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return requests.filter((request) => {
			const haystack = [
				request.studentName,
				request.matricNo,
				request.hostel,
				request.room,
				request.bed,
				request.category,
				request.issue,
				request.description,
				request.priority,
				request.status,
				request.assignedTo,
				request.resolutionNote,
			]
				.join(" ")
				.toLowerCase();

			return (
				(!normalizedSearch || haystack.includes(normalizedSearch)) &&
				(status === "all" || request.status === status) &&
				(priority === "all" || request.priority === priority) &&
				(hostelFilter === "all" || request.hostel === hostelFilter)
			);
		});
	}, [hostelFilter, priority, requests, search, status]);
	const pageCount = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
	const safePage = Math.min(currentPage, pageCount);
	const paginatedRequests = filteredRequests.slice(
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
		setPriority("all");
		setHostelFilter("all");
		setCurrentPage(1);
	}

	return (
		<section className="space-y-5">
			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							Maintenance Analytics
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							Student maintenance requests
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#556987]">
							Review student room issues, assign follow-up owners, and connect each
							request back to the hostel allocation record.
						</p>
					</div>
					<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] px-4 py-3 text-sm font-black text-[#0D2B55]">
						{allocations.length} allocation records linked
					</div>
				</div>

				<div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{[
						["Total Requests", stats.total],
						["Open", stats.open],
						["In Progress", stats.inProgress],
						["Critical / Escalated", stats.critical],
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
				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_13rem_13rem_13rem]">
					<label className="relative">
						<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
						<input
							value={search}
							onChange={(event) => updateFilter(setSearch, event.target.value)}
							placeholder="Search student, issue, room, or assignee"
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
							updateFilter(setStatus, event.target.value as MaintenanceStatus | "all")
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="all">All status</option>
						{MAINTENANCE_STATUSES.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
					<select
						value={priority}
						onChange={(event) =>
							updateFilter(
								setPriority,
								event.target.value as MaintenancePriority | "all",
							)
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="all">All priority</option>
						{MAINTENANCE_PRIORITIES.map((option) => (
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
							Maintenance Table
						</p>
						<p className="mt-1 text-sm font-semibold text-[#60728f]">
							Showing {paginatedRequests.length} of {filteredRequests.length} requests
						</p>
					</div>
					<div className="flex items-center gap-2 rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-4 py-2 text-xs font-black text-[#0D2B55]">
						Page {safePage} of {pageCount}
					</div>
				</div>

				{filteredRequests.length === 0 ? (
					<div className="p-8 text-center">
						<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eef4fb] text-[#2E86C1]">
							<Wrench className="size-6" />
						</div>
						<h3 className="mt-4 text-lg font-black text-[#06183A]">
							No maintenance requests found
						</h3>
						<p className="mt-2 text-sm text-[#60728f]">
							Adjust the filters to review student maintenance requests.
						</p>
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className="min-w-[1220px] w-full border-collapse text-left">
								<thead className="bg-[#f8fbff]">
									<tr className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
										<th className="px-5 py-4">Student</th>
										<th className="px-5 py-4">Location</th>
										<th className="px-5 py-4">Issue</th>
										<th className="px-5 py-4">Priority</th>
										<th className="px-5 py-4">Status</th>
										<th className="px-5 py-4">Assigned To</th>
										<th className="px-5 py-4">Last Updated</th>
										<th className="px-5 py-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[#dbe5f1]">
									{paginatedRequests.map((request) => (
										<tr key={request.id} className="bg-white transition hover:bg-[#f8fbff]">
											<td className="px-5 py-4">
												<p className="font-black text-[#06183A]">{request.studentName}</p>
												<p className="mt-1 max-w-[14rem] break-words text-sm font-semibold text-[#60728f]">
													{request.matricNo}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="max-w-[14rem] text-sm font-black text-[#0D2B55]">
													{request.hostel}
												</p>
												<p className="mt-1 text-xs font-bold text-[#60728f]">
													{request.room} / {request.bed}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="max-w-[16rem] break-words text-sm font-black text-[#0D2B55]">
													{request.issue}
												</p>
												<p className="mt-1 text-xs font-bold text-[#60728f]">
													{request.category}
												</p>
											</td>
											<td className="px-5 py-4">
												<span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${getStatusClass(request.priority)}`}>
													{request.priority}
												</span>
											</td>
											<td className="px-5 py-4">
												<span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${getStatusClass(request.status)}`}>
													{request.status}
												</span>
											</td>
											<td className="px-5 py-4 text-sm font-bold text-[#60728f]">
												{request.assignedTo}
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-bold text-[#60728f]">
													{formatDate(request.updatedAt)}
												</p>
											</td>
											<td className="px-5 py-4">
												<RowActionMenu
													label={`Open actions for maintenance request ${request.id}`}
													open={openActionsId === request.id}
													onOpenChange={(open) => setOpenActionsId(open ? request.id : null)}
													menuClassName="z-[140]"
													width={216}
													items={[
														{
															label: "View",
															icon: <Eye className="size-4" />,
															onSelect: () => {
																onView(request);
																setOpenActionsId(null);
															},
														},
														{
															label: "Manage Request",
															icon: <Edit3 className="size-4" />,
															disabled: !canManage,
															className: "text-[#0D2B55] hover:bg-[#eef4fb]",
															onSelect: () => {
																onManage(request);
																setOpenActionsId(null);
															},
														},
														{
															label: "View Allocation",
															icon: <ShieldCheck className="size-4" />,
															onSelect: () => {
																onViewAllocation(request);
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

function MaintenanceRequestModal({
	mode,
	request,
	draft,
	canSave,
	onClose,
	onDraftChange,
	onSave,
	onViewAllocation,
}: {
	mode: MaintenanceModalMode | null;
	request: MaintenanceRequestItem | null;
	draft: MaintenanceRequestDraft;
	canSave: boolean;
	onClose: () => void;
	onDraftChange: (draft: MaintenanceRequestDraft) => void;
	onSave: () => void;
	onViewAllocation: (request: MaintenanceRequestItem) => void;
}) {
	if (!mode || !request) {
		return null;
	}

	const isView = mode === "view";

	return (
		<div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
				<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
							Manage Maintenance
						</p>
						<h2 className="mt-2 text-xl font-black sm:text-2xl">
							{isView ? "Maintenance request details" : "Update maintenance request"}
						</h2>
						<p className="mt-1 text-sm font-semibold text-[#c5d4e8]">
							{request.studentName} - {request.room}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#0D2B55]"
						aria-label="Close maintenance request modal"
					>
						<X className="size-5" />
					</button>
				</div>

				<div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-5 sm:p-6">
					<div className="grid gap-3 md:grid-cols-3">
						{[
							["Student", request.studentName],
							["Matric No", request.matricNo],
							["Hostel", request.hostel],
							["Room / Bed", `${request.room} / ${request.bed}`],
							["Category", request.category],
							["Reported", formatDate(request.reportedAt)],
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

					<div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
						<div className="rounded-2xl border border-[#dbe5f1] bg-white p-4">
							<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
								Student Request
							</p>
							<h3 className="mt-2 text-lg font-black text-[#06183A]">
								{request.issue}
							</h3>
							<p className="mt-2 text-sm font-semibold leading-6 text-[#60728f]">
								{request.description}
							</p>
						</div>

						<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
							<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
								Current State
							</p>
							<div className="mt-3 flex flex-wrap gap-2">
								<span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${getStatusClass(request.priority)}`}>
									{request.priority}
								</span>
								<span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${getStatusClass(request.status)}`}>
									{request.status}
								</span>
							</div>
							<p className="mt-4 text-sm font-bold text-[#0D2B55]">
								{request.assignedTo}
							</p>
							<p className="mt-1 text-xs font-semibold text-[#60728f]">
								Last updated {formatDate(request.updatedAt)}
							</p>
						</div>
					</div>

					{isView ? (
						<div className="mt-5 rounded-2xl border border-[#dbe5f1] bg-white p-4">
							<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
								Resolution Note
							</p>
							<p className="mt-2 text-sm font-semibold leading-6 text-[#60728f]">
								{request.resolutionNote || "No resolution note has been recorded."}
							</p>
						</div>
					) : (
						<div className="mt-5 grid gap-3 md:grid-cols-2">
							<select
								value={draft.status}
								onChange={(event) =>
									onDraftChange({
										...draft,
										status: event.target.value as MaintenanceStatus,
									})
								}
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							>
								{MAINTENANCE_STATUSES.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
							<select
								value={draft.priority}
								onChange={(event) =>
									onDraftChange({
										...draft,
										priority: event.target.value as MaintenancePriority,
									})
								}
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							>
								{MAINTENANCE_PRIORITIES.map((option) => (
									<option key={option} value={option}>
										{option} priority
									</option>
								))}
							</select>
							<input
								value={draft.assignedTo}
								onChange={(event) =>
									onDraftChange({ ...draft, assignedTo: event.target.value })
								}
								placeholder="Assigned team or staff"
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1] md:col-span-2"
							/>
							<textarea
								value={draft.resolutionNote}
								onChange={(event) =>
									onDraftChange({ ...draft, resolutionNote: event.target.value })
								}
								placeholder="Resolution or follow-up note"
								className="min-h-28 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-[#0D2B55] outline-none focus:border-[#2E86C1] md:col-span-2"
							/>
						</div>
					)}

					<div className="sticky bottom-0 mt-5 flex flex-col gap-3 border-t border-[#dbe5f1] bg-white/95 pt-4 backdrop-blur sm:flex-row sm:justify-between">
						<button
							type="button"
							onClick={() => onViewAllocation(request)}
							className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dbe5f1] px-5 py-3 text-sm font-black text-[#0D2B55] transition hover:border-[#0D2B55]"
						>
							<ShieldCheck className="size-4" />
							View allocation
						</button>
						<div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
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
									disabled={!canSave || !draft.assignedTo.trim()}
									className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866] disabled:cursor-not-allowed disabled:opacity-50"
								>
									<Edit3 className="size-4" />
									Save request
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
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
	isSaving,
	onClose,
	onDraftChange,
	onSave,
}: {
	mode: RoomModalMode | null;
	room: RoomItem | null;
	draft: RoomDraft;
	hostels: HostelItem[];
	canSave: boolean;
	isSaving: boolean;
	onClose: () => void;
	onDraftChange: (draft: RoomDraft) => void;
	onSave: () => Promise<void>;
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
								disabled={
									isSaving || !canSave || !draft.id.trim() || !draft.hostel.trim()
								}
								className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866] disabled:cursor-not-allowed disabled:opacity-50"
							>
								{mode === "create" ? <Plus className="size-4" /> : <Edit3 className="size-4" />}
								{isSaving
									? "Saving..."
									: mode === "create"
										? "Create room"
										: "Save room"}
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function AllocationsView({
	allocations,
	hostels,
	rooms,
	permissions,
	onView,
	onEdit,
}: {
	allocations: AllocationItem[];
	hostels: HostelItem[];
	rooms: RoomItem[];
	permissions: UserPermissionKey[];
	onView: (allocation: AllocationItem) => void;
	onEdit: (allocation: AllocationItem) => void;
}) {
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<AllocationStatus | "all">("all");
	const [hostelFilter, setHostelFilter] = useState<string>("all");
	const [paymentFilter, setPaymentFilter] = useState<AllocationItem["paymentStatus"] | "all">("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [openActionsId, setOpenActionsId] = useState<string | number | null>(null);
	const canAllocate = hasPermissions(permissions, ["hostels.allocate"], { mode: "any" });
	const stats = useMemo(
		() => ({
			total: allocations.length,
			allocated: allocations.filter((allocation) =>
				["Allocated", "Paid"].includes(allocation.status),
			).length,
			pending: allocations.filter((allocation) => allocation.status === "Pending").length,
			paid: allocations.filter((allocation) => allocation.paymentStatus === "Paid").length,
		}),
		[allocations],
	);
	const hostelOptions = useMemo(
		() =>
			Array.from(
				new Set([
					...hostels.map((hostel) => hostel.name),
					...allocations.map((allocation) => allocation.hostel),
				]),
			)
				.filter(Boolean)
				.sort((left, right) => left.localeCompare(right)),
		[allocations, hostels],
	);
	const filteredAllocations = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return allocations.filter((allocation) => {
			const haystack = [
				allocation.studentName,
				allocation.matricNo,
				allocation.level,
				allocation.gender,
				allocation.hostel,
				allocation.room,
				allocation.bed,
				allocation.paymentStatus,
				allocation.status,
				allocation.allocatedBy,
				allocation.note,
			]
				.join(" ")
				.toLowerCase();

			return (
				(!normalizedSearch || haystack.includes(normalizedSearch)) &&
				(status === "all" || allocation.status === status) &&
				(hostelFilter === "all" || allocation.hostel === hostelFilter) &&
				(paymentFilter === "all" || allocation.paymentStatus === paymentFilter)
			);
		});
	}, [allocations, hostelFilter, paymentFilter, search, status]);
	const pageCount = Math.max(1, Math.ceil(filteredAllocations.length / PAGE_SIZE));
	const safePage = Math.min(currentPage, pageCount);
	const paginatedAllocations = filteredAllocations.slice(
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
		setHostelFilter("all");
		setPaymentFilter("all");
		setCurrentPage(1);
	}

	return (
		<section className="space-y-5">
			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							Allocation Analytics
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							Hostel allocation management
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#556987]">
							Assign eligible students to rooms and beds, review payment status,
							and manage allocation records inside the hostel workspace.
						</p>
					</div>
					{/* Create allocation is temporarily hidden while live allocation rules settle. */}
				</div>

				<div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{[
						["Total Allocations", stats.total],
						["Assigned Beds", stats.allocated],
						["Pending Review", stats.pending],
						["Payment Cleared", stats.paid],
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
				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_13rem_13rem_13rem]">
					<label className="relative">
						<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
						<input
							value={search}
							onChange={(event) => updateFilter(setSearch, event.target.value)}
							placeholder="Search student, matric, room, or bed"
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
							updateFilter(setStatus, event.target.value as AllocationStatus | "all")
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="all">All allocation status</option>
						{ALLOCATION_STATUSES.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
					<select
						value={paymentFilter}
						onChange={(event) =>
							updateFilter(
								setPaymentFilter,
								event.target.value as AllocationItem["paymentStatus"] | "all",
							)
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="all">All payment status</option>
						{PAYMENT_STATUSES.map((option) => (
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
							Allocations Table
						</p>
						<p className="mt-1 text-sm font-semibold text-[#60728f]">
							Showing {paginatedAllocations.length} of {filteredAllocations.length} allocations
						</p>
					</div>
					<div className="flex items-center gap-2 rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-4 py-2 text-xs font-black text-[#0D2B55]">
						Page {safePage} of {pageCount}
					</div>
				</div>

				{filteredAllocations.length === 0 ? (
					<div className="p-8 text-center">
						<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eef4fb] text-[#2E86C1]">
							<ShieldCheck className="size-6" />
						</div>
						<h3 className="mt-4 text-lg font-black text-[#06183A]">
							No allocations found
						</h3>
						<p className="mt-2 text-sm text-[#60728f]">
							Adjust the filters or create a new hostel allocation.
						</p>
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className="min-w-[1180px] w-full border-collapse text-left">
								<thead className="bg-[#f8fbff]">
									<tr className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
										<th className="px-5 py-4">Student</th>
										<th className="px-5 py-4">Level</th>
										<th className="px-5 py-4">Hostel</th>
										<th className="px-5 py-4">Room / Bed</th>
										<th className="px-5 py-4">Payment</th>
										<th className="px-5 py-4">Status</th>
										<th className="px-5 py-4">Last Updated</th>
										<th className="px-5 py-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[#dbe5f1]">
									{paginatedAllocations.map((allocation) => (
										<tr key={allocation.id} className="bg-white transition hover:bg-[#f8fbff]">
											<td className="px-5 py-4">
												<p className="font-black text-[#06183A]">{allocation.studentName}</p>
												<p className="mt-1 max-w-[14rem] break-words text-sm font-semibold text-[#60728f]">
													{allocation.matricNo}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-black text-[#0D2B55]">
													{allocation.level}
												</p>
												<p className="mt-1 text-xs font-bold text-[#60728f]">
													{allocation.gender}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="max-w-[14rem] text-sm font-black text-[#0D2B55]">
													{allocation.hostel}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-black text-[#0D2B55]">{allocation.room}</p>
												<p className="mt-1 text-xs font-bold text-[#60728f]">
													{allocation.bed || "No bed selected"}
												</p>
											</td>
											<td className="px-5 py-4">
												<span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${getStatusClass(allocation.paymentStatus)}`}>
													{allocation.paymentStatus}
												</span>
											</td>
											<td className="px-5 py-4">
												<span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${getStatusClass(allocation.status)}`}>
													{allocation.status}
												</span>
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-bold text-[#60728f]">
													{formatDate(allocation.updatedAt)}
												</p>
											</td>
											<td className="px-5 py-4">
												<RowActionMenu
													label={`Open actions for allocation ${allocation.studentName}`}
													open={openActionsId === allocation.id}
													onOpenChange={(open) => setOpenActionsId(open ? allocation.id : null)}
													menuClassName="z-[120]"
													items={[
														{
															label: "View",
															icon: <Eye className="size-4" />,
															onSelect: () => {
																onView(allocation);
																setOpenActionsId(null);
															},
														},
														{
															label: "Edit",
															icon: <Edit3 className="size-4" />,
															disabled: !canAllocate,
															className: "text-[#0D2B55] hover:bg-[#eef4fb]",
															onSelect: () => {
																onEdit(allocation);
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

			<p className="text-xs font-semibold text-[#6b7d97]">
				Room source: {rooms.length} rooms are available for allocation checks in this workspace.
			</p>
		</section>
	);
}

function AllocationModal({
	mode,
	allocation,
	draft,
	hostels,
	rooms,
	canSave,
	onClose,
	onDraftChange,
	onSave,
}: {
	mode: AllocationModalMode | null;
	allocation: AllocationItem | null;
	draft: AllocationDraft;
	hostels: HostelItem[];
	rooms: RoomItem[];
	canSave: boolean;
	onClose: () => void;
	onDraftChange: (draft: AllocationDraft) => void;
	onSave: () => void;
}) {
	if (!mode) {
		return null;
	}

	const isView = mode === "view";
	const title =
		mode === "create"
			? "Create allocation"
			: mode === "edit"
				? "Edit allocation"
				: "Allocation details";
	const hostelOptions = Array.from(
		new Set([...hostels.map((hostel) => hostel.name), draft.hostel].filter(Boolean)),
	);
	const roomOptions = Array.from(
		new Set([
			...rooms
				.filter((room) => !draft.hostel || room.hostel === draft.hostel)
				.map((room) => room.id),
			draft.room,
		].filter(Boolean)),
	);

	return (
		<div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
				<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
							Manage Allocation
						</p>
						<h2 className="mt-2 text-xl font-black sm:text-2xl">{title}</h2>
						<p className="mt-1 text-sm font-semibold text-[#c5d4e8]">
							{allocation?.matricNo ?? "New student allocation"}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#0D2B55]"
						aria-label="Close allocation modal"
					>
						<X className="size-5" />
					</button>
				</div>

				<div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-5 sm:p-6">
					{isView && allocation ? (
						<div className="space-y-5">
							<div className="grid gap-3 md:grid-cols-3">
								{[
									["Student", allocation.studentName],
									["Matric No", allocation.matricNo],
									["Level", allocation.level],
									["Gender", allocation.gender],
									["Hostel", allocation.hostel],
									["Room", allocation.room],
									["Bed", allocation.bed || "No bed selected"],
									["Payment", allocation.paymentStatus],
									["Status", allocation.status],
									["Allocated By", allocation.allocatedBy],
									["Last Updated", formatDate(allocation.updatedAt)],
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
									Allocation Note
								</p>
								<p className="mt-2 text-sm font-semibold leading-6 text-[#60728f]">
									{allocation.note || "No allocation note has been recorded."}
								</p>
							</div>
						</div>
					) : (
						<div className="grid gap-3 md:grid-cols-2">
							<input
								value={draft.studentName}
								onChange={(event) =>
									onDraftChange({ ...draft, studentName: event.target.value })
								}
								placeholder="Student name"
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							/>
							<input
								value={draft.matricNo}
								onChange={(event) =>
									onDraftChange({ ...draft, matricNo: event.target.value })
								}
								placeholder="Matric or admission number"
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							/>
							<input
								value={draft.level}
								onChange={(event) => onDraftChange({ ...draft, level: event.target.value })}
								placeholder="Level, e.g. ND 1"
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							/>
							<select
								value={draft.gender}
								onChange={(event) =>
									onDraftChange({ ...draft, gender: event.target.value as HostelGender })
								}
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							>
								{GENDER_OPTIONS.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
							<select
								value={draft.hostel}
								onChange={(event) =>
									onDraftChange({ ...draft, hostel: event.target.value, room: "" })
								}
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							>
								{hostelOptions.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
							<select
								value={draft.room}
								onChange={(event) => onDraftChange({ ...draft, room: event.target.value })}
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							>
								<option value="">Select room</option>
								{roomOptions.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
							<input
								value={draft.bed}
								onChange={(event) => onDraftChange({ ...draft, bed: event.target.value })}
								placeholder="Bed label, e.g. Bed 3"
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							/>
							<input
								value={draft.allocatedBy}
								onChange={(event) =>
									onDraftChange({ ...draft, allocatedBy: event.target.value })
								}
								placeholder="Allocated by"
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							/>
							<select
								value={draft.paymentStatus}
								onChange={(event) =>
									onDraftChange({
										...draft,
										paymentStatus: event.target.value as AllocationItem["paymentStatus"],
									})
								}
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							>
								{PAYMENT_STATUSES.map((option) => (
									<option key={option} value={option}>
										{option} payment
									</option>
								))}
							</select>
							<select
								value={draft.status}
								onChange={(event) =>
									onDraftChange({ ...draft, status: event.target.value as AllocationStatus })
								}
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							>
								{ALLOCATION_STATUSES.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
							<textarea
								value={draft.note}
								onChange={(event) => onDraftChange({ ...draft, note: event.target.value })}
								placeholder="Allocation note"
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
								disabled={!canSave || !draft.studentName.trim() || !draft.matricNo.trim() || !draft.hostel.trim() || !draft.room.trim()}
								className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866] disabled:cursor-not-allowed disabled:opacity-50"
							>
								{mode === "create" ? <Plus className="size-4" /> : <Edit3 className="size-4" />}
								{mode === "create" ? "Create allocation" : "Save allocation"}
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function HostelModal({
	mode,
	hostel,
	draft,
	canSave,
	isSaving,
	onClose,
	onDraftChange,
	onSave,
}: {
	mode: HostelModalMode | null;
	hostel: HostelItem | null;
	draft: HostelDraft;
	canSave: boolean;
	isSaving: boolean;
	onClose: () => void;
	onDraftChange: (draft: HostelDraft) => void;
	onSave: () => Promise<void>;
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
								disabled={isSaving || !canSave || !draft.name.trim()}
								className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866] disabled:cursor-not-allowed disabled:opacity-50"
							>
								{mode === "create" ? <Plus className="size-4" /> : <Edit3 className="size-4" />}
								{isSaving
									? "Saving..."
									: mode === "create"
										? "Create hostel"
										: "Save hostel"}
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
	collegeSlug,
	domain,
}: HostelModuleWorkspaceProps) {
	const isStudentDomain = domain === "student";
	const [hostels, setHostels] = useState<HostelItem[]>([]);
	const [rooms, setRooms] = useState<RoomItem[]>([]);
	const [allocations, setAllocations] = useState<AllocationItem[]>([]);
	const [maintenanceRequests, setMaintenanceRequests] = useState<
		MaintenanceRequestItem[]
	>([]);
	const [hostelPayments, setHostelPayments] = useState<HostelPaymentRecord[]>([]);
	const [isLiveLoading, setIsLiveLoading] = useState(true);
	const [liveError, setLiveError] = useState("");
	const [isPayingHostel, setIsPayingHostel] = useState(false);
	const [hostelPaymentMessage, setHostelPaymentMessage] = useState("");
	const [activeView, setActiveView] = useState<HostelView>(
		isStudentDomain ? "dashboard" : "manage",
	);
	const [selectedHostel, setSelectedHostel] = useState<HostelItem | null>(null);
	const [selectedRoomId, setSelectedRoomId] = useState("");
	const [selectedBed, setSelectedBed] = useState("");
	const [studentAllocation, setStudentAllocation] = useState<AllocationItem | null>(null);
	const [studentPayment, setStudentPayment] = useState<HostelPaymentRecord | null>(null);
	const [studentMaintenanceRequests, setStudentMaintenanceRequests] = useState<
		MaintenanceRequestItem[]
	>([]);
	const [modalMode, setModalMode] = useState<HostelModalMode | null>(null);
	const [modalHostel, setModalHostel] = useState<HostelItem | null>(null);
	const [hostelDraft, setHostelDraft] = useState<HostelDraft>(getHostelDraft());
	const [isSavingHostel, setIsSavingHostel] = useState(false);
	const isSavingHostelRef = useRef(false);
	const [roomModalMode, setRoomModalMode] = useState<RoomModalMode | null>(null);
	const [modalRoom, setModalRoom] = useState<RoomItem | null>(null);
	const [roomDraft, setRoomDraft] = useState<RoomDraft>(getRoomDraft());
	const [isSavingRoom, setIsSavingRoom] = useState(false);
	const isSavingRoomRef = useRef(false);
	const [allocationModalMode, setAllocationModalMode] =
		useState<AllocationModalMode | null>(null);
	const [modalAllocation, setModalAllocation] = useState<AllocationItem | null>(null);
	const [allocationDraft, setAllocationDraft] =
		useState<AllocationDraft>(getAllocationDraft());
	const [maintenanceModalMode, setMaintenanceModalMode] =
		useState<MaintenanceModalMode | null>(null);
	const [modalMaintenanceRequest, setModalMaintenanceRequest] =
		useState<MaintenanceRequestItem | null>(null);
	const [maintenanceDraft, setMaintenanceDraft] =
		useState<MaintenanceRequestDraft>(getMaintenanceDraft());
	const [modalHostelPayment, setModalHostelPayment] =
		useState<HostelPaymentRecord | null>(null);
	const canManage = useMemo(
		() =>
			!isStudentDomain &&
			(hasPermissions(permissions, ["hostels.create"]) ||
				hasPermissions(permissions, ["hostels.view"]) ||
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
	const canSaveAllocation = hasPermissions(permissions, ["hostels.allocate"], {
		mode: "any",
	});
	const canSaveMaintenance = hasPermissions(permissions, ["hostels.update"], {
		mode: "any",
	});
	const activeHostel = selectedHostel ?? hostels[0];

	async function refreshLiveHostels() {
		setLiveError("");

		try {
			const payload = await loadHostelData(collegeSlug);
			const nextHostels = payload.hostels.map(mapLiveHostel);
			const nextRooms = payload.rooms.map(mapLiveRoom);
			const nextAllocations = payload.allocations.map(mapLiveAllocation);
			const nextComplaints = payload.complaints.map(mapLiveComplaint);
			const nextPayments = payload.allocations.map(mapLivePayment);

			setHostels(nextHostels);
			setSelectedHostel((current) => {
				if (!nextHostels.length) return null;
				if (!current) return nextHostels[0] ?? null;
				return nextHostels.find((hostel) => hostel.id === current.id) ?? nextHostels[0] ?? null;
			});
			setRooms(nextRooms);
			setAllocations(nextAllocations);
			setMaintenanceRequests(nextComplaints);
			setHostelPayments(nextPayments);

			if (isStudentDomain) {
				const allocation = nextAllocations[0] ?? null;
				setStudentAllocation(allocation);
				setStudentPayment(nextPayments[0] ?? null);
				setStudentMaintenanceRequests(nextComplaints);
			}
		} catch (error) {
			setLiveError(
				error instanceof Error
					? error.message
					: "Unable to load live hostel data.",
			);
		} finally {
			setIsLiveLoading(false);
		}
	}

	useEffect(() => {
		let isMounted = true;

		loadHostelData(collegeSlug)
			.then((payload) => {
				if (!isMounted) return;
				const nextHostels = payload.hostels.map(mapLiveHostel);
				const nextRooms = payload.rooms.map(mapLiveRoom);
				const nextAllocations = payload.allocations.map(mapLiveAllocation);
				const nextComplaints = payload.complaints.map(mapLiveComplaint);
				const nextPayments = payload.allocations.map(mapLivePayment);

				setHostels(nextHostels);
				setSelectedHostel(nextHostels[0] ?? null);
				setRooms(nextRooms);
				setAllocations(nextAllocations);
				setMaintenanceRequests(nextComplaints);
				setHostelPayments(nextPayments);

				if (isStudentDomain) {
					setStudentAllocation(nextAllocations[0] ?? null);
					setStudentPayment(nextPayments[0] ?? null);
					setStudentMaintenanceRequests(nextComplaints);
				}
			})
			.catch((error) => {
				if (!isMounted) return;
				setLiveError(
					error instanceof Error
						? error.message
						: "Unable to load live hostel data.",
				);
			})
			.finally(() => {
				if (isMounted) setIsLiveLoading(false);
			});

		return () => {
			isMounted = false;
		};
	}, [collegeSlug, isStudentDomain]);

	function viewHostel(hostel: HostelItem) {
		setSelectedHostel(hostel);
		setActiveView("details");
	}

	function bookHostel(hostel: HostelItem) {
		setSelectedHostel(hostel);
		setSelectedRoomId("");
		setSelectedBed("");
		setActiveView("booking");
	}

	function selectBookingRoom(roomId: string) {
		setSelectedRoomId(roomId);
		setSelectedBed("");
	}

	async function confirmStudentBooking() {
		if (!selectedHostel || !selectedRoomId || !selectedBed) {
			return;
		}

		const now = new Date().toISOString();
		const amount = Number(selectedHostel.fee.replace(/[^\d]/g, "")) || 0;
		const room = rooms.find(
			(item) => item.hostel === selectedHostel.name && item.id === selectedRoomId,
		);
		const liveBedId = room?.bedIdsByLabel?.[selectedBed];

		if (liveBedId) {
			try {
				const result = await reserveHostelBedRecord(collegeSlug, {
					bedId: liveBedId,
					studentName: "Current Student",
					studentIdentifier: "Current Student",
					level: "Current Level",
				});
				const nextAllocation = mapLiveAllocation(result.allocation);
				const nextPayment = mapLivePayment(result.allocation);

				setStudentAllocation(nextAllocation);
				setStudentPayment(nextPayment);
				await refreshLiveHostels();
				setActiveView("payment");
				return;
			} catch (error) {
				setLiveError(
					error instanceof Error
						? error.message
						: "Unable to reserve this bed. Please choose another bed.",
				);
				return;
			}
		}

		const nextAllocation: AllocationItem = {
			id: "student-allocation-ui",
			studentName: "Current Student",
			matricNo: "Student Profile",
			level: "Current Level",
			gender: selectedHostel.gender,
			hostel: selectedHostel.name,
			room: selectedRoomId,
			bed: selectedBed,
			paymentStatus: "Pending",
			status: "Pending",
			allocatedBy: "Student self-service",
			updatedAt: now,
			note: "Bed reserved. Complete hostel payment to confirm allocation.",
		};
		const nextPayment: HostelPaymentRecord = {
			id: "student-hostel-payment-ui",
			invoiceNo: "HST-UI-0001",
			reference: `HST-UI-${selectedHostel.id.toUpperCase()}-${selectedRoomId}-${selectedBed.replace(" ", "")}`,
			studentName: nextAllocation.studentName,
			matricNo: nextAllocation.matricNo,
			level: nextAllocation.level,
			hostel: selectedHostel.name,
			room: selectedRoomId,
			bed: selectedBed,
			amount,
			currency: "NGN",
			paymentStatus: "Pending",
			invoiceStatus: "Issued",
			channel: "Card",
			issuedAt: now,
			updatedAt: now,
			verifiedBy: "Self-service UI",
			note: "Generated after student selected hostel, room, and bed.",
		};

		setStudentAllocation(nextAllocation);
		setStudentPayment(nextPayment);
		setActiveView("payment");
	}

	async function completeStudentPayment() {
		if (!studentAllocation || !studentPayment || isPayingHostel) {
			return;
		}

		if (studentPayment.paymentStatus === "Paid") {
			setActiveView("allocation");
			return;
		}

		setIsPayingHostel(true);
		setHostelPaymentMessage("Preparing secure Paystack checkout...");
		setLiveError("");

		try {
			const payment = await initializeHostelPayment(collegeSlug, {
				allocationId: studentAllocation.id,
				email: studentPayment.matricNo.includes("@")
					? studentPayment.matricNo
					: `${studentAllocation.id}@hostel.local`,
				amount: studentPayment.amount,
				currency: studentPayment.currency,
				channel: "card",
			});

			await resumeHostelPaystackPayment(payment.payment.accessCode, {
				onSuccess: async (transaction) => {
					const reference = transaction.reference ?? payment.payment.reference;
					setHostelPaymentMessage("Payment received. Verifying with Paystack...");

					try {
						const result = await verifyHostelPayment(collegeSlug, {
							allocationId: studentAllocation.id,
							reference,
							amount: studentPayment.amount,
							currency: studentPayment.currency,
						});
						const nextAllocation = mapLiveAllocation(result.allocation);
						const nextPayment = mapLivePayment(result.allocation);

						setStudentAllocation(nextAllocation);
						setStudentPayment(nextPayment);
						await refreshLiveHostels();
						setHostelPaymentMessage("Hostel payment verified.");
						setActiveView("allocation");
					} catch (error) {
						setHostelPaymentMessage(
							error instanceof Error
								? error.message
								: "Unable to verify hostel payment.",
						);
					} finally {
						setIsPayingHostel(false);
					}
				},
				onCancel: () => {
					setHostelPaymentMessage(
						"Payment was cancelled before completion. You can try again.",
					);
					setIsPayingHostel(false);
				},
				onError: (error) => {
					setHostelPaymentMessage(
						error instanceof Error
							? error.message
							: "Paystack could not start checkout.",
					);
					setIsPayingHostel(false);
				},
			});
		} catch (error) {
			setHostelPaymentMessage(
				error instanceof Error
					? error.message
					: "Unable to start hostel payment.",
			);
			setIsPayingHostel(false);
		}
	}

	async function submitStudentMaintenance(draft: StudentMaintenanceDraft) {
		if (!studentAllocation || studentPayment?.paymentStatus !== "Paid") {
			return;
		}

		if (studentAllocation.id && studentAllocation.id !== "student-allocation-ui") {
			try {
				await createHostelComplaintRecord(collegeSlug, {
					allocationId: studentAllocation.id,
					category: draft.category,
					issue: draft.issue.trim(),
					description: draft.description.trim(),
					priority: draft.priority,
				});
				await refreshLiveHostels();
				return;
			} catch (error) {
				setLiveError(
					error instanceof Error
						? error.message
						: "Unable to submit hostel complaint.",
				);
				return;
			}
		}

		const now = new Date().toISOString();
		const nextRequest: MaintenanceRequestItem = {
			id: `student-mnt-${Date.now()}`,
			studentName: studentAllocation.studentName,
			matricNo: studentAllocation.matricNo,
			hostel: studentAllocation.hostel,
			room: studentAllocation.room,
			bed: studentAllocation.bed,
			category: draft.category,
			issue: draft.issue.trim(),
			description: draft.description.trim(),
			priority: draft.priority,
			status: "Open",
			assignedTo: "Maintenance Desk",
			reportedAt: now,
			updatedAt: now,
			resolutionNote: "",
		};

		setStudentMaintenanceRequests((current) => [nextRequest, ...current]);
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
		isSavingHostelRef.current = false;
		setIsSavingHostel(false);
		setModalMode(null);
		setModalHostel(null);
	}

	async function saveHostel() {
		if (!canSaveHostel || !hostelDraft.name.trim() || isSavingHostelRef.current) {
			return;
		}

		isSavingHostelRef.current = true;
		setIsSavingHostel(true);
		setLiveError("");

		if (modalMode === "create") {
			try {
				await createHostelRecord(collegeSlug, {
					name: hostelDraft.name.trim(),
					code: hostelDraft.name.trim(),
					gender: hostelDraft.gender,
					warden: hostelDraft.warden.trim(),
					fee: Number(hostelDraft.fee.replace(/[^\d.]/g, "")) || 0,
					currency: "NGN",
					amenities: parseCsvList(hostelDraft.amenities),
					status:
						hostelDraft.status === "maintenance" ? "maintenance" : "active",
				});
				await refreshLiveHostels();
				closeHostelModal();
				return;
			} catch (error) {
				setLiveError(
					error instanceof Error ? error.message : "Unable to create hostel.",
				);
				return;
			} finally {
				isSavingHostelRef.current = false;
				setIsSavingHostel(false);
			}
		}

		if (modalMode === "edit" && modalHostel) {
			try {
				await updateHostelRecord(collegeSlug, modalHostel.id, {
					name: hostelDraft.name.trim(),
					code: hostelDraft.name.trim(),
					gender: hostelDraft.gender,
					warden: hostelDraft.warden.trim(),
					fee: Number(hostelDraft.fee.replace(/[^\d.]/g, "")) || 0,
					currency: "NGN",
					amenities: parseCsvList(hostelDraft.amenities),
					status:
						hostelDraft.status === "maintenance" ? "maintenance" : "active",
				});
				await refreshLiveHostels();
				closeHostelModal();
				return;
			} catch (error) {
				setLiveError(
					error instanceof Error ? error.message : "Unable to update hostel.",
				);
				return;
			} finally {
				isSavingHostelRef.current = false;
				setIsSavingHostel(false);
			}
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
			current.map((hostel) =>
				hostel.id === nextHostel.id ? nextHostel : hostel,
			),
		);
		setSelectedHostel(nextHostel);
		closeHostelModal();
	}

	function openCreateRoomModal() {
		setModalRoom(null);
		setRoomDraft({ ...getRoomDraft(), hostel: hostels[0]?.name ?? "" });
		setRoomModalMode("create");
	}

	function openRoomModal(room: RoomItem, mode: Exclude<RoomModalMode, "create">) {
		setModalRoom(room);
		setRoomDraft(getRoomDraft(room));
		setRoomModalMode(mode);
	}

	function closeRoomModal() {
		isSavingRoomRef.current = false;
		setIsSavingRoom(false);
		setRoomModalMode(null);
		setModalRoom(null);
	}

	async function saveRoom() {
		if (
			!canSaveRoom ||
			!roomDraft.id.trim() ||
			!roomDraft.hostel.trim() ||
			isSavingRoomRef.current
		) {
			return;
		}

		isSavingRoomRef.current = true;
		setIsSavingRoom(true);
		setLiveError("");

		if (roomModalMode === "create") {
			const hostel = hostels.find((item) => item.name === roomDraft.hostel.trim());

			if (hostel) {
				try {
					await createHostelRoomRecord(collegeSlug, {
						hostelId: hostel.id,
						roomNumber: roomDraft.id.trim().toUpperCase(),
						block: roomDraft.block.trim(),
						floor: roomDraft.floor.trim(),
						capacity: Number(roomDraft.beds) || 0,
						status:
							roomDraft.status === "Maintenance" ? "maintenance" : "active",
						wardenNote: roomDraft.wardenNote.trim(),
					});
					await refreshLiveHostels();
					closeRoomModal();
					return;
				} catch (error) {
					setLiveError(
						error instanceof Error ? error.message : "Unable to create room.",
					);
					return;
				} finally {
					isSavingRoomRef.current = false;
					setIsSavingRoom(false);
				}
			}
		}

		if (roomModalMode === "edit" && modalRoom) {
			try {
				await updateHostelRoomRecord(
					collegeSlug,
					modalRoom.recordId ?? modalRoom.id,
					{
						roomNumber: roomDraft.id.trim().toUpperCase(),
						block: roomDraft.block.trim(),
						floor: roomDraft.floor.trim(),
						capacity: Number(roomDraft.beds) || modalRoom.beds,
						status:
							roomDraft.status === "Maintenance" ? "maintenance" : "active",
						wardenNote: roomDraft.wardenNote.trim(),
					},
				);
				await refreshLiveHostels();
				closeRoomModal();
				return;
			} catch (error) {
				setLiveError(
					error instanceof Error ? error.message : "Unable to update room.",
				);
				return;
			} finally {
				isSavingRoomRef.current = false;
				setIsSavingRoom(false);
			}
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

	function openAllocationModal(
		allocation: AllocationItem,
		mode: Exclude<AllocationModalMode, "create">,
	) {
		setModalAllocation(allocation);
		setAllocationDraft(getAllocationDraft(allocation));
		setAllocationModalMode(mode);
	}

	function closeAllocationModal() {
		setAllocationModalMode(null);
		setModalAllocation(null);
	}

	function saveAllocation() {
		if (
			!canSaveAllocation ||
			!allocationDraft.studentName.trim() ||
			!allocationDraft.matricNo.trim() ||
			!allocationDraft.hostel.trim() ||
			!allocationDraft.room.trim()
		) {
			return;
		}

		const nextAllocation: AllocationItem = {
			id: modalAllocation?.id ?? `alloc-${Date.now()}`,
			studentName: allocationDraft.studentName.trim(),
			matricNo: allocationDraft.matricNo.trim().toUpperCase(),
			level: allocationDraft.level.trim() || "Unassigned level",
			gender: allocationDraft.gender,
			hostel: allocationDraft.hostel.trim(),
			room: allocationDraft.room.trim().toUpperCase(),
			bed: allocationDraft.bed.trim(),
			paymentStatus: allocationDraft.paymentStatus,
			status: allocationDraft.status,
			allocatedBy: allocationDraft.allocatedBy.trim() || "Hostel Admin",
			updatedAt: new Date().toISOString(),
			note: allocationDraft.note.trim(),
		};

		setAllocations((current) =>
			allocationModalMode === "create"
				? [...current, nextAllocation]
				: current.map((allocation) =>
						allocation.id === nextAllocation.id ? nextAllocation : allocation,
					),
		);
		closeAllocationModal();
	}

	function openMaintenanceModal(
		request: MaintenanceRequestItem,
		mode: MaintenanceModalMode,
	) {
		setModalMaintenanceRequest(request);
		setMaintenanceDraft(getMaintenanceDraft(request));
		setMaintenanceModalMode(mode);
	}

	function closeMaintenanceModal() {
		setMaintenanceModalMode(null);
		setModalMaintenanceRequest(null);
	}

	async function saveMaintenanceRequest() {
		if (
			!canSaveMaintenance ||
			!modalMaintenanceRequest ||
			!maintenanceDraft.assignedTo.trim()
		) {
			return;
		}

		if (modalMaintenanceRequest.id && !modalMaintenanceRequest.id.startsWith("mnt-")) {
			try {
				await updateHostelComplaintRecord(collegeSlug, modalMaintenanceRequest.id, {
					status: maintenanceDraft.status,
					priority: maintenanceDraft.priority,
					assignedTo: maintenanceDraft.assignedTo.trim(),
					resolutionNote: maintenanceDraft.resolutionNote.trim(),
				});
				await refreshLiveHostels();
				closeMaintenanceModal();
				return;
			} catch (error) {
				setLiveError(
					error instanceof Error
						? error.message
						: "Unable to update hostel complaint.",
				);
				return;
			}
		}

		const nextRequest: MaintenanceRequestItem = {
			...modalMaintenanceRequest,
			status: maintenanceDraft.status,
			priority: maintenanceDraft.priority,
			assignedTo: maintenanceDraft.assignedTo.trim(),
			resolutionNote: maintenanceDraft.resolutionNote.trim(),
			updatedAt: new Date().toISOString(),
		};

		setMaintenanceRequests((current) =>
			current.map((request) =>
				request.id === nextRequest.id ? nextRequest : request,
			),
		);
		setModalMaintenanceRequest(nextRequest);
		closeMaintenanceModal();
	}

	function viewAllocationFromMaintenance(request: MaintenanceRequestItem) {
		const allocation = allocations.find(
			(item) =>
				item.matricNo === request.matricNo ||
				(item.hostel === request.hostel && item.room === request.room),
		);

		if (allocation) {
			closeMaintenanceModal();
			openAllocationModal(allocation, "view");
			return;
		}

		setAllocationDraft({
			...getAllocationDraft(),
			studentName: request.studentName,
			matricNo: request.matricNo,
			hostel: request.hostel,
			room: request.room,
			bed: request.bed,
			status: "Review",
			note: `Created from maintenance request ${request.id}: ${request.issue}`,
		});
		setModalAllocation(null);
		closeMaintenanceModal();
		setAllocationModalMode("create");
	}

	function openHostelPaymentModal(payment: HostelPaymentRecord) {
		setModalHostelPayment(payment);
	}

	function closeHostelPaymentModal() {
		setModalHostelPayment(null);
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
			return (
				<AllocationsView
					allocations={allocations}
					hostels={hostels}
					rooms={rooms}
					permissions={permissions}
					onView={(allocation) => openAllocationModal(allocation, "view")}
					onEdit={(allocation) => openAllocationModal(allocation, "edit")}
				/>
			);
		}

		if (!isStudentDomain && activeView === "payment") {
			return (
				<AdminHostelPaymentView
					payments={hostelPayments}
					allocations={allocations}
					hostels={hostels}
					permissions={permissions}
					onView={openHostelPaymentModal}
					onPrint={printHostelPaymentInvoice}
					onExport={exportHostelPaymentCsv}
				/>
			);
		}

		if (!isStudentDomain && activeView === "maintenance") {
			return (
				<AdminMaintenanceView
					requests={maintenanceRequests}
					allocations={allocations}
					hostels={hostels}
					permissions={permissions}
					onView={(request) => openMaintenanceModal(request, "view")}
					onManage={(request) => openMaintenanceModal(request, "manage")}
					onViewAllocation={viewAllocationFromMaintenance}
				/>
			);
		}

		if (activeView === "browse") {
			return <BrowseView hostels={hostels} onView={viewHostel} onBook={bookHostel} />;
		}

		if (activeView === "details") {
			if (!activeHostel) {
				return <BrowseView hostels={hostels} onView={viewHostel} onBook={bookHostel} />;
			}

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
					rooms={rooms}
					selectedRoomId={selectedRoomId}
					selectedBed={selectedBed}
					onChooseHostel={bookHostel}
					onSelectRoom={selectBookingRoom}
					onSelectBed={setSelectedBed}
					onConfirm={confirmStudentBooking}
				/>
			);
		}

		if (activeView === "allocation") {
			return (
				<AllocationView
					allocation={studentAllocation}
					payment={studentPayment}
					onBrowse={() => setActiveView("browse")}
					onPayment={() => setActiveView("payment")}
					onMaintenance={() => setActiveView("maintenance")}
				/>
			);
		}

		if (activeView === "payment") {
			return (
				<StudentPaymentView
					allocation={studentAllocation}
					payment={studentPayment}
					onPay={completeStudentPayment}
					isPaying={isPayingHostel}
					paymentMessage={hostelPaymentMessage}
					onBrowse={() => setActiveView("browse")}
					onAllocation={() => setActiveView("allocation")}
				/>
			);
		}

		if (activeView === "maintenance") {
			return (
				<StudentMaintenanceView
					allocation={studentAllocation}
					payment={studentPayment}
					requests={studentMaintenanceRequests}
					onSubmit={submitStudentMaintenance}
					onBrowse={() => setActiveView("browse")}
					onPayment={() => setActiveView("payment")}
				/>
			);
		}

		return (
			<DashboardView
				collegeName={collegeName}
				hostels={hostels}
				onApply={() => setActiveView("booking")}
				onBrowse={() => setActiveView("browse")}
				onView={viewHostel}
				onBook={bookHostel}
				onMaintenance={() => setActiveView("maintenance")}
			/>
		);
	}

	return (
		<div className="rounded-[1.5rem] border border-[#dbe5f1] bg-white p-3 shadow-sm sm:p-4 xl:p-5">
			<div className="space-y-5">
				{isLiveLoading ? (
					<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] px-4 py-3 text-sm font-bold text-[#0D2B55]">
						Loading live hostel data...
					</div>
				) : null}
				{liveError ? (
					<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
						{liveError}
					</div>
				) : null}
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
				isSaving={isSavingHostel}
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
				isSaving={isSavingRoom}
				onClose={closeRoomModal}
				onDraftChange={setRoomDraft}
				onSave={saveRoom}
			/>
			<AllocationModal
				mode={allocationModalMode}
				allocation={modalAllocation}
				draft={allocationDraft}
				hostels={hostels}
				rooms={rooms}
				canSave={canSaveAllocation}
				onClose={closeAllocationModal}
				onDraftChange={setAllocationDraft}
				onSave={saveAllocation}
			/>
			<MaintenanceRequestModal
				mode={maintenanceModalMode}
				request={modalMaintenanceRequest}
				draft={maintenanceDraft}
				canSave={canSaveMaintenance}
				onClose={closeMaintenanceModal}
				onDraftChange={setMaintenanceDraft}
				onSave={saveMaintenanceRequest}
				onViewAllocation={viewAllocationFromMaintenance}
			/>
			<HostelPaymentModal
				payment={modalHostelPayment}
				onClose={closeHostelPaymentModal}
				onPrint={printHostelPaymentInvoice}
				onExport={exportHostelPaymentCsv}
			/>
		</div>
	);
}
