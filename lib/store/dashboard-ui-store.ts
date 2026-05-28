"use client";

import { create } from "zustand";

type DashboardTab = "dashboard" | "application" | "transfer" | "cutoff" | "result";

type DashboardUiState = {
	activeTab: DashboardTab;
	searchQuery: string;
	departmentFilter: string;
	statusFilter: string;
	setActiveTab: (tab: DashboardTab) => void;
	setSearchQuery: (query: string) => void;
	setDepartmentFilter: (department: string) => void;
	setStatusFilter: (status: string) => void;
	resetFilters: () => void;
};

const initialFilters = {
	searchQuery: "",
	departmentFilter: "All Departments",
	statusFilter: "Pending",
};

export const useDashboardUiStore = create<DashboardUiState>((set) => ({
	activeTab: "dashboard",
	...initialFilters,
	setActiveTab: (activeTab) => set({ activeTab }),
	setSearchQuery: (searchQuery) => set({ searchQuery }),
	setDepartmentFilter: (departmentFilter) => set({ departmentFilter }),
	setStatusFilter: (statusFilter) => set({ statusFilter }),
	resetFilters: () => set(initialFilters),
}));
