import {
	asString,
	getRelationId,
	strapiGet,
	unwrapStrapiCollection,
	type StrapiCollectionResponse,
	type StrapiQueryValue,
} from "@/lib/api";
import type {
	PaymentInvoice,
	PaymentInvoiceStatus,
	PaymentLedgerEntry,
	PaymentLedgerResponse,
	PaymentLedgerSummary,
	PaymentModuleKey,
	PaymentTransaction,
} from "@/features/payments/types/payment-ledger.types";

type PaymentLedgerScope = "student" | "college";

type PaymentLedgerInput = {
	collegeSlug?: string;
	scope: PaymentLedgerScope;
	payerEmail?: string;
};

type StrapiPaymentInvoice = Record<string, unknown> & {
	invoiceNumber?: unknown;
	module?: unknown;
	description?: unknown;
	amount?: unknown;
	currency?: unknown;
	status?: unknown;
	payerName?: unknown;
	payerEmail?: unknown;
	payerIdentifier?: unknown;
	dueAt?: unknown;
	paidAt?: unknown;
	createdAt?: unknown;
	college?: unknown;
	transactions?: unknown;
	ledgerEntries?: unknown;
};

type StrapiPaymentTransaction = Record<string, unknown> & {
	reference?: unknown;
	gateway?: unknown;
	channel?: unknown;
	amount?: unknown;
	currency?: unknown;
	status?: unknown;
	gatewayStatus?: unknown;
	gatewayMessage?: unknown;
	paidAt?: unknown;
	verifiedAt?: unknown;
};

type StrapiPaymentLedgerEntry = Record<string, unknown> & {
	entryNumber?: unknown;
	entryType?: unknown;
	direction?: unknown;
	amount?: unknown;
	currency?: unknown;
	module?: unknown;
	description?: unknown;
	reference?: unknown;
	postedAt?: unknown;
};

function hasPersistenceToken() {
	return Boolean(process.env.STRAPI_API_TOKEN?.trim());
}

const DEV_INTERNAL_SECRET =
	"iums-local-registration-secret-change-before-production";

function getStrapiBaseUrl() {
	return (
		process.env.STRAPI_API_URL ??
		process.env.NEXT_PUBLIC_STRAPI_API_URL ??
		"http://localhost:1337"
	).replace(/\/$/, "");
}

function getInternalSecret() {
	const configured =
		process.env.PORTAL_INTERNAL_API_SECRET ?? process.env.PORTAL_REGISTRATION_SECRET;

	if (configured) {
		return configured;
	}

	if (process.env.NODE_ENV === "production") {
		throw new Error("PORTAL_INTERNAL_API_SECRET is required in production.");
	}

	return DEV_INTERNAL_SECRET;
}

function asNumber(value: unknown) {
	if (typeof value === "number") {
		return value;
	}

	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}

	return 0;
}

function asModule(value: unknown): PaymentModuleKey {
	return ["admission", "hostel", "tuition", "result", "transcript", "other"].includes(
		String(value),
	)
		? (value as PaymentModuleKey)
		: "other";
}

function asInvoiceStatus(value: unknown): PaymentInvoiceStatus {
	return ["pending", "paid", "failed", "cancelled", "refunded", "expired"].includes(
		String(value),
	)
		? (value as PaymentInvoiceStatus)
		: "pending";
}

function getRelationCollection(value: unknown) {
	if (Array.isArray(value)) {
		return value as Record<string, unknown>[];
	}

	if (value && typeof value === "object" && "data" in value) {
		const data = (value as { data?: unknown }).data;
		return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
	}

	return [];
}

function unwrapRelationItem<T extends Record<string, unknown>>(value: T) {
	const attributes = value.attributes;
	return {
		...(attributes && typeof attributes === "object" ? attributes : value),
		id: getRelationId(value) ?? asString(value.id),
	} as T & { id: string };
}

function getCollegeInfo(value: unknown, fallbackSlug?: string) {
	if (!value || typeof value !== "object") {
		return {
			slug: fallbackSlug ?? "",
			name: fallbackSlug ?? "College payments",
		};
	}

	const relation = unwrapRelationItem(value as Record<string, unknown>);
	return {
		slug: asString(relation.slug, fallbackSlug ?? ""),
		name: asString(relation.name, fallbackSlug ?? "College payments"),
	};
}

function mapTransaction(
	transaction: Record<string, unknown>,
): PaymentTransaction {
	const item = unwrapRelationItem<StrapiPaymentTransaction>(transaction);

	return {
		id: item.id,
		reference: asString(item.reference, "Not started"),
		gateway: ["paystack", "manual", "bank", "other"].includes(String(item.gateway))
			? (item.gateway as PaymentTransaction["gateway"])
			: "other",
		channel: asString(item.channel, "card"),
		amount: asNumber(item.amount),
		currency: asString(item.currency, "NGN"),
		status: [
			"initialized",
			"pending",
			"success",
			"failed",
			"cancelled",
			"abandoned",
			"reversed",
		].includes(String(item.status))
			? (item.status as PaymentTransaction["status"])
			: "initialized",
		gatewayStatus: asString(item.gatewayStatus, asString(item.status, "initialized")),
		gatewayMessage: asString(item.gatewayMessage, "Payment record created"),
		paidAt: asString(item.paidAt) || undefined,
		verifiedAt: asString(item.verifiedAt) || undefined,
	};
}

function mapLedgerEntry(entry: Record<string, unknown>): PaymentLedgerEntry {
	const item = unwrapRelationItem<StrapiPaymentLedgerEntry>(entry);

	return {
		id: item.id,
		entryNumber: asString(item.entryNumber, item.id),
		entryType: [
			"charge",
			"payment",
			"refund",
			"waiver",
			"adjustment",
			"reversal",
		].includes(String(item.entryType))
			? (item.entryType as PaymentLedgerEntry["entryType"])
			: "charge",
		direction: item.direction === "credit" ? "credit" : "debit",
		amount: asNumber(item.amount),
		currency: asString(item.currency, "NGN"),
		module: asModule(item.module),
		description: asString(item.description, "Payment ledger entry"),
		reference: asString(item.reference, item.entryNumber as string),
		postedAt: asString(item.postedAt, new Date().toISOString()),
	};
}

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

function mapInvoice(
	invoice: ReturnType<typeof unwrapStrapiCollection<StrapiPaymentInvoice>>[number],
	fallbackCollegeSlug?: string,
): PaymentInvoice {
	const college = getCollegeInfo(invoice.college, fallbackCollegeSlug);

	return {
		id: invoice.id,
		invoiceNumber: asString(invoice.invoiceNumber, invoice.id),
		collegeSlug: college.slug,
		collegeName: college.name,
		studentId: asString(invoice.payerIdentifier, asString(invoice.payerEmail)),
		payerName: asString(invoice.payerName, asString(invoice.payerEmail)),
		payerEmail: asString(invoice.payerEmail),
		module: asModule(invoice.module),
		description: asString(invoice.description, "Student payment"),
		amount: asNumber(invoice.amount),
		currency: asString(invoice.currency, "NGN"),
		status: asInvoiceStatus(invoice.status),
		dueAt: asString(invoice.dueAt) || undefined,
		paidAt: asString(invoice.paidAt) || undefined,
		createdAt: asString(invoice.createdAt, new Date().toISOString()),
		transactions: getRelationCollection(invoice.transactions).map(mapTransaction),
		ledgerEntries: getRelationCollection(invoice.ledgerEntries).map(mapLedgerEntry),
	};
}

function normalizeInternalInvoice(invoice: StrapiPaymentInvoice) {
	const id = invoice.documentId ?? invoice.id;

	return {
		...invoice,
		id: typeof id === "string" ? id : String(id ?? invoice.invoiceNumber ?? ""),
	} as ReturnType<typeof unwrapStrapiCollection<StrapiPaymentInvoice>>[number];
}

async function getInternalPaymentLedgerRecords(
	input: PaymentLedgerInput,
): Promise<PaymentLedgerResponse> {
	const params = new URLSearchParams({
		scope: input.scope,
	});

	if (input.collegeSlug) {
		params.set("collegeSlug", input.collegeSlug);
	}

	if (input.scope === "student" && input.payerEmail) {
		params.set("payerEmail", input.payerEmail);
	}

	const response = await fetch(
		`${getStrapiBaseUrl()}/api/payments/ledger-records?${params.toString()}`,
		{
			method: "GET",
			headers: {
				"x-portal-internal-secret": getInternalSecret(),
			},
			cache: "no-store",
		},
	);

	const payload = (await response.json().catch(() => null)) as
		| { invoices?: StrapiPaymentInvoice[]; error?: { message?: string } }
		| null;

	if (!response.ok || !payload?.invoices) {
		throw new Error(
			payload?.error?.message ?? "Unable to load internal payment ledger.",
		);
	}

	const invoices = payload.invoices
		.map(normalizeInternalInvoice)
		.map((invoice) => mapInvoice(invoice, input.collegeSlug));

	return {
		scope: input.scope,
		collegeName:
			invoices[0]?.collegeName ??
			input.collegeSlug ??
			(input.scope === "student" ? "Student payments" : "College payments"),
		invoices,
		summary: summarize(invoices),
	};
}

export async function getPaymentLedgerRecords(
	input: PaymentLedgerInput,
): Promise<PaymentLedgerResponse> {
	if (!hasPersistenceToken()) {
		return getInternalPaymentLedgerRecords(input);
	}

	const filters: Record<string, StrapiQueryValue> = {};

	if (input.collegeSlug) {
		filters.college = { slug: { $eq: input.collegeSlug } };
	}

	if (input.scope === "student" && input.payerEmail) {
		filters.payerEmail = { $eqi: input.payerEmail };
	}

	const response = await strapiGet<StrapiCollectionResponse<StrapiPaymentInvoice>>(
		"/api/payment-invoices",
		{
			cache: "no-store",
			query: {
				filters,
				sort: ["createdAt:desc"],
				pagination: { page: 1, pageSize: 100 },
				populate: {
					college: true,
					transactions: true,
					ledgerEntries: true,
				},
			},
		},
	);
	const invoices = unwrapStrapiCollection(response.data).map((invoice) =>
		mapInvoice(invoice, input.collegeSlug),
	);

	return {
		scope: input.scope,
		collegeName:
			invoices[0]?.collegeName ??
			input.collegeSlug ??
			(input.scope === "student" ? "Student payments" : "College payments"),
		invoices,
		summary: summarize(invoices),
	};
}
