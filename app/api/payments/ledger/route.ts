import { getPaymentLedgerRecords } from "@/lib/services/payment-ledger.service";
import { getCurrentAuthSession } from "@/lib/auth/server-session";
import { hasPermissions, type UserPermissionKey } from "@/lib/rbac";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const session = await getCurrentAuthSession();

	if (!session) {
		return NextResponse.json(
			{ error: "Authentication is required to view payments." },
			{ status: 401 },
		);
	}

	const url = new URL(request.url);
	const collegeSlug =
		url.searchParams.get("collegeSlug") ?? session.user.collegeSlug;
	const permissions = (session.user.permissions ?? []) as UserPermissionKey[];
	const canViewCollegePayments =
		session.user.domain === "admin" ||
		hasPermissions(permissions, ["payments.verify"], { mode: "any" }) ||
		hasPermissions(permissions, ["payments.export"], { mode: "any" });
	const scope = canViewCollegePayments ? "college" : "student";

	const ledger = await getPaymentLedgerRecords({
		collegeSlug,
		scope,
		payerEmail: session.user.email,
	});

	return NextResponse.json({ ledger });
}
