declare module "@paystack/inline-js" {
	interface ResumeTransactionCallbacks {
		onSuccess?: (transaction: { reference?: string; message?: string }) => void;
		onCancel?: () => void;
		onError?: (error: unknown) => void;
	}

	export default class PaystackPop {
		resumeTransaction(
			accessCode: string,
			callbacks?: ResumeTransactionCallbacks,
		): void;
	}
}
