import type {
	PaymentInvoice,
	PaymentLedgerResponse,
	PaymentLedgerSummary,
} from "@/features/payments/types/payment-ledger.types";

const PAYMENT_INVOICES: PaymentInvoice[] = [
	{
		id: "inv-adm-kwara-001",
		invoiceNumber: "INV-KSCAS-ADM-2026-0001",
		collegeSlug: "kwara-applied-sciences",
		collegeName: "Kwara Applied Sciences",
		studentId: "STU-KSCAS-0001",
		payerName: "Kwara Student",
		payerEmail: "student.kwara@iums.test",
		module: "admission",
		description: "Undergraduate admission application fee",
		amount: 16500,
		currency: "NGN",
		status: "paid",
		paidAt: "2026-06-03T12:12:00.000Z",
		createdAt: "2026-06-03T12:08:00.000Z",
		transactions: [
			{
				id: "txn-adm-kwara-001",
				reference: "ADM-1780071414887-MQEEQO",
				gateway: "paystack",
				channel: "card",
				amount: 16500,
				currency: "NGN",
				status: "success",
				gatewayStatus: "success",
				gatewayMessage: "Transaction verified successfully",
				paidAt: "2026-06-03T12:12:00.000Z",
				verifiedAt: "2026-06-03T12:13:00.000Z",
			},
		],
		ledgerEntries: [
			{
				id: "led-adm-kwara-001-charge",
				entryNumber: "LED-KSCAS-2026-0001",
				entryType: "charge",
				direction: "debit",
				amount: 16500,
				currency: "NGN",
				module: "admission",
				description: "Admission invoice raised",
				reference: "INV-KSCAS-ADM-2026-0001",
				postedAt: "2026-06-03T12:08:00.000Z",
			},
			{
				id: "led-adm-kwara-001-payment",
				entryNumber: "LED-KSCAS-2026-0002",
				entryType: "payment",
				direction: "credit",
				amount: 16500,
				currency: "NGN",
				module: "admission",
				description: "Paystack card payment received",
				reference: "ADM-1780071414887-MQEEQO",
				postedAt: "2026-06-03T12:13:00.000Z",
			},
		],
	},
	{
		id: "inv-hostel-kwara-001",
		invoiceNumber: "INV-KSCAS-HOS-2026-0042",
		collegeSlug: "kwara-applied-sciences",
		collegeName: "Kwara Applied Sciences",
		studentId: "STU-KSCAS-0001",
		payerName: "Kwara Student",
		payerEmail: "student.kwara@iums.test",
		module: "hostel",
		description: "Hostel bed space booking fee",
		amount: 45000,
		currency: "NGN",
		status: "pending",
		dueAt: "2026-06-30T23:59:00.000Z",
		createdAt: "2026-06-04T08:30:00.000Z",
		transactions: [
			{
				id: "txn-hostel-kwara-001",
				reference: "HOS-1780150000000-TRYPAY",
				gateway: "paystack",
				channel: "card",
				amount: 45000,
				currency: "NGN",
				status: "initialized",
				gatewayStatus: "pending",
				gatewayMessage: "Checkout initialized, waiting for payment",
			},
		],
		ledgerEntries: [
			{
				id: "led-hostel-kwara-001-charge",
				entryNumber: "LED-KSCAS-2026-0003",
				entryType: "charge",
				direction: "debit",
				amount: 45000,
				currency: "NGN",
				module: "hostel",
				description: "Hostel invoice raised",
				reference: "INV-KSCAS-HOS-2026-0042",
				postedAt: "2026-06-04T08:30:00.000Z",
			},
		],
	},
	{
		id: "inv-adm-bh-001",
		invoiceNumber: "INV-KSCBH-ADM-2026-0007",
		collegeSlug: "kwara-business-health",
		collegeName: "Kwara Business and Health",
		studentId: "STU-KSCBH-0007",
		payerName: "Business Health Student",
		payerEmail: "student.bh@iums.test",
		module: "admission",
		description: "Undergraduate admission application fee",
		amount: 16500,
		currency: "NGN",
		status: "failed",
		createdAt: "2026-06-02T10:10:00.000Z",
		transactions: [
			{
				id: "txn-adm-bh-001",
				reference: "ADM-1780000000000-FAILED",
				gateway: "paystack",
				channel: "card",
				amount: 16500,
				currency: "NGN",
				status: "failed",
				gatewayStatus: "failed",
				gatewayMessage: "Card authorization failed",
				verifiedAt: "2026-06-02T10:15:00.000Z",
			},
		],
		ledgerEntries: [
			{
				id: "led-adm-bh-001-charge",
				entryNumber: "LED-KSCBH-2026-0001",
				entryType: "charge",
				direction: "debit",
				amount: 16500,
				currency: "NGN",
				module: "admission",
				description: "Admission invoice raised",
				reference: "INV-KSCBH-ADM-2026-0007",
				postedAt: "2026-06-02T10:10:00.000Z",
			},
		],
	},
];

function summarize(invoices: PaymentInvoice[]): PaymentLedgerSummary {
	return invoices.reduce<PaymentLedgerSummary>(
		(summary, invoice) => {
			summary.totalInvoiced += invoice.amount;

			if (invoice.status === "paid") {
				summary.totalPaid += invoice.amount;
			}

			if (invoice.status === "pending") {
				summary.pendingAmount += invoice.amount;
			}

			if (invoice.status === "failed") {
				summary.failedCount += 1;
			}

			return summary;
		},
		{
			totalInvoiced: 0,
			totalPaid: 0,
			pendingAmount: 0,
			failedCount: 0,
			currency: "NGN",
		},
	);
}

export function getPaymentLedgerRecords({
	collegeSlug,
	scope,
	payerEmail,
}: {
	collegeSlug?: string;
	scope: "student" | "college";
	payerEmail?: string;
}): PaymentLedgerResponse {
	const collegeInvoices = PAYMENT_INVOICES.filter((invoice) =>
		collegeSlug ? invoice.collegeSlug === collegeSlug : true,
	);
	const invoices =
		scope === "student" && payerEmail
			? collegeInvoices.filter(
					(invoice) =>
						invoice.payerEmail.toLowerCase() === payerEmail.toLowerCase(),
				)
			: collegeInvoices;

	return {
		scope,
		collegeName: invoices[0]?.collegeName ?? "College payments",
		invoices,
		summary: summarize(invoices),
	};
}
