const DEV_INTERNAL_SECRET =
	"iums-local-registration-secret-change-before-production";

export type SuperadminAuditEventType =
	| "created"
	| "updated"
	| "deleted"
	| "login"
	| "exported"
	| "settings"
	| "payment";

export type SuperadminAuditEvent = {
	id: string;
	collegeSlug: string;
	collegeName: string;
	actor: string;
	actorEmail?: string;
	role: string;
	activity: string;
	target: string;
	eventType: SuperadminAuditEventType;
	when: string;
	ipAddress: string;
	summary: string;
};

export type SuperadminAuditData = {
	generatedAt: string;
	events: SuperadminAuditEvent[];
};

function getStrapiBaseUrl() {
	return (
		process.env.STRAPI_API_URL ??
		process.env.NEXT_PUBLIC_STRAPI_API_URL ??
		"http://localhost:1337"
	).replace(/\/$/, "");
}

function getInternalSecret() {
	const configured =
		process.env.PORTAL_INTERNAL_API_SECRET ?? process.env.PORTAL_REGISTRATION_SECRET;

	if (configured) {
		return configured;
	}

	if (process.env.NODE_ENV === "production") {
		throw new Error("PORTAL_INTERNAL_API_SECRET is required in production.");
	}

	return DEV_INTERNAL_SECRET;
}

async function parseError(response: Response, fallback: string) {
	const payload = (await response.json().catch(() => null)) as
		| { error?: { message?: string }; message?: string }
		| null;

	return payload?.error?.message ?? payload?.message ?? fallback;
}

export async function getSuperadminAuditData(input?: {
	collegeSlug?: string;
	from?: string;
	to?: string;
}) {
	const params = new URLSearchParams();

	if (input?.collegeSlug && input.collegeSlug !== "all") {
		params.set("collegeSlug", input.collegeSlug);
	}
	if (input?.from) {
		params.set("from", input.from);
	}
	if (input?.to) {
		params.set("to", input.to);
	}

	const query = params.toString();
	const response = await fetch(
		`${getStrapiBaseUrl()}/api/superadmin/audit${query ? `?${query}` : ""}`,
		{
			headers: {
				Accept: "application/json",
				"x-portal-internal-secret": getInternalSecret(),
			},
			cache: "no-store",
		},
	);

	if (!response.ok) {
		throw new Error(
			await parseError(response, "Unable to load superadmin audit data."),
		);
	}

	return response.json() as Promise<SuperadminAuditData>;
}

export async function recordSuperadminAuditEvent(input: {
	action: string;
	eventType?: SuperadminAuditEventType;
	actorName?: string;
	actorEmail?: string;
	actorRole?: string;
	entityType?: string;
	entityId?: string;
	targetLabel?: string;
	collegeSlug?: string;
	ipAddress?: string;
	summary: string;
	metadata?: Record<string, unknown>;
}) {
	const response = await fetch(`${getStrapiBaseUrl()}/api/superadmin/audit-events`, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			"x-portal-internal-secret": getInternalSecret(),
		},
		body: JSON.stringify({
			...input,
			occurredAt: new Date().toISOString(),
		}),
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(
			await parseError(response, "Unable to record superadmin audit event."),
		);
	}

	return response.json() as Promise<{ ok: true; auditId: number | string }>;
}
