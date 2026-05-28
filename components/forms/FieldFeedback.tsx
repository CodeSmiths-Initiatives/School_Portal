import { AlertCircle } from "lucide-react";

type FieldFeedbackProps = {
	id?: string;
	message?: string;
	hint?: string;
};

export default function FieldFeedback({ id, message, hint }: FieldFeedbackProps) {
	if (message) {
		return (
			<p
				id={id}
				role="alert"
				className="field-feedback-enter mt-1.5 flex min-h-5 items-center gap-1.5 text-xs font-medium leading-snug text-red-600"
			>
				<span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 ring-1 ring-red-100">
					<AlertCircle className="size-3" aria-hidden="true" />
				</span>
				<span>{message}</span>
			</p>
		);
	}

	if (!hint) return null;

	return (
		<p
			id={id}
			className="mt-1.5 min-h-5 text-xs font-medium leading-snug text-[#6f7f98]"
		>
			{hint}
		</p>
	);
}
