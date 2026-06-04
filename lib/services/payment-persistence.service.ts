import { strapiPost } from "@/lib/api";

export type PaymentRecordModule =
	| "admission"
	| "hostel"
	| "tuition"
	| "result"
	| "transcript"
	| "other";

type PersistenceResult = {
	persisted: boolean;
	invoiceNumber?: string;
	reason?: string;
};

type RecordInitializationInput = {
	reference: string;
	accessCode?: string;
	amount: number;
	currency: string;
	email: string;
	username?: string;
	module: PaymentRecordModule;
	description: string;
	collegeSlug?: string;
	studentId?: string;
	gateway: "paystack";
	channel: string;
};

type RecordVerificationInput = {
	reference: string;
	amount: number;
	currency: string;
	module: PaymentRecordModule;
	channel?: string;
	paidAt?: string;
	verifiedAt: string;
	rawGatewayResponse?: unknown;
};

function hasPersistenceToken() {
	return Boolean(process.env.STRAPI_API_TOKEN?.trim());
}

function createInvoiceNumber(module: PaymentRecordModule, reference: string) {
	const moduleCode = module.slice(0, 3).toUpperCase();
	const suffix = reference.split("-").slice(-1)[0] ?? reference.slice(-6);
	return `INV-${moduleCode}-${Date.now()}-${suffix}`;
}

function createLedgerNumber(reference: string, type: string) {
	const suffix = reference.split("-").slice(-1)[0] ?? reference.slice(-6);
	return `LED-${type.toUpperCase()}-${Date.now()}-${suffix}`;
}

export async function recordPaymentInitialized(
	input: RecordInitializationInput,
): Promise<PersistenceResult> {
	if (!hasPersistenceToken()) {
		return {
			persisted: false,
			reason: "STRAPI_API_TOKEN is not configured.",
		};
	}

	const invoiceNumber = createInvoiceNumber(input.module, input.reference);

	try {
		await strapiPost("/api/payment-invoices", {
			data: {
				invoiceNumber,
				module: input.module,
				description: input.description,
				amount: input.amount / 100,
				currency: input.currency,
				status: "pending",
				payerName: input.username ?? input.email,
				payerEmail: input.email,
				payerIdentifier: input.studentId ?? input.email,
				metadata: {
					collegeSlug: input.collegeSlug,
					paymentReference: input.reference,
				},
			},
		});

		await strapiPost("/api/payment-transactions", {
			data: {
				reference: input.reference,
				gateway: input.gateway,
				accessCode: input.accessCode,
				channel: input.channel,
				amount: input.amount / 100,
				currency: input.currency,
				status: "initialized",
				gatewayStatus: "initialized",
				gatewayMessage: "Paystack checkout initialized",
				metadata: {
					collegeSlug: input.collegeSlug,
					invoiceNumber,
				},
			},
		});

		await strapiPost("/api/payment-ledger-entries", {
			data: {
				entryNumber: createLedgerNumber(input.reference, "charge"),
				entryType: "charge",
				direction: "debit",
				amount: input.amount / 100,
				currency: input.currency,
				module: input.module,
				description: `${input.description} invoice raised`,
				reference: invoiceNumber,
				postedAt: new Date().toISOString(),
				metadata: {
					collegeSlug: input.collegeSlug,
					paymentReference: input.reference,
				},
			},
		});

		return { persisted: true, invoiceNumber };
	} catch (error) {
		return {
			persisted: false,
			invoiceNumber,
			reason:
				error instanceof Error
					? error.message
					: "Unable to persist payment initialization.",
		};
	}
}

export async function recordPaymentVerified(
	input: RecordVerificationInput,
): Promise<PersistenceResult> {
	if (!hasPersistenceToken()) {
		return {
			persisted: false,
			reason: "STRAPI_API_TOKEN is not configured.",
		};
	}

	try {
		await strapiPost("/api/payment-ledger-entries", {
			data: {
				entryNumber: createLedgerNumber(input.reference, "payment"),
				entryType: "payment",
				direction: "credit",
				amount: input.amount / 100,
				currency: input.currency,
				module: input.module,
				description: "Gateway payment verified",
				reference: input.reference,
				postedAt: input.verifiedAt,
				metadata: {
					channel: input.channel,
					paidAt: input.paidAt,
					rawGatewayResponse: input.rawGatewayResponse,
				},
			},
		});

		return { persisted: true };
	} catch (error) {
		return {
			persisted: false,
			reason:
				error instanceof Error
					? error.message
					: "Unable to persist payment verification.",
		};
	}
}
