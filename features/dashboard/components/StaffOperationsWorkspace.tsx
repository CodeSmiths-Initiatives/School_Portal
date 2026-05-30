"use client";

import { useMemo, useState } from "react";
import { MOCK_APPLICATIONS, MOCK_TRANSFERS } from "@/features/dashboard/utils/dashboard";
import type {
	Application,
	TabKey,
	TransferRequest,
	TransferRow,
} from "@/features/dashboard/types/dashboard.types";
import ApplicationView from "@/features/dashboard/components/ApplicationView";
import CutoffView from "@/features/dashboard/components/CutoffView";
import DashboardView from "@/features/dashboard/components/DashboardView";
import NavBar from "@/features/dashboard/components/Navbar";
import ResultView from "@/features/dashboard/components/ResultView";
import TransferModal from "@/features/dashboard/components/TransferModal";
import TransferView from "@/features/dashboard/components/TransferView";

const PANEL_TITLES: Record<TabKey, string> = {
	dashboard: "Operations overview",
	application: "Application management",
	transfer: "Transfer requests",
	cutoff: "Cutoff manager",
	result: "Admission results",
};

const PANEL_SUBTITLES: Record<TabKey, string> = {
	dashboard: "Track today's work queue, revenue signals, and recent applicant movement.",
	application: "Screen applications, review filters, and move qualified applicants forward.",
	transfer: "Review and approve department transfer requests across the current intake.",
	cutoff: "Manage benchmark scores and departmental minimum entry thresholds.",
	result: "Review publishing readiness before admission results are released.",
};

export default function StaffOperationsWorkspace() {
	const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
	const [applications, setApplications] =
		useState<Application[]>(MOCK_APPLICATIONS);
	const [transfers] = useState<TransferRow[]>(MOCK_TRANSFERS);
	const [searchQuery, setSearchQuery] = useState("");
	const [departmentFilter, setDepartmentFilter] = useState("All Departments");
	const [statusFilter, setStatusFilter] = useState("Pending");
	const [transferModal, setTransferModal] = useState<TransferRequest | null>(
		null,
	);
	const [transferDept, setTransferDept] = useState("");
	const [transferNotes, setTransferNotes] = useState("");

	const filteredApplications = useMemo(() => {
		return applications.filter((application) => {
			const matchesSearch =
				!searchQuery ||
				application.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				application.ref.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesDepartment =
				departmentFilter === "All Departments" ||
				application.firstChoice === departmentFilter;

			const matchesStatus =
				statusFilter === "All" || application.status === statusFilter;

			return matchesSearch && matchesDepartment && matchesStatus;
		});
	}, [applications, departmentFilter, searchQuery, statusFilter]);

	function handleAdmit(ref: string) {
		setApplications((current) =>
			current.map((application) =>
				application.ref === ref
					? { ...application, status: "Admitted" }
					: application,
			),
		);
	}

	function handleReject(ref: string) {
		setApplications((current) =>
			current.map((application) =>
				application.ref === ref
					? { ...application, status: "Rejected" }
					: application,
			),
		);
	}

	function openTransfer(application: Application) {
		setTransferModal({
			ref: application.ref,
			name: application.name,
			currentDepartment: application.firstChoice,
			initiatedBy: "Admissions desk",
		});
		setTransferDept("");
		setTransferNotes("");
	}

	function closeTransfer() {
		setTransferModal(null);
	}

	function approveTransfer() {
		if (!transferDept || !transferModal) {
			return;
		}

		setApplications((current) =>
			current.map((application) =>
				application.ref === transferModal.ref
					? {
							...application,
							firstChoice: transferDept,
							status: "Admitted",
						}
					: application,
			),
		);
		closeTransfer();
	}

	return (
		<div className="space-y-5">
			<section className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
							Operational Workspace
						</p>
						<h2 className="mt-2 text-xl font-bold text-[#0D2B55]">
							{PANEL_TITLES[activeTab]}
						</h2>
						<p className="mt-2 max-w-3xl text-sm text-[#60728f]">
							{PANEL_SUBTITLES[activeTab]}
						</p>
					</div>

					<div className="flex flex-wrap gap-2">
						<div className="rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-4 py-2 text-xs font-semibold text-[#4f6788]">
							Admissions office
						</div>
						<div className="rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-4 py-2 text-xs font-semibold text-[#4f6788]">
							Session 2026 / 2027
						</div>
					</div>
				</div>

				<div className="mt-5 overflow-x-auto">
					<NavBar active={activeTab} onChange={setActiveTab} />
				</div>
			</section>

			{activeTab === "dashboard" && (
				<DashboardView applications={applications} />
			)}

			{activeTab === "application" && (
				<ApplicationView
					applications={filteredApplications}
					searchQuery={searchQuery}
					onSearch={setSearchQuery}
					departmentFilter={departmentFilter}
					onDeptFilter={setDepartmentFilter}
					statusFilter={statusFilter}
					onStatusFilter={setStatusFilter}
					onAdmit={handleAdmit}
					onReject={handleReject}
					onTransfer={openTransfer}
				/>
			)}

			{activeTab === "transfer" && <TransferView transfers={transfers} />}

			{activeTab === "cutoff" && <CutoffView />}

			{activeTab === "result" && <ResultView />}

			{transferModal ? (
				<TransferModal
					transfer={transferModal}
					targetDept={transferDept}
					notes={transferNotes}
					onDeptChange={setTransferDept}
					onNotesChange={setTransferNotes}
					onClose={closeTransfer}
					onReject={closeTransfer}
					onApprove={approveTransfer}
				/>
			) : null}
		</div>
	);
}
