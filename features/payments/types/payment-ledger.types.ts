export type PaymentModuleKey =
	| "admission"
	| "hostel"
	| "tuition"
	| "result"
	| "transcript"
	| "other";

export type PaymentInvoiceStatus =
	| "pending"
	| "paid"
	| "failed"
	| "cancelled"
	| "refunded"
	| "expired";

export type PaymentTransactionStatus =
	| "initialized"
	| "pending"
	| "success"
	| "failed"
	| "cancelled"
	| "abandoned"
	| "reversed";

export type PaymentLedgerDirection = "debit" | "credit";

export type PaymentLedgerEntry = {
	id: string;
	entryNumber: string;
	entryType: "charge" | "payment" | "refund" | "waiver" | "adjustment" | "reversal";
	direction: PaymentLedgerDirection;
	amount: number;
	currency: string;
	module: PaymentModuleKey;
	description: string;
	reference: string;
	postedAt: string;
};

export type PaymentTransaction = {
	id: string;
	reference: string;
	gateway: "paystack" | "manual" | "bank" | "other";
	channel: string;
	amount: number;
	currency: string;
	status: PaymentTransactionStatus;
	gatewayStatus: string;
	gatewayMessage: string;
	paidAt?: string;
	verifiedAt?: string;
};

export type PaymentInvoice = {
	id: string;
	invoiceNumber: string;
	collegeSlug: string;
	collegeName: string;
	studentId: string;
	payerName: string;
	payerEmail: string;
	module: PaymentModuleKey;
	description: string;
	amount: number;
	currency: string;
	status: PaymentInvoiceStatus;
	dueAt?: string;
	paidAt?: string;
	createdAt: string;
	transactions: PaymentTransaction[];
	ledgerEntries: PaymentLedgerEntry[];
};

export type PaymentLedgerSummary = {
	totalInvoiced: number;
	totalPaid: number;
	pendingAmount: number;
	failedCount: number;
	currency: string;
};

export type PaymentLedgerResponse = {
	scope: "student" | "college";
	collegeName: string;
	invoices: PaymentInvoice[];
	summary: PaymentLedgerSummary;
};
