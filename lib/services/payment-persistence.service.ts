import {
	getRelationId,
	strapiGet,
	strapiPost,
	strapiPut,
	unwrapStrapiCollection,
	unwrapStrapiEntity,
	type StrapiCollectionResponse,
	type StrapiSingleResponse,
} from "@/lib/api";
import { getActiveColleges } from "@/lib/services/college.service";

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
	applicationId?: string;
	applicationNumber?: string;
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

type StrapiPaymentRecord = Record<string, unknown> & {
	invoiceNumber?: unknown;
	reference?: unknown;
	college?: unknown;
	invoice?: unknown;
	admissionApplication?: unknown;
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

async function resolveCollegeRelationId(collegeSlug?: string) {
	if (!collegeSlug) {
		return undefined;
	}

	try {
		const colleges = await getActiveColleges({
			cache: "no-store",
			query: {
				filters: { slug: { $eq: collegeSlug } },
				pagination: { page: 1, pageSize: 1 },
			},
		});
		const college = colleges[0];

		return college?.numericId ?? college?.documentId ?? college?.id;
	} catch {
		return undefined;
	}
}

function relationFields({
	collegeId,
	invoiceId,
	transactionId,
	applicationId,
}: {
	collegeId?: string | number;
	invoiceId?: string | number;
	transactionId?: string | number;
	applicationId?: string | number;
}) {
	return {
		...(collegeId ? { college: collegeId } : {}),
		...(invoiceId ? { invoice: invoiceId } : {}),
		...(transactionId ? { transaction: transactionId } : {}),
		...(applicationId ? { admissionApplication: applicationId } : {}),
	};
}

async function findPaymentTransaction(reference: string) {
	const response = await strapiGet<
		StrapiCollectionResponse<StrapiPaymentRecord>
	>("/api/payment-transactions", {
		cache: "no-store",
		query: {
			filters: { reference: { $eq: reference } },
			populate: {
				college: true,
				invoice: true,
				admissionApplication: true,
			},
			pagination: { page: 1, pageSize: 1 },
		},
	});

	const transaction = unwrapStrapiCollection(response.data)[0];
	return transaction;
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
		const collegeId = await resolveCollegeRelationId(input.collegeSlug);
		const applicationId = input.applicationId;
		const invoiceResponse = await strapiPost<
			StrapiSingleResponse<StrapiPaymentRecord>
		>("/api/payment-invoices", {
			data: {
				invoiceNumber,
				module: input.module,
				description: input.description,
				amount: input.amount / 100,
				currency: input.currency,
				status: "pending",
				payerName: input.username ?? input.email,
				payerEmail: input.email,
				payerIdentifier: input.studentId ?? input.applicationNumber ?? input.email,
				metadata: {
					collegeSlug: input.collegeSlug,
					applicationNumber: input.applicationNumber,
					paymentReference: input.reference,
				},
				...relationFields({ collegeId, applicationId }),
			},
		});

		if (!invoiceResponse.data) {
			throw new Error("Strapi did not return the created payment invoice.");
		}

		const invoice = unwrapStrapiEntity(invoiceResponse.data);
		const invoiceId = invoice.numericId ?? invoice.documentId ?? invoice.id;
		const transactionResponse = await strapiPost<
			StrapiSingleResponse<StrapiPaymentRecord>
		>("/api/payment-transactions", {
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
					applicationNumber: input.applicationNumber,
					invoiceNumber,
				},
				...relationFields({ collegeId, invoiceId, applicationId }),
			},
		});

		if (!transactionResponse.data) {
			throw new Error("Strapi did not return the created payment transaction.");
		}

		const transaction = unwrapStrapiEntity(transactionResponse.data);
		const transactionId =
			transaction.numericId ?? transaction.documentId ?? transaction.id;

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
					applicationNumber: input.applicationNumber,
					paymentReference: input.reference,
				},
				...relationFields({
					collegeId,
					invoiceId,
					transactionId,
					applicationId,
				}),
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
		const transaction = await findPaymentTransaction(input.reference);
		const transactionId =
			transaction?.numericId ?? transaction?.documentId ?? transaction?.id;
		const invoiceId = getRelationId(transaction?.invoice);
		const collegeId = getRelationId(transaction?.college);
		const applicationId = getRelationId(transaction?.admissionApplication);

		if (transactionId) {
			await strapiPut(`/api/payment-transactions/${transactionId}`, {
				data: {
					status: "success",
					gatewayStatus: "success",
					gatewayMessage: "Paystack transaction verified",
					channel: input.channel,
					paidAt: input.paidAt,
					verifiedAt: input.verifiedAt,
					rawGatewayResponse: input.rawGatewayResponse,
				},
			});
		}

		if (invoiceId) {
			await strapiPut(`/api/payment-invoices/${invoiceId}`, {
				data: {
					status: "paid",
					paidAt: input.paidAt ?? input.verifiedAt,
				},
			});
		}

		if (applicationId && input.module === "admission") {
			await strapiPut(`/api/admission-applications/${applicationId}`, {
				data: {
					status: "submitted",
					paymentStatus: "paid",
					submittedAt: input.verifiedAt,
				},
			});
		}

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
				...relationFields({
					collegeId,
					invoiceId,
					transactionId,
					applicationId,
				}),
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
