"use client";

import { useState } from "react";
import { MOCK_APPLICATIONS, MOCK_TRANSFERS } from "@/features/dashboard/utils/dashboard";
import {
	Application,
	TabKey,
	TransferRequest,
	TransferRow,
} from "@/features/dashboard/types/dashboard.types";
import ApplicationView from "@/features/dashboard/components/ApplicationView";
import DashboardView from "@/features/dashboard/components/DashboardView";
import NavBar from "@/features/dashboard/components/Navbar";
import TransferModal from "@/features/dashboard/components/TransferModal";
import TransferView from "@/features/dashboard/components/TransferView";
import CutoffView from "@/features/dashboard/components/CutoffView";
import ResultView from "@/features/dashboard/components/ResultView";
// import dashboardHeader from "@/features/dashboard/components/dashboardHeader";

export function useDashboard() {
	const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
	const [applications, setApplications] =
		useState<Application[]>(MOCK_APPLICATIONS);
	const [transfers, setTransfers] = useState<TransferRow[]>(MOCK_TRANSFERS);
	const [searchQuery, setSearchQuery] = useState("");
	const [departmentFilter, setDepartmentFilter] = useState("All Departments");
	const [statusFilter, setStatusFilter] = useState("Pending");
	const [transferModal, setTransferModal] = useState<TransferRequest | null>(
		null,
	);
	const [transferDept, setTransferDept] = useState("");
	const [transferNotes, setTransferNotes] = useState("");

	const filteredApps = applications.filter((app) => {
		const matchSearch =
			!searchQuery ||
			app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			app.ref.toLowerCase().includes(searchQuery.toLowerCase());
		const matchDept =
			departmentFilter === "All Departments" ||
			app.firstChoice === departmentFilter;
		const matchStatus = statusFilter === "All" || app.status === statusFilter;
		return matchSearch && matchDept && matchStatus;
	});

	function handleAdmit(ref: string) {
		setApplications((prev) =>
			prev.map((a) => (a.ref === ref ? { ...a, status: "Admitted" } : a)),
		);
	}

	function handleReject(ref: string) {
		setApplications((prev) =>
			prev.map((a) => (a.ref === ref ? { ...a, status: "Rejected" } : a)),
		);
	}

	function openTransfer(app: Application) {
		setTransferModal({
			ref: app.ref,
			name: app.name,
			currentDepartment: app.firstChoice,
			initiatedBy: "Admin - initiated transfer",
		});
		setTransferDept("");
		setTransferNotes("");
	}

	function closeTransfer() {
		setTransferModal(null);
	}

	function approveTransfer() {
		if (!transferDept || !transferModal) return;
		setApplications((prev) =>
			prev.map((a) =>
				a.ref === transferModal.ref
					? { ...a, firstChoice: transferDept, status: "Admitted" }
					: a,
			),
		);
		closeTransfer();
	}

	return {
		activeTab,
		setActiveTab,
		applications,
		filteredApps,
		transfers,
		searchQuery,
		setSearchQuery,
		departmentFilter,
		setDepartmentFilter,
		statusFilter,
		setStatusFilter,
		transferModal,
		transferDept,
		setTransferDept,
		transferNotes,
		setTransferNotes,
		handleAdmit,
		handleReject,
		openTransfer,
		closeTransfer,
		approveTransfer,
	};
}

const PAGE_TITLES: Record<string, string> = {
	dashboard: "Dashboard",
	application: "Successfully screen",
	transfer: "Transfer Results",
	cutoff: "Cut-Off Manager",
	result: "Admission Result",
};

const INNER_TITLES: Record<string, string> = {
	dashboard: "Dashboard",
	application: "Application Management",
	transfer: "Transfer Requests",
	cutoff: "Cut-off Manager",
	result: "Admission Results",
};

const INNER_SUBTITLES: Record<string, string> = {
	application: "Bursary Department - Season 2025/2026",
	transfer: "",
	cutoff: "",
	result: "",
};
export default function page() {
	const {
		activeTab,
		setActiveTab,
		applications,
		filteredApps,
		transfers,
		searchQuery,
		setSearchQuery,
		departmentFilter,
		setDepartmentFilter,
		statusFilter,
		setStatusFilter,
		transferModal,
		transferDept,
		setTransferDept,
		transferNotes,
		setTransferNotes,
		handleAdmit,
		handleReject,
		openTransfer,
		closeTransfer,
		approveTransfer,
	} = useDashboard();

	return (
		<div className="min-h-screen bg-[#eef3fb] flex flex-col">
			{/* <dashboardHeader title={PAGE_TITLES[activeTab] ?? "Dashboard"} /> */}

			<main className="flex-1 px-8 py-6 flex flex-col gap-5">
				{/* Inner card header */}
				<div className="bg-[#0d1b3e] rounded-2xl px-6 py-4 flex items-center justify-between">
					<div>
						<h2 className="text-white font-bold text-lg">
							{INNER_TITLES[activeTab]}
						</h2>
						{INNER_SUBTITLES[activeTab] && (
							<p className="text-white/50 text-xs mt-0.5">
								{INNER_SUBTITLES[activeTab]}
							</p>
						)}
					</div>
					<div className="flex gap-3">
						<button
							className="border border-white/30 text-white text-sm font-semibold
              px-5 py-2 rounded-xl hover:bg-white/10 transition-colors"
						>
							Admission Officer
						</button>
						<button
							className="border border-white/30 text-white text-sm font-semibold
              px-5 py-2 rounded-xl hover:bg-white/10 transition-colors"
						>
							Home
						</button>
					</div>
				</div>

				{/* Tab nav */}
				<NavBar active={activeTab} onChange={setActiveTab} />

				{/* Tab content */}
				{activeTab === "dashboard" && (
					<DashboardView applications={applications} />
				)}

				{activeTab === "application" && (
					<ApplicationView
						applications={filteredApps}
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
			</main>

			{/* Transfer review modal */}
			{transferModal && (
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
			)}
		</div>
	);
}
