import type { StrapiQueryParams, StrapiQueryValue } from "./strapi-types";

function appendQueryValue(
	params: URLSearchParams,
	key: string,
	value: StrapiQueryValue,
) {
	if (value === undefined || value === null) {
		return;
	}

	if (Array.isArray(value)) {
		value.forEach((item, index) => appendQueryValue(params, `${key}[${index}]`, item));
		return;
	}

	if (typeof value === "object") {
		Object.entries(value).forEach(([childKey, childValue]) => {
			appendQueryValue(params, `${key}[${childKey}]`, childValue);
		});
		return;
	}

	params.append(key, String(value));
}

export function toStrapiQueryString(query?: StrapiQueryParams) {
	if (!query) {
		return "";
	}

	const params = new URLSearchParams();
	Object.entries(query).forEach(([key, value]) => {
		appendQueryValue(params, key, value);
	});

	const queryString = params.toString();
	return queryString ? `?${queryString}` : "";
}
