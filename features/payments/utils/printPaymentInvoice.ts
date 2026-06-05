import type { PaymentInvoice } from "@/features/payments/types/payment-ledger.types";
import { formatNaira } from "@/lib/services/paystack.service";

function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function formatDate(value?: string) {
	if (!value) return "Not posted";

	return new Intl.DateTimeFormat("en-NG", {
		year: "numeric",
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(value));
}

export function printPaymentInvoice(invoice: PaymentInvoice, collegeName: string) {
	const transaction = invoice.transactions[0];
	const printWindow = window.open("", "_blank", "width=900,height=720");

	if (!printWindow) {
		window.print();
		return;
	}

	printWindow.document.open();
	printWindow.document.write(`<!doctype html>
<html>
	<head>
		<meta charset="utf-8" />
		<title>${escapeHtml(invoice.invoiceNumber)}</title>
		<style>
			:root {
				--navy: #0D2B55;
				--gold: #B7770D;
				--muted: #60728f;
				--line: #dbe5f1;
				--soft: #f4f8fe;
			}
			* { box-sizing: border-box; }
			body {
				margin: 0;
				background: #eef4fb;
				color: var(--navy);
				font-family: Arial, sans-serif;
				padding: 32px;
			}
			.receipt {
				max-width: 760px;
				margin: 0 auto;
				background: #fff;
				border: 1px solid var(--line);
				border-radius: 20px;
				overflow: hidden;
				box-shadow: 0 24px 60px rgba(13, 43, 85, 0.12);
			}
			.header {
				background: var(--navy);
				color: #fff;
				padding: 28px 32px;
				border-bottom: 8px solid var(--gold);
			}
			.eyebrow {
				margin: 0 0 8px;
				color: #e4a11b;
				font-size: 11px;
				font-weight: 800;
				letter-spacing: 0.28em;
				text-transform: uppercase;
			}
			h1 {
				margin: 0;
				font-size: 26px;
				line-height: 1.2;
			}
			.content { padding: 28px 32px 32px; }
			.status {
				display: inline-flex;
				border: 1px solid #f0d9ad;
				background: #fff8e9;
				color: #94691a;
				border-radius: 999px;
				padding: 7px 12px;
				font-size: 11px;
				font-weight: 800;
				letter-spacing: 0.16em;
				text-transform: uppercase;
			}
			.status.paid {
				border-color: #cfe9d7;
				background: #f3fbf5;
				color: #177245;
			}
			.grid {
				display: grid;
				grid-template-columns: repeat(2, minmax(0, 1fr));
				gap: 14px;
				margin-top: 20px;
			}
			.box {
				border: 1px solid var(--line);
				border-radius: 16px;
				background: #fbfdff;
				padding: 16px;
				min-height: 86px;
			}
			.label {
				margin: 0;
				color: #8395af;
				font-size: 10px;
				font-weight: 800;
				letter-spacing: 0.22em;
				text-transform: uppercase;
			}
			.value {
				margin: 8px 0 0;
				color: var(--navy);
				font-size: 15px;
				font-weight: 800;
				overflow-wrap: anywhere;
			}
			.amount {
				font-size: 32px;
			}
			.trace {
				margin-top: 22px;
				border: 1px solid var(--line);
				border-radius: 18px;
				background: var(--soft);
				padding: 18px;
			}
			.note {
				margin-top: 22px;
				color: var(--muted);
				font-size: 12px;
				line-height: 1.7;
			}
			@media print {
				body {
					background: #fff;
					padding: 0;
				}
				.receipt {
					box-shadow: none;
					border-radius: 0;
					max-width: none;
				}
			}
		</style>
	</head>
	<body>
		<section class="receipt">
			<header class="header">
				<p class="eyebrow">${escapeHtml(collegeName)}</p>
				<h1>Payment Invoice</h1>
			</header>
			<main class="content">
				<span class="status ${invoice.status === "paid" ? "paid" : ""}">${escapeHtml(invoice.status)}</span>
				<div class="grid">
					<div class="box">
						<p class="label">Invoice Number</p>
						<p class="value">${escapeHtml(invoice.invoiceNumber)}</p>
					</div>
					<div class="box">
						<p class="label">Payer Email</p>
						<p class="value">${escapeHtml(invoice.payerEmail)}</p>
					</div>
					<div class="box">
						<p class="label">Payer</p>
						<p class="value">${escapeHtml(invoice.payerName)}</p>
					</div>
					<div class="box">
						<p class="label">Module</p>
						<p class="value">${escapeHtml(invoice.module)}</p>
					</div>
					<div class="box">
						<p class="label">Amount</p>
						<p class="value amount">${escapeHtml(formatNaira(invoice.amount))}</p>
					</div>
					<div class="box">
						<p class="label">Created</p>
						<p class="value">${escapeHtml(formatDate(invoice.createdAt))}</p>
					</div>
				</div>
				<div class="trace">
					<p class="label">Transaction Reference</p>
					<p class="value">${escapeHtml(transaction?.reference ?? "Not started")}</p>
					<p class="note">${escapeHtml(transaction?.gatewayMessage ?? "No gateway message available.")}</p>
				</div>
				<p class="note">
					This printout contains only the selected invoice detail section. Dashboard navigation,
					filters, and surrounding page content are intentionally excluded.
				</p>
			</main>
		</section>
		<script>
			window.addEventListener("load", () => {
				window.focus();
				window.print();
			});
		</script>
	</body>
</html>`);
	printWindow.document.close();
}
