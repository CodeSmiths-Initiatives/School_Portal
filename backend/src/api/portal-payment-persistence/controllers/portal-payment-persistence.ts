type StrapiContext = {
	request: {
		body?: unknown;
		header: Record<string, string | undefined>;
		query?: Record<string, string | undefined>;
	};
	unauthorized: (message?: string) => unknown;
	badRequest: (message?: string) => unknown;
	body: unknown;
};

type PaymentModule =
	| "admission"
	| "hostel"
	| "tuition"
	| "result"
	| "transcript"
	| "other";

type InitializedPayload = {
	reference?: string;
	accessCode?: string;
	amount?: number;
	currency?: string;
	email?: string;
	username?: string;
	module?: PaymentModule;
	description?: string;
	collegeSlug?: string;
	studentId?: string;
	applicationId?: string;
	applicationNumber?: string;
	gateway?: "paystack";
	channel?: string;
};

type VerifiedPayload = {
	reference?: string;
	amount?: number;
	currency?: string;
	module?: PaymentModule;
	channel?: string;
	paidAt?: string;
	verifiedAt?: string;
	rawGatewayResponse?: unknown;
};

const DEV_INTERNAL_SECRET =
	"iums-local-registration-secret-change-before-production";

function getInternalSecret() {
	const configured =
		process.env.PORTAL_INTERNAL_API_SECRET ?? process.env.PORTAL_REGISTRATION_SECRET;

	if (configured) {
		return configured;
	}

	if (process.env.NODE_ENV === "production") {
		return null;
	}

	return DEV_INTERNAL_SECRET;
}

function getHeader(ctx: StrapiContext, name: string) {
	const lowerName = name.toLowerCase();
	return ctx.request.header[lowerName] ?? ctx.request.header[name];
}

function authorize(ctx: StrapiContext) {
	const expectedSecret = getInternalSecret();
	const providedSecret = getHeader(ctx, "x-portal-internal-secret");

	return Boolean(expectedSecret && providedSecret === expectedSecret);
}

function createInvoiceNumber(module: PaymentModule, reference: string) {
	const moduleCode = module.slice(0, 3).toUpperCase();
	const suffix = reference.split("-").slice(-1)[0] ?? reference.slice(-6);
	return `INV-${moduleCode}-${Date.now()}-${suffix}`;
}

function createLedgerNumber(reference: string, type: string) {
	const suffix = reference.split("-").slice(-1)[0] ?? reference.slice(-6);
	return `LED-${type.toUpperCase()}-${Date.now()}-${suffix}`;
}

async function findCollege(collegeSlug?: string) {
	if (!collegeSlug) {
		return null;
	}

	return strapi.db.query("api::college.college").findOne({
		where: { slug: collegeSlug },
	});
}

async function findAdmissionApplication(applicationId?: string) {
	if (!applicationId) {
		return null;
	}

	return strapi.db.query("api::admission-application.admission-application").findOne({
		where: {
			$or: [{ documentId: applicationId }, { id: Number(applicationId) || 0 }],
		},
	});
}

function relationFields({
	collegeId,
	invoiceId,
	transactionId,
	applicationId,
}: {
	collegeId?: number;
	invoiceId?: number;
	transactionId?: number;
	applicationId?: number;
}) {
	return {
		...(collegeId ? { college: collegeId } : {}),
		...(invoiceId ? { invoice: invoiceId } : {}),
		...(transactionId ? { transaction: transactionId } : {}),
		...(applicationId ? { admissionApplication: applicationId } : {}),
	};
}

export default {
	async ledger(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Payment ledger access is not authorized.");
		}

		const collegeSlug = ctx.request.query?.collegeSlug;
		const scope = ctx.request.query?.scope === "student" ? "student" : "college";
		const payerEmail = ctx.request.query?.payerEmail?.trim().toLowerCase();
		const college = await findCollege(collegeSlug);
		const where: Record<string, unknown> = {};

		if (college?.id) {
			where.college = college.id;
		}

		if (scope === "student" && payerEmail) {
			where.payerEmail = { $eqi: payerEmail };
		}

		const invoices = await strapi.db
			.query("api::payment-invoice.payment-invoice")
			.findMany({
				where,
				orderBy: { createdAt: "desc" },
				limit: 100,
				populate: {
					college: true,
					transactions: true,
					ledgerEntries: true,
				},
			});

		ctx.body = { invoices };
	},

	async initialized(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Payment persistence is not authorized.");
		}

		const input = (ctx.request.body ?? {}) as InitializedPayload;

		if (
			!input.reference ||
			!input.amount ||
			!input.currency ||
			!input.email ||
			!input.module ||
			!input.description ||
			!input.gateway ||
			!input.channel
		) {
			return ctx.badRequest("Complete initialized payment details are required.");
		}

		const invoiceNumber = createInvoiceNumber(input.module, input.reference);
		const college = await findCollege(input.collegeSlug);
		const application = await findAdmissionApplication(input.applicationId);
		const relation = {
			collegeId: college?.id,
			applicationId: application?.id,
		};

		const invoice = await strapi.db
			.query("api::payment-invoice.payment-invoice")
			.create({
				data: {
					invoiceNumber,
					module: input.module,
					description: input.description,
					amount: input.amount / 100,
					currency: input.currency,
					status: "pending",
					payerName: input.username ?? input.email,
					payerEmail: input.email,
					payerIdentifier:
						input.studentId ?? input.applicationNumber ?? input.email,
					metadata: {
						collegeSlug: input.collegeSlug,
						applicationNumber: input.applicationNumber,
						paymentReference: input.reference,
					},
					...relationFields(relation),
				},
			});

		const transaction = await strapi.db
			.query("api::payment-transaction.payment-transaction")
			.create({
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
					...relationFields({
						...relation,
						invoiceId: invoice.id,
					}),
				},
			});

		await strapi.db.query("api::payment-ledger-entry.payment-ledger-entry").create({
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
					...relation,
					invoiceId: invoice.id,
					transactionId: transaction.id,
				}),
			},
		});

		ctx.body = { persisted: true, invoiceNumber };
	},

	async verified(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Payment persistence is not authorized.");
		}

		const input = (ctx.request.body ?? {}) as VerifiedPayload;

		if (
			!input.reference ||
			!input.amount ||
			!input.currency ||
			!input.module ||
			!input.verifiedAt
		) {
			return ctx.badRequest("Complete verified payment details are required.");
		}

		const transaction = await strapi.db
			.query("api::payment-transaction.payment-transaction")
			.findOne({
				where: { reference: input.reference },
				populate: {
					invoice: true,
					college: true,
					admissionApplication: true,
				},
			});

		if (!transaction?.id) {
			ctx.body = {
				persisted: false,
				reason: "Payment transaction was not found for this reference.",
			};
			return;
		}

		await strapi.db.query("api::payment-transaction.payment-transaction").update({
			where: { id: transaction.id },
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

		const invoice = transaction.invoice as Record<string, unknown> | undefined;
		const college = transaction.college as Record<string, unknown> | undefined;
		const application = transaction.admissionApplication as
			| Record<string, unknown>
			| undefined;
		const invoiceId = typeof invoice?.id === "number" ? invoice.id : undefined;
		const collegeId = typeof college?.id === "number" ? college.id : undefined;
		const applicationId =
			typeof application?.id === "number" ? application.id : undefined;

		if (invoiceId) {
			await strapi.db.query("api::payment-invoice.payment-invoice").update({
				where: { id: invoiceId },
				data: {
					status: "paid",
					paidAt: input.paidAt ?? input.verifiedAt,
				},
			});
		}

		if (applicationId && input.module === "admission") {
			await strapi.db.query("api::admission-application.admission-application").update({
				where: { id: applicationId },
				data: {
					status: "submitted",
					paymentStatus: "paid",
					submittedAt: input.verifiedAt,
				},
			});
		}

		await strapi.db.query("api::payment-ledger-entry.payment-ledger-entry").create({
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
					transactionId: transaction.id,
					applicationId,
				}),
			},
		});

		ctx.body = { persisted: true };
	},
};
