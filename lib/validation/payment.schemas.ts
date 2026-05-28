import { z } from "zod";

export const paymentMethodSchema = z.enum(["card", "bank_transfer", "ussd"]);

export const paymentSchema = z
	.object({
		method: paymentMethodSchema,
		card: z.object({
			cardNumber: z.string().trim(),
			expiryDate: z.string().trim(),
			cvv: z.string().trim(),
			nameOnCard: z.string().trim(),
		}),
		bankTransfer: z.object({
			bankName: z.string().trim(),
			accountNumber: z.string().trim(),
			reference: z.string().trim(),
		}),
		ussd: z.object({
			network: z.string().trim(),
		}),
	})
	.superRefine((data, ctx) => {
		if (data.method === "card") {
			const digits = data.card.cardNumber.replace(/\s/g, "");
			if (!/^\d{15,19}$/.test(digits)) {
				ctx.addIssue({
					code: "custom",
					path: ["card", "cardNumber"],
					message: "Enter a valid card number",
				});
			}

			if (!/^\d{2}\/\d{2}$/.test(data.card.expiryDate)) {
				ctx.addIssue({
					code: "custom",
					path: ["card", "expiryDate"],
					message: "Use MM/YY format",
				});
			}

			if (!/^\d{3,4}$/.test(data.card.cvv)) {
				ctx.addIssue({
					code: "custom",
					path: ["card", "cvv"],
					message: "Enter a valid CVV",
				});
			}

			if (!data.card.nameOnCard) {
				ctx.addIssue({
					code: "custom",
					path: ["card", "nameOnCard"],
					message: "Name on card is required",
				});
			}
		}

		if (data.method === "bank_transfer" && !data.bankTransfer.reference) {
			ctx.addIssue({
				code: "custom",
				path: ["bankTransfer", "reference"],
				message: "Payment reference is required",
			});
		}

		if (data.method === "ussd" && !data.ussd.network) {
			ctx.addIssue({
				code: "custom",
				path: ["ussd", "network"],
				message: "Select a network",
			});
		}
	});

export type PaymentInput = z.infer<typeof paymentSchema>;
