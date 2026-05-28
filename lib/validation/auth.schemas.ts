import { z } from "zod";

const passwordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.max(15, "Password cannot be more than 15 characters")
	.regex(/[A-Z]/, "Password must include an uppercase letter")
	.regex(/\d/, "Password must include a number")
	.regex(
		/[^a-zA-Z0-9]/,
		"Password must include a special character",
	);

export const loginSchema = z.object({
	identifier: z
		.string()
		.trim()
		.min(1, "Email or username is required"),
	password: z.string().min(1, "Password is required"),
});

export const createAccountSchema = z
	.object({
		username: z
			.string()
			.trim()
			.min(3, "Username must be at least 3 characters")
			.max(40, "Username is too long")
			.regex(
				/^[a-zA-Z0-9._-]+$/,
				"Username can only contain letters, numbers, dots, underscores, and hyphens",
			),
		email: z.string().trim().email("Enter a valid email address"),
		password: passwordSchema,
		confirmPassword: z.string().min(1, "Confirm your password"),
		agreeToTerms: z.literal(true, {
			error: "You must agree to the terms and privacy policy",
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export const forgotPasswordSchema = z.object({
	email: z.string().trim().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
	.object({
		code: z
			.string()
			.trim()
			.min(1, "Reset code is required")
			.max(120, "Reset code is too long"),
		password: passwordSchema,
		confirmPassword: z.string().min(1, "Confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
