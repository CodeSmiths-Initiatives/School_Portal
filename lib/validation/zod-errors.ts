import type { ZodError } from "zod";

export function toFieldErrors<TField extends string>(
	error: ZodError,
): Partial<Record<TField, string>> {
	return error.issues.reduce<Partial<Record<TField, string>>>((errors, issue) => {
		const field = issue.path[0];
		if (typeof field !== "string") return errors;

		const key = field as TField;
		if (!errors[key]) {
			errors[key] = issue.message;
		}

		return errors;
	}, {});
}
