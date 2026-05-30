export type StrapiPrimitive = string | number | boolean | null;
export type StrapiValue =
	| StrapiPrimitive
	| StrapiValue[]
	| { [key: string]: StrapiValue };

export type StrapiQueryValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| StrapiQueryValue[]
	| { [key: string]: StrapiQueryValue };

export type StrapiQueryParams = Record<string, StrapiQueryValue>;

export type StrapiEntity<T extends Record<string, unknown>> = T & {
	id?: number;
	documentId?: string;
	attributes?: T;
};

export type StrapiCollectionResponse<T extends Record<string, unknown>> = {
	data: Array<StrapiEntity<T>>;
	meta?: {
		pagination?: {
			page: number;
			pageSize: number;
			pageCount: number;
			total: number;
		};
	};
};

export type StrapiSingleResponse<T extends Record<string, unknown>> = {
	data: StrapiEntity<T> | null;
	meta?: Record<string, unknown>;
};

export type StrapiErrorResponse = {
	data: null;
	error: {
		status: number;
		name: string;
		message: string;
		details?: Record<string, unknown>;
	};
};

export type StrapiRequestOptions = {
	authToken?: string;
	cache?: RequestCache;
	headers?: HeadersInit;
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	query?: StrapiQueryParams;
	body?: unknown;
	next?: {
		revalidate?: number | false;
		tags?: string[];
	};
};

export type StrapiHealthStatus = {
	reachable: boolean;
	status: number;
	message: string;
};
