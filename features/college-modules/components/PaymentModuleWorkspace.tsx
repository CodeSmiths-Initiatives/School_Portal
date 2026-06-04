"use client";

import {
	ArrowRight,
	BadgeCheck,
	Banknote,
	CircleAlert,
	Download,
	FileText,
	LoaderCircle,
	PanelLeftClose,
	PanelLeftOpen,
	Printer,
	ReceiptText,
	Search,
	ShieldCheck,
	WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState, type ElementType } from "react";
import { fetchPaymentLedger } from "@/features/payments/services/payment-ledger.client";
import type {
	PaymentInvoice,
	PaymentInvoiceStatus,
	PaymentLedgerResponse,
	PaymentModuleKey,
} from "@/features/payments/types/payment-ledger.types";
import { formatNaira } from "@/lib/services/paystack.service";
import {
	hasPermissions,
	type PermissionKey,
	type UserPermissionKey,
} from "@/lib/rbac";

type PaymentModuleWorkspaceProps = {
	permissions: UserPermissionKey[];
	collegeName: string;
	collegeSlug: string;
};

type PaymentView = "overview" | "invoices" | "transactions" | "ledger" | "audit";

type PaymentMenuItem = {
	label: string;
	view: PaymentView;
	icon: ElementType;
	requiredPermissions: PermissionKey[];
	permissionMode?: "all" | "any";
};

const PAYMENT_MENU: PaymentMenuItem[] = [
	{
		label: "Payment Overview",
		view: "overview",
		icon: WalletCards,
		requiredPermissions: ["payments.view"],
	},
	{
		label: "Invoices",
		view: "invoices",
		icon: ReceiptText,
		requiredPermissions: ["payments.view"],
	},
	{
		label: "Transactions",
		view: "transactions",
		icon: Banknote,
		requiredPermissions: ["payments.view"],
	},
	{
		label: "Ledger Entries",
		view: "ledger",
		icon: FileText,
		requiredPermissions: ["payments.verify", "payments.export"],
		permissionMode: "any",
	},
	{
		label: "Audit Trail",
		view: "audit",
		icon: ShieldCheck,
		requiredPermissions: ["payments.verify", "payments.export"],
		permissionMode: "any",
	},
];

const STATUS_STYLES: Record<PaymentInvoiceStatus, string> = {
	pending: "border-[#f0d9ad] bg-[#fff8e9] text-[#94691a]",
	paid: "border-[#cfe9d7] bg-[#f3fbf5] text-[#177245]",
	failed: "border-[#f2cbd2] bg-[#fff5f6] text-[#a3263d]",
	cancelled: "border-[#d8e3f0] bg-[#f8fbff] text-[#60728f]",
	refunded: "border-[#d6d4ff] bg-[#f6f5ff] text-[#5146a3]",
	expired: "border-[#e5d6c9] bg-[#fff8f3] text-[#8a5d3b]",
};

function can(
	permissions: UserPermissionKey[],
	requiredPermissions: PermissionKey[],
	mode: "all" | "any" = "all",
) {
	return hasPermissions(permissions, requiredPermissions, { mode });
}

function formatDate(value?: string) {
	if (!value) return "Not posted";

	return new Intl.DateTimeFormat("en-NG", {
		year: "numeric",
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(value));
}

function moduleLabel(module: PaymentModuleKey) {
	return module
		.split("-")
		.join(" ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatusBadge({ status }: { status: PaymentInvoiceStatus }) {
	return (
		<span
			className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${STATUS_STYLES[status]}`}
		>
			{status}
		</span>
	);
}

function InvoiceCard({
	invoice,
	isSelected,
	onSelect,
}: {
	invoice: PaymentInvoice;
	isSelected: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
				isSelected ? "border-[#B7770D] ring-4 ring-[#B7770D]/10" : "border-[#dbe5f1]"
			}`}
		>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8395AF]">
						{moduleLabel(invoice.module)}
					</p>
					<h3 className="mt-2 text-base font-bold text-[#0D2B55]">
						{invoice.invoiceNumber}
					</h3>
					<p className="mt-1 text-sm leading-6 text-[#60728f]">
						{invoice.description}
					</p>
				</div>
				<StatusBadge status={invoice.status} />
			</div>
			<div className="mt-4 grid gap-3 sm:grid-cols-3">
				<div>
					<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a9ab5]">
						Amount
					</p>
					<p className="mt-1 text-xl font-bold text-[#0D2B55]">
						{formatNaira(invoice.amount)}
					</p>
				</div>
				<div>
					<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a9ab5]">
						Payer
					</p>
					<p className="mt-1 truncate text-sm font-semibold text-[#17305f]">
						{invoice.payerName}
					</p>
				</div>
				<div>
					<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a9ab5]">
						Reference
					</p>
					<p className="mt-1 truncate text-sm font-semibold text-[#17305f]">
						{invoice.transactions[0]?.reference ?? "Not started"}
					</p>
				</div>
			</div>
		</button>
	);
}

function InvoiceDetail({
	invoice,
	canPrint,
}: {
	invoice?: PaymentInvoice;
	canPrint: boolean;
}) {
	if (!invoice) {
		return (
			<div className="rounded-2xl border border-dashed border-[#d6e0ee] bg-white p-6 text-sm text-[#60728f]">
				Select an invoice to inspect payment references, transactions, and
				ledger movements.
			</div>
		);
	}

	return (
		<div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B7770D]">
						Invoice Detail
					</p>
					<h3 className="mt-2 text-xl font-bold text-[#0D2B55]">
						{invoice.invoiceNumber}
					</h3>
					<p className="mt-1 break-all text-sm text-[#60728f]">
						{invoice.payerEmail}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<StatusBadge status={invoice.status} />
					{canPrint ? (
						<button
							type="button"
							onClick={() => window.print()}
							className="inline-flex size-10 items-center justify-center rounded-xl border border-[#dbe5f1] bg-[#f8fbff] text-[#0D2B55] transition hover:bg-white"
							aria-label="Print invoice"
						>
							<Printer className="size-4" />
						</button>
					) : null}
				</div>
			</div>

			<div className="mt-5 rounded-2xl border border-[#e3eaf4] bg-[#fbfdff] p-4">
				<div className="grid gap-4 sm:grid-cols-2">
					<div>
						<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8395AF]">
							Amount
						</p>
						<p className="mt-1 text-3xl font-bold text-[#0D2B55]">
							{formatNaira(invoice.amount)}
						</p>
					</div>
					<div>
						<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8395AF]">
							Module
						</p>
						<p className="mt-2 text-base font-bold text-[#17305f]">
							{moduleLabel(invoice.module)}
						</p>
						<p className="mt-1 text-sm text-[#60728f]">
							Created {formatDate(invoice.createdAt)}
						</p>
					</div>
				</div>
			</div>

			<div className="mt-5 space-y-3">
				<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
					Transaction Trace
				</p>
				{invoice.transactions.map((transaction) => (
					<div
						key={transaction.id}
						className="rounded-xl border border-[#e3eaf4] bg-[#fbfdff] px-4 py-3"
					>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<p className="break-all text-sm font-bold text-[#0D2B55]">
								{transaction.reference}
							</p>
							<span className="rounded-full bg-[#eef4fb] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#35527d]">
								{transaction.gateway} / {transaction.channel}
							</span>
						</div>
						<p className="mt-2 text-sm text-[#60728f]">
							{transaction.gatewayMessage}
						</p>
						<p className="mt-1 text-xs font-semibold text-[#7d90aa]">
							Verified: {formatDate(transaction.verifiedAt)}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}

export default function PaymentModuleWorkspace({
	permissions,
	collegeName,
	collegeSlug,
}: PaymentModuleWorkspaceProps) {
	const [activeView, setActiveView] = useState<PaymentView>("overview");
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [ledger, setLedger] = useState<PaymentLedgerResponse | null>(null);
	const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<PaymentInvoiceStatus | "all">(
		"all",
	);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(true);

	const visibleMenu = useMemo(
		() =>
			PAYMENT_MENU.filter((item) =>
				can(permissions, item.requiredPermissions, item.permissionMode),
			),
		[permissions],
	);
	const canPrint = can(permissions, ["payments.print"], "any");
	const canExport = can(permissions, ["payments.export"], "any");

	useEffect(() => {
		let isMounted = true;
		setIsLoading(true);
		setError("");

		fetchPaymentLedger(collegeSlug)
			.then((response) => {
				if (!isMounted) return;
				setLedger(response);
				setSelectedInvoiceId(response.invoices[0]?.id ?? null);
			})
			.catch((fetchError) => {
				if (!isMounted) return;
				setError(
					fetchError instanceof Error
						? fetchError.message
						: "Unable to load payment ledger.",
				);
			})
			.finally(() => {
				if (isMounted) setIsLoading(false);
			});

		return () => {
			isMounted = false;
		};
	}, [collegeSlug]);

	const invoices = ledger?.invoices ?? [];
	const filteredInvoices = invoices.filter((invoice) => {
		const text = `${invoice.invoiceNumber} ${invoice.payerName} ${invoice.payerEmail} ${invoice.transactions[0]?.reference ?? ""}`.toLowerCase();
		const matchesSearch = !query.trim() || text.includes(query.toLowerCase());
		const matchesStatus =
			statusFilter === "all" || invoice.status === statusFilter;
		return matchesSearch && matchesStatus;
	});
	const selectedInvoice =
		filteredInvoices.find((invoice) => invoice.id === selectedInvoiceId) ??
		filteredInvoices[0];

	return (
		<div className="rounded-[1.5rem] border border-[#dbe5f1] bg-white p-3 shadow-sm sm:p-4 xl:p-5">
			<div className="grid items-start gap-5 lg:grid-cols-[auto_minmax(0,1fr)]">
				<aside
					className={`h-fit shrink-0 overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white shadow-sm transition-all duration-300 lg:sticky lg:top-0 ${
						isCollapsed ? "lg:w-[4.75rem]" : "lg:w-64"
					}`}
				>
					<div className="flex items-center justify-between gap-3 bg-[#0D2B55] px-4 py-4 text-white">
						<div className={isCollapsed ? "lg:hidden" : ""}>
							<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#E4A11B]">
								Payment Menu
							</p>
							<p className="mt-1 text-sm font-semibold text-white/90">
								Invoices and ledger
							</p>
						</div>
						<button
							type="button"
							onClick={() => setIsCollapsed((current) => !current)}
							className="flex size-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
							aria-label={isCollapsed ? "Expand payment menu" : "Collapse payment menu"}
						>
							{isCollapsed ? (
								<PanelLeftOpen className="size-4" />
							) : (
								<PanelLeftClose className="size-4" />
							)}
						</button>
					</div>

					<nav className="space-y-2 p-3">
						{visibleMenu.map((item) => {
							const Icon = item.icon;
							const isActive = activeView === item.view;

							return (
								<button
									key={item.view}
									type="button"
									onClick={() => setActiveView(item.view)}
									className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
										isActive
											? "border border-[#E4A11B]/50 bg-[#fff7e8] text-[#0D2B55]"
											: "text-[#354762] hover:bg-[#f6f9fd]"
									}`}
								>
									<span
										className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
											isActive
												? "bg-[#E4A11B]/15 text-[#B7770D]"
												: "bg-[#eef4fb] text-[#557090]"
										}`}
									>
										<Icon className="size-4.5" />
									</span>
									<span className={isCollapsed ? "lg:hidden" : ""}>
										{item.label}
									</span>
								</button>
							);
						})}
					</nav>
				</aside>

				<div className="min-w-0 space-y-5">
					<section className="overflow-hidden rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-5">
						<div className="flex flex-wrap items-start justify-between gap-4">
							<div>
								<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B7770D]">
									{collegeName}
								</p>
								<h2 className="mt-2 text-2xl font-bold text-[#0D2B55]">
									Payment Ledger
								</h2>
								<p className="mt-2 max-w-3xl text-sm leading-6 text-[#60728f]">
									Track invoices, Paystack references, transaction status, and
									accounting ledger movements for admission, hostel, and future
									fee modules.
								</p>
							</div>
							<div className="flex gap-2">
								{canExport ? (
									<button className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#dbe5f1] bg-white px-4 text-sm font-bold text-[#0D2B55] transition hover:bg-[#f8fbff]">
										<Download className="size-4" />
										Export
									</button>
								) : null}
								<button className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0D2B55] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#092244]">
									<Search className="size-4" />
									Trace Reference
								</button>
							</div>
						</div>

						<div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
							{[
								{
									label: "Total Invoiced",
									value: formatNaira(ledger?.summary.totalInvoiced ?? 0),
								},
								{
									label: "Total Paid",
									value: formatNaira(ledger?.summary.totalPaid ?? 0),
								},
								{
									label: "Pending",
									value: formatNaira(ledger?.summary.pendingAmount ?? 0),
								},
								{
									label: "Failed Attempts",
									value: String(ledger?.summary.failedCount ?? 0).padStart(2, "0"),
								},
							].map((item) => (
								<div
									key={item.label}
									className="rounded-2xl border border-[#e3eaf4] bg-white p-4"
								>
									<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8395AF]">
										{item.label}
									</p>
									<p className="mt-2 text-2xl font-bold text-[#0D2B55]">
										{item.value}
									</p>
								</div>
							))}
						</div>
					</section>

					{isLoading ? (
						<div className="flex min-h-60 items-center justify-center rounded-2xl border border-[#dbe5f1] bg-white text-[#60728f]">
							<LoaderCircle className="mr-2 size-5 animate-spin" />
							Loading payment ledger...
						</div>
					) : error ? (
						<div className="rounded-2xl border border-[#f2cbd2] bg-[#fff5f6] p-5 text-sm font-semibold text-[#a3263d]">
							<CircleAlert className="mr-2 inline size-4" />
							{error}
						</div>
					) : (
						<section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
							<div className="min-w-0 space-y-4">
								<div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#dbe5f1] bg-white p-3 shadow-sm">
									<div className="relative min-w-[16rem] flex-1">
										<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7d90aa]" />
										<input
											value={query}
											onChange={(event) => setQuery(event.target.value)}
											placeholder="Search invoice, payer, or reference"
											className="h-11 w-full rounded-xl border border-[#dbe5f1] bg-[#fbfdff] pl-10 pr-3 text-sm text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
										/>
									</div>
									<select
										value={statusFilter}
										onChange={(event) =>
											setStatusFilter(
												event.target.value as PaymentInvoiceStatus | "all",
											)
										}
										className="h-11 rounded-xl border border-[#dbe5f1] bg-[#fbfdff] px-3 text-sm font-semibold text-[#35527d] outline-none"
									>
										<option value="all">All status</option>
										<option value="paid">Paid</option>
										<option value="pending">Pending</option>
										<option value="failed">Failed</option>
										<option value="refunded">Refunded</option>
									</select>
								</div>

								<div className="space-y-3">
									{filteredInvoices.length > 0 ? (
										filteredInvoices.map((invoice) => (
											<InvoiceCard
												key={invoice.id}
												invoice={invoice}
												isSelected={selectedInvoice?.id === invoice.id}
												onSelect={() => setSelectedInvoiceId(invoice.id)}
											/>
										))
									) : (
										<div className="rounded-2xl border border-dashed border-[#d6e0ee] bg-white p-8 text-center text-sm text-[#60728f]">
											No payment records match this filter.
										</div>
									)}
								</div>
							</div>

							<div className="space-y-4">
								<InvoiceDetail invoice={selectedInvoice} canPrint={canPrint} />

								{selectedInvoice ? (
									<div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
										<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
											Ledger Movement
										</p>
										<div className="mt-4 space-y-3">
											{selectedInvoice.ledgerEntries.map((entry) => (
												<div
													key={entry.id}
													className="flex items-center justify-between gap-3 rounded-xl border border-[#e3eaf4] bg-[#fbfdff] px-4 py-3"
												>
													<div>
														<p className="text-sm font-bold text-[#0D2B55]">
															{entry.description}
														</p>
														<p className="mt-1 text-xs text-[#60728f]">
															{entry.entryNumber} / {formatDate(entry.postedAt)}
														</p>
													</div>
													<div className="text-right">
														<p className="text-sm font-bold text-[#0D2B55]">
															{formatNaira(entry.amount)}
														</p>
														<p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8395AF]">
															{entry.direction}
														</p>
													</div>
												</div>
											))}
										</div>
									</div>
								) : null}
							</div>
						</section>
					)}

					{activeView === "audit" ? (
						<div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 text-sm text-[#60728f] shadow-sm">
							<BadgeCheck className="mr-2 inline size-4 text-[#16803c]" />
							Audit events will be written from payment initialize, verification,
							refund, print, and export actions when the live Strapi persistence
							service is connected.
							<ArrowRight className="ml-2 inline size-4 text-[#B7770D]" />
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}
