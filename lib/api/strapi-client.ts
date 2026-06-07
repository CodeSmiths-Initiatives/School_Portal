import { toStrapiQueryString } from "./strapi-query";
import type {
	StrapiErrorResponse,
	StrapiHealthStatus,
	StrapiRequestOptions,
} from "./strapi-types";

const DEFAULT_STRAPI_URL = "http://localhost:1337";

type FetchOptions = RequestInit & {
	next?: {
		revalidate?: number | false;
		tags?: string[];
	};
};

export class StrapiApiError extends Error {
	status: number;
	details?: Record<string, unknown>;

	constructor(message: string, status: number, details?: Record<string, unknown>) {
		super(message);
		this.name = "StrapiApiError";
		this.status = status;
		this.details = details;
	}
}

export function getStrapiBaseUrl() {
	return (
		process.env.STRAPI_API_URL ??
		process.env.NEXT_PUBLIC_STRAPI_API_URL ??
		DEFAULT_STRAPI_URL
	).replace(/\/$/, "");
}

function getDefaultAuthToken() {
	if (typeof window !== "undefined") {
		return undefined;
	}

	return process.env.STRAPI_API_TOKEN;
}

function buildUrl(path: string, query: StrapiRequestOptions["query"]) {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return `${getStrapiBaseUrl()}${normalizedPath}${toStrapiQueryString(query)}`;
}

async function parseError(response: Response) {
	let errorMessage = `Strapi request failed with status ${response.status}`;
	let details: Record<string, unknown> | undefined;

	try {
		const payload = (await response.json()) as Partial<StrapiErrorResponse>;
		if (payload.error?.message) {
			errorMessage = payload.error.message;
			details = payload.error.details;
		}
	} catch {
		// Keep the status-based fallback message when the body is not JSON.
	}

	throw new StrapiApiError(errorMessage, response.status, details);
}

export async function strapiRequest<T>(
	path: string,
	options: StrapiRequestOptions = {},
): Promise<T> {
	const authToken = options.authToken ?? getDefaultAuthToken();
	const headers = new Headers(options.headers);

	headers.set("Accept", "application/json");

	if (options.body !== undefined) {
		headers.set("Content-Type", "application/json");
	}

	if (authToken) {
		headers.set("Authorization", `Bearer ${authToken}`);
	}

	const fetchOptions: FetchOptions = {
		method: options.method ?? "GET",
		headers,
		cache: options.cache,
		next: options.next,
		body: options.body === undefined ? undefined : JSON.stringify(options.body),
	};

	const response = await fetch(buildUrl(path, options.query), fetchOptions);

	if (!response.ok) {
		await parseError(response);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}

export function strapiGet<T>(path: string, options?: StrapiRequestOptions) {
	return strapiRequest<T>(path, { ...options, method: "GET" });
}

export function strapiPost<T>(
	path: string,
	body: unknown,
	options?: StrapiRequestOptions,
) {
	return strapiRequest<T>(path, { ...options, method: "POST", body });
}

export function strapiPut<T>(
	path: string,
	body: unknown,
	options?: StrapiRequestOptions,
) {
	return strapiRequest<T>(path, { ...options, method: "PUT", body });
}

export function strapiPatch<T>(
	path: string,
	body: unknown,
	options?: StrapiRequestOptions,
) {
	return strapiRequest<T>(path, { ...options, method: "PATCH", body });
}

export function strapiDelete<T>(path: string, options?: StrapiRequestOptions) {
	return strapiRequest<T>(path, { ...options, method: "DELETE" });
}

export async function checkStrapiHealth(): Promise<StrapiHealthStatus> {
	try {
		const response = await fetch(`${getStrapiBaseUrl()}/_health`, {
			cache: "no-store",
		});

		return {
			reachable: response.ok,
			status: response.status,
			message: response.ok ? "Strapi is reachable." : "Strapi health check failed.",
		};
	} catch (error) {
		return {
			reachable: false,
			status: 0,
			message: error instanceof Error ? error.message : "Strapi is not reachable.",
		};
	}
}
