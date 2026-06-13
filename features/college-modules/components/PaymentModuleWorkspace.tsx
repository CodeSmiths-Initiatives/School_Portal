"use client";

import {
	ArrowRight,
	BadgeCheck,
	CalendarDays,
	CircleAlert,
	Download,
	Eye,
	Filter,
	LoaderCircle,
	Printer,
	ReceiptText,
	Search,
	X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { RowActionMenu } from "@/components/ui/row-action-menu";
import { fetchPaymentLedger } from "@/features/payments/services/payment-ledger.client";
import type {
	PaymentInvoice,
	PaymentInvoiceStatus,
	PaymentLedgerResponse,
	PaymentModuleKey,
} from "@/features/payments/types/payment-ledger.types";
import { printPaymentInvoice } from "@/features/payments/utils/printPaymentInvoice";
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

/*
const PAYMENT_MENU = [...]
Payment menu is intentionally hidden so the ledger workspace can use the full
dashboard width while keeping payment data, filters, and invoice actions visible.
*/

const STATUS_STYLES: Record<PaymentInvoiceStatus, string> = {
	pending: "border-[#f0d9ad] bg-[#fff8e9] text-[#94691a]",
	paid: "border-[#cfe9d7] bg-[#f3fbf5] text-[#177245]",
	failed: "border-[#f2cbd2] bg-[#fff5f6] text-[#a3263d]",
	cancelled: "border-[#d8e3f0] bg-[#f8fbff] text-[#60728f]",
	refunded: "border-[#d6d4ff] bg-[#f6f5ff] text-[#5146a3]",
	expired: "border-[#e5d6c9] bg-[#fff8f3] text-[#8a5d3b]",
};

const PAGE_SIZE = 20;

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

function InvoiceDetail({
	invoice,
	canPrint,
	collegeName,
}: {
	invoice?: PaymentInvoice;
	canPrint: boolean;
	collegeName: string;
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
							onClick={() => printPaymentInvoice(invoice, collegeName)}
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

function quoteCsv(value: unknown) {
	const text = String(value ?? "").replaceAll("\"", "\"\"");
	return `"${text}"`;
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
	if (rows.length === 0) return;

	const headers = Object.keys(rows[0] ?? {});
	const csv = [
		headers.map(quoteCsv).join(","),
		...rows.map((row) => headers.map((header) => quoteCsv(row[header])).join(",")),
	].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");

	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

function invoiceCsvRow(invoice: PaymentInvoice) {
	const latestTransaction = invoice.transactions[0];

	return {
		invoiceNumber: invoice.invoiceNumber,
		payerName: invoice.payerName,
		payerEmail: invoice.payerEmail,
		module: moduleLabel(invoice.module),
		description: invoice.description,
		status: invoice.status,
		amount: invoice.amount,
		currency: invoice.currency,
		reference: latestTransaction?.reference ?? "",
		transactionStatus: latestTransaction?.status ?? "",
		createdAt: invoice.createdAt,
		paidAt: invoice.paidAt ?? "",
		dueAt: invoice.dueAt ?? "",
	};
}

export default function PaymentModuleWorkspace({
	permissions,
	collegeName,
	collegeSlug,
}: PaymentModuleWorkspaceProps) {
	const [ledger, setLedger] = useState<PaymentLedgerResponse | null>(null);
	const [detailInvoice, setDetailInvoice] = useState<PaymentInvoice | null>(null);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<PaymentInvoiceStatus | "all">(
		"all",
	);
	const [moduleFilter, setModuleFilter] = useState<PaymentModuleKey | "all">(
		"all",
	);
	const [currentPage, setCurrentPage] = useState(1);
	const [openActionsId, setOpenActionsId] = useState<string | number | null>(null);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const searchInputRef = useRef<HTMLInputElement>(null);

	const canPrint = can(permissions, ["payments.print"], "any");
	const canExport = can(permissions, ["payments.export"], "any");

	useEffect(() => {
		let isMounted = true;

		fetchPaymentLedger(collegeSlug)
			.then((response) => {
				if (!isMounted) return;
				setLedger(response);
				setError("");
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

	const invoices = useMemo(() => ledger?.invoices ?? [], [ledger]);
	const moduleOptions = useMemo(
		() =>
			Array.from(new Set(invoices.map((invoice) => invoice.module))).sort((left, right) =>
				moduleLabel(left).localeCompare(moduleLabel(right)),
			),
		[invoices],
	);
	const statusCounts = useMemo(
		() =>
			invoices.reduce(
				(counts, invoice) => {
					counts[invoice.status] = (counts[invoice.status] ?? 0) + 1;
					return counts;
				},
				{} as Partial<Record<PaymentInvoiceStatus, number>>,
			),
		[invoices],
	);
	const filteredInvoices = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();

		return invoices.filter((invoice) => {
			const latestTransaction = invoice.transactions[0];
			const text = [
				invoice.invoiceNumber,
				invoice.payerName,
				invoice.payerEmail,
				invoice.description,
				moduleLabel(invoice.module),
				latestTransaction?.reference,
				latestTransaction?.gatewayStatus,
			]
				.join(" ")
				.toLowerCase();

			return (
				(!normalizedQuery || text.includes(normalizedQuery)) &&
				(statusFilter === "all" || invoice.status === statusFilter) &&
				(moduleFilter === "all" || invoice.module === moduleFilter)
			);
		});
	}, [invoices, moduleFilter, query, statusFilter]);
	const pageCount = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
	const safePage = Math.min(currentPage, pageCount);
	const paginatedInvoices = filteredInvoices.slice(
		(safePage - 1) * PAGE_SIZE,
		safePage * PAGE_SIZE,
	);

	function updateFilter<T>(setter: (value: T) => void, value: T) {
		setter(value);
		setCurrentPage(1);
	}

	function clearFilters() {
		setQuery("");
		setStatusFilter("all");
		setModuleFilter("all");
		setCurrentPage(1);
	}

	function exportInvoices(rows: PaymentInvoice[], filename: string) {
		downloadCsv(filename, rows.map(invoiceCsvRow));
	}

	function viewInvoice(invoice: PaymentInvoice) {
		setDetailInvoice(invoice);
		setOpenActionsId(null);
	}

	function focusReferenceSearch() {
		searchInputRef.current?.focus();
	}

	return (
		<div className="rounded-[1.5rem] border border-[#dbe5f1] bg-white p-3 shadow-sm sm:p-4 xl:p-5">
			<div className="grid items-start gap-5">
				{/*
				Payment menu commented out per current scope. The ledger content below now
				uses the full available width.
				*/}
				<div className="min-w-0 space-y-5">
					<section className="overflow-hidden rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-5">
						<div className="flex flex-wrap items-start justify-between gap-4">
							<div>
								<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B7770D]">
									{collegeName}
								</p>
								<h2 className="mt-2 text-2xl font-bold text-[#0D2B55]">
									{ledger?.scope === "student"
										? "Student Payments"
										: "Payment Ledger"}
								</h2>
								<p className="mt-2 max-w-3xl text-sm leading-6 text-[#60728f]">
									Track invoices, references, transaction status, and ledger
									movements in a responsive payment table.
								</p>
							</div>
							<div className="flex gap-2">
								{canExport ? (
									<button
										type="button"
										onClick={() =>
											exportInvoices(filteredInvoices, `${collegeSlug}-payments.csv`)
										}
										disabled={filteredInvoices.length === 0}
										className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#dbe5f1] bg-white px-4 text-sm font-bold text-[#0D2B55] transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-50"
									>
										<Download className="size-4" />
										Export
									</button>
								) : null}
								<button
									type="button"
									onClick={focusReferenceSearch}
									className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0D2B55] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#092244]"
								>
									<Search className="size-4" />
									Trace Reference
								</button>
							</div>
						</div>

						<div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
								{
									label: "Paid Invoices",
									value: String(statusCounts.paid ?? 0).padStart(2, "0"),
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
						<section className="space-y-5">
							<div className="rounded-2xl border border-[#dbe5f1] bg-white p-4 shadow-sm">
								<div className="flex flex-wrap items-center justify-between gap-3">
									<div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#B7770D]">
										<Filter className="size-4" />
										Filters
									</div>
									<button
										type="button"
										onClick={clearFilters}
										className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d3dfed] bg-white px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
									>
										Reset filters
									</button>
								</div>
								<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_13rem_13rem]">
									<label className="relative">
										<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7d90aa]" />
										<input
											ref={searchInputRef}
											value={query}
											onChange={(event) => updateFilter(setQuery, event.target.value)}
											placeholder="Search invoice, payer, email, or reference"
											className="h-12 w-full rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] pl-11 pr-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
										/>
									</label>
									<select
										value={statusFilter}
										onChange={(event) =>
											updateFilter(
												setStatusFilter,
												event.target.value as PaymentInvoiceStatus | "all",
											)
										}
										className="h-12 rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] px-4 text-sm font-bold text-[#35527d] outline-none transition focus:border-[#2E86C1]"
									>
										<option value="all">All status</option>
										<option value="paid">Paid</option>
										<option value="pending">Pending</option>
										<option value="failed">Failed</option>
										<option value="cancelled">Cancelled</option>
										<option value="refunded">Refunded</option>
										<option value="expired">Expired</option>
									</select>
									<select
										value={moduleFilter}
										onChange={(event) =>
											updateFilter(
												setModuleFilter,
												event.target.value as PaymentModuleKey | "all",
											)
										}
										className="h-12 rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] px-4 text-sm font-bold text-[#35527d] outline-none transition focus:border-[#2E86C1]"
									>
										<option value="all">All modules</option>
										{moduleOptions.map((option) => (
											<option key={option} value={option}>
												{moduleLabel(option)}
											</option>
										))}
									</select>
								</div>
							</div>

							<div className="overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white shadow-sm">
								<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe5f1] px-4 py-4 sm:px-5">
									<div>
										<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B7770D]">
											Payment Table
										</p>
										<p className="mt-1 text-sm font-semibold text-[#60728f]">
											Showing {paginatedInvoices.length} of {filteredInvoices.length} payments
										</p>
									</div>
									<div className="flex items-center gap-2 rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-4 py-2 text-xs font-bold text-[#0D2B55]">
										Page {safePage} of {pageCount}
									</div>
								</div>

								{filteredInvoices.length === 0 ? (
									<div className="p-8 text-center">
										<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eef4fb] text-[#2E86C1]">
											<ReceiptText className="size-6" />
										</div>
										<h3 className="mt-4 text-lg font-bold text-[#06183A]">
											No payment records found
										</h3>
										<p className="mt-2 text-sm text-[#60728f]">
											Adjust the filters to review another set of invoices.
										</p>
									</div>
								) : (
									<>
										<div className="overflow-x-auto">
											<table className="min-w-[1080px] w-full border-collapse text-left">
												<thead className="bg-[#f8fbff]">
													<tr className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8395AF]">
														<th className="px-5 py-4">Invoice</th>
														<th className="px-5 py-4">Payer</th>
														<th className="px-5 py-4">Module</th>
														<th className="px-5 py-4">Status</th>
														<th className="px-5 py-4">Amount</th>
														<th className="px-5 py-4">Reference</th>
														<th className="px-5 py-4">Created</th>
														<th className="px-5 py-4 text-right">Actions</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-[#dbe5f1]">
													{paginatedInvoices.map((invoice) => {
														const latestTransaction = invoice.transactions[0];

														return (
															<tr
																key={invoice.id}
																className="bg-white transition hover:bg-[#f8fbff]"
															>
																<td className="px-5 py-4">
																	<p className="font-bold text-[#06183A]">
																		{invoice.invoiceNumber}
																	</p>
																	<p className="mt-1 max-w-[18rem] truncate text-sm font-semibold text-[#60728f]">
																		{invoice.description}
																	</p>
																</td>
																<td className="px-5 py-4">
																	<p className="font-bold text-[#0D2B55]">
																		{invoice.payerName}
																	</p>
																	<p className="mt-1 max-w-[13rem] truncate text-sm font-semibold text-[#60728f]">
																		{invoice.payerEmail}
																	</p>
																</td>
																<td className="px-5 py-4">
																	<p className="text-sm font-bold text-[#0D2B55]">
																		{moduleLabel(invoice.module)}
																	</p>
																</td>
																<td className="px-5 py-4">
																	<StatusBadge status={invoice.status} />
																</td>
																<td className="px-5 py-4">
																	<p className="text-sm font-bold text-[#0D2B55]">
																		{formatNaira(invoice.amount)}
																	</p>
																</td>
																<td className="px-5 py-4">
																	<p className="max-w-[14rem] truncate text-sm font-bold text-[#0D2B55]">
																		{latestTransaction?.reference ?? "Not started"}
																	</p>
																	<p className="mt-1 text-xs font-semibold text-[#60728f]">
																		{latestTransaction?.status ?? "No transaction"}
																	</p>
																</td>
																<td className="px-5 py-4">
																	<div className="flex items-center gap-2 text-sm font-semibold text-[#60728f]">
																		<CalendarDays className="size-4 text-[#8395AF]" />
																		{formatDate(invoice.createdAt)}
																	</div>
																</td>
																<td className="px-5 py-4">
																	<RowActionMenu
																		label={`Open actions for ${invoice.invoiceNumber}`}
																		open={openActionsId === invoice.id}
																		onOpenChange={(open) =>
																			setOpenActionsId(open ? invoice.id : null)
																		}
																		items={[
																			{
																				label: "View",
																				icon: <Eye className="size-4" />,
																				onSelect: () => viewInvoice(invoice),
																			},
																			{
																				label: "Print",
																				icon: <Printer className="size-4" />,
																				disabled: !canPrint,
																				onSelect: () =>
																					printPaymentInvoice(invoice, collegeName),
																			},
																			{
																				label: "Export",
																				icon: <Download className="size-4" />,
																				disabled: !canExport,
																				onSelect: () =>
																					exportInvoices(
																						[invoice],
																						`${invoice.invoiceNumber}-payment.csv`,
																					),
																			},
																		]}
																	/>
																</td>
															</tr>
														);
													})}
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
													className="h-10 rounded-xl border border-[#d3dfed] bg-white px-4 text-sm font-bold text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D] disabled:cursor-not-allowed disabled:opacity-40"
												>
													Previous
												</button>
												<button
													type="button"
													onClick={() =>
														setCurrentPage((page) => Math.min(pageCount, page + 1))
													}
													disabled={safePage === pageCount}
													className="h-10 rounded-xl bg-[#0D2B55] px-4 text-sm font-bold text-white transition hover:bg-[#123866] disabled:cursor-not-allowed disabled:opacity-40"
												>
													Next
												</button>
											</div>
										</div>
									</>
								)}
							</div>
						</section>
					)}

					<div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 text-sm text-[#60728f] shadow-sm">
						<BadgeCheck className="mr-2 inline size-4 text-[#16803c]" />
						Audit events will be written from payment initialize, verification,
						refund, print, and export actions when the live Strapi persistence
						service is connected.
						<ArrowRight className="ml-2 inline size-4 text-[#B7770D]" />
					</div>
				</div>
			</div>
			{detailInvoice ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
					<div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
						<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
							<div>
								<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#E4A11B]">
									Payment Details
								</p>
								<h2 className="mt-2 text-xl font-bold sm:text-2xl">
									{detailInvoice.invoiceNumber}
								</h2>
							</div>
							<button
								type="button"
								onClick={() => setDetailInvoice(null)}
								className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#0D2B55]"
								aria-label="Close payment details"
							>
								<X className="size-5" />
							</button>
						</div>
						<div className="max-h-[calc(90vh-6rem)] overflow-y-auto bg-[#f8fbff] p-5 sm:p-6">
							<InvoiceDetail
								invoice={detailInvoice}
								canPrint={canPrint}
								collegeName={collegeName}
							/>
							<div className="mt-5 rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
								<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
									Ledger Movement
								</p>
								<div className="mt-4 space-y-3">
									{detailInvoice.ledgerEntries.length > 0 ? (
										detailInvoice.ledgerEntries.map((entry) => (
											<div
												key={entry.id}
												className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e3eaf4] bg-[#fbfdff] px-4 py-3"
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
										))
									) : (
										<div className="rounded-xl border border-dashed border-[#d6e0ee] bg-[#fbfdff] px-4 py-3 text-sm font-semibold text-[#60728f]">
											No ledger movement has been posted for this invoice.
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
