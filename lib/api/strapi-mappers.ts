import type { StrapiEntity } from "./strapi-types";

export function getStrapiEntityId(entity: StrapiEntity<Record<string, unknown>>) {
	return entity.documentId ?? (typeof entity.id === "number" ? String(entity.id) : "");
}

export function unwrapStrapiEntity<T extends Record<string, unknown>>(
	entity: StrapiEntity<T>,
): T & { id: string; numericId?: number; documentId?: string } {
	const attributes = entity.attributes ?? entity;

	return {
		...attributes,
		id: getStrapiEntityId(entity),
		numericId: entity.id,
		documentId: entity.documentId,
	};
}

export function unwrapStrapiCollection<T extends Record<string, unknown>>(
	entities: Array<StrapiEntity<T>>,
) {
	return entities.map((entity) => unwrapStrapiEntity(entity));
}

export function asString(value: unknown, fallback = "") {
	return typeof value === "string" ? value : fallback;
}

export function asStringArray(value: unknown) {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string")
		: [];
}

export function asRelationArray(value: unknown): unknown[] {
	if (Array.isArray(value)) {
		return value;
	}

	if (value && typeof value === "object" && "data" in value) {
		const data = (value as { data?: unknown }).data;
		return Array.isArray(data) ? data : [];
	}

	return [];
}

export function getRelationId(value: unknown) {
	if (!value || typeof value !== "object") {
		return undefined;
	}

	if ("data" in value) {
		return getRelationId((value as { data?: unknown }).data);
	}

	const relation = value as {
		documentId?: unknown;
		id?: unknown;
		numericId?: unknown;
	};
	if (typeof relation.documentId === "string") {
		return relation.documentId;
	}
	if (typeof relation.id === "number") {
		return String(relation.id);
	}
	if (typeof relation.id === "string") {
		return relation.id;
	}
	if (typeof relation.numericId === "number") {
		return String(relation.numericId);
	}

	return undefined;
}
