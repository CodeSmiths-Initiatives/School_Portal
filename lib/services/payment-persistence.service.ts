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
	module?: unknown;
	status?: unknown;
	payerEmail?: unknown;
	college?: unknown;
	invoice?: unknown;
	admissionApplication?: unknown;
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

async function postInternalPersistence<T>(
	path: "/api/payments/persist-initialized" | "/api/payments/persist-verified",
	body: unknown,
) {
	const response = await fetch(`${getStrapiBaseUrl()}${path}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-portal-internal-secret": getInternalSecret(),
		},
		body: JSON.stringify(body),
		cache: "no-store",
	});

	const payload = (await response.json().catch(() => null)) as
		| T
		| { error?: { message?: string }; message?: string }
		| null;

	if (!response.ok || !payload) {
		const errorPayload =
			payload && typeof payload === "object"
				? (payload as { error?: { message?: string }; message?: string })
				: null;
		const message =
			errorPayload?.error?.message ?? errorPayload?.message ?? undefined;

		throw new Error(message ?? "Internal payment persistence failed.");
	}

	if (typeof payload !== "object") {
		throw new Error("Internal payment persistence returned an invalid payload.");
	}

	if ("error" in payload || "message" in payload) {
		const errorPayload = payload as {
			error?: { message?: string };
			message?: string;
		};
		const message =
			errorPayload.error?.message ?? errorPayload.message ?? undefined;

		throw new Error(message ?? "Internal payment persistence failed.");
	}

	return payload as T;
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

		return college?.documentId ?? college?.id ?? college?.numericId;
	} catch {
		return undefined;
	}
}

function isPaidAdmissionInvoice(invoice: StrapiPaymentRecord) {
	return invoice.module === "admission" && invoice.status === "paid";
}

function getWriteDocumentId(
	record?: { documentId?: unknown; id?: unknown; numericId?: unknown } | null,
) {
	if (typeof record?.documentId === "string") {
		return record.documentId;
	}

	if (typeof record?.id === "string") {
		return record.id;
	}

	if (typeof record?.numericId === "number") {
		return String(record.numericId);
	}

	if (typeof record?.id === "number") {
		return String(record.id);
	}

	return undefined;
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

async function hasInternalPaidAdmissionPayment(input: {
	collegeSlug: string;
	email: string;
}) {
	const searchParams = new URLSearchParams({
		scope: "student",
		collegeSlug: input.collegeSlug,
		payerEmail: input.email,
	});

	const response = await fetch(
		`${getStrapiBaseUrl()}/api/payments/ledger-records?${searchParams.toString()}`,
		{
			method: "GET",
			headers: {
				"x-portal-internal-secret": getInternalSecret(),
			},
			cache: "no-store",
		},
	);

	const payload = (await response.json().catch(() => null)) as
		| { invoices?: StrapiPaymentRecord[] }
		| null;

	if (!response.ok || !payload?.invoices) {
		return false;
	}

	return payload.invoices.some(isPaidAdmissionInvoice);
}

export async function hasPaidAdmissionPaymentForApplicant(input: {
	collegeSlug: string;
	email: string;
}) {
	if (!hasPersistenceToken()) {
		return hasInternalPaidAdmissionPayment(input);
	}

	const response = await strapiGet<StrapiCollectionResponse<StrapiPaymentRecord>>(
		"/api/payment-invoices",
		{
			cache: "no-store",
			query: {
				filters: {
					college: { slug: { $eq: input.collegeSlug } },
					payerEmail: { $eqi: input.email },
					module: { $eq: "admission" },
					status: { $eq: "paid" },
				},
				pagination: { page: 1, pageSize: 1 },
			},
		},
	);

	return unwrapStrapiCollection(response.data).some(isPaidAdmissionInvoice);
}

export async function recordPaymentInitialized(
	input: RecordInitializationInput,
): Promise<PersistenceResult> {
	if (!hasPersistenceToken()) {
		try {
			return await postInternalPersistence<PersistenceResult>(
				"/api/payments/persist-initialized",
				input,
			);
		} catch (error) {
			return {
				persisted: false,
				reason:
					error instanceof Error
						? error.message
						: "Unable to persist payment initialization.",
			};
		}
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
		const invoiceId = getWriteDocumentId(invoice);
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
		const transactionId = getWriteDocumentId(transaction);

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
		try {
			return await postInternalPersistence<PersistenceResult>(
				"/api/payments/persist-verified",
				input,
			);
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

	try {
		const transaction = await findPaymentTransaction(input.reference);
		const transactionId = getWriteDocumentId(transaction);
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
					currentStep: "submitted",
					completedSteps: ["programme", "payment"],
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
