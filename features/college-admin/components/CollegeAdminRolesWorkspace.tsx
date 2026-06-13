"use client";

import {
	Check,
	Eye,
	Filter,
	LoaderCircle,
	Pencil,
	Plus,
	Save,
	Search,
	ShieldCheck,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { RowActionMenu } from "@/components/ui/row-action-menu";
import type {
	CollegeAdminPermission,
	CollegeAdminRole,
} from "@/lib/services/college-admin.service";

type CollegeAdminRolesWorkspaceProps = {
	collegeSlug: string;
	collegeName: string;
	initialRoles: CollegeAdminRole[];
	permissions: CollegeAdminPermission[];
	canCreate: boolean;
	canUpdate: boolean;
};

type EditableScopeType = "college" | "faculty" | "department" | "course";
type RoleTypeFilter = "all" | CollegeAdminRole["roleType"];
type ScopeFilter = "all" | CollegeAdminRole["scopeType"];
type ModalMode = "view" | "edit";

type RoleDraft = {
	name: string;
	description: string;
	scopeType: EditableScopeType;
	permissionKeys: string[];
};

const PAGE_SIZE = 20;

const SCOPE_OPTIONS: Array<{ value: EditableScopeType; label: string }> = [
	{ value: "college", label: "College-wide" },
	{ value: "faculty", label: "Faculty scoped" },
	{ value: "department", label: "Department scoped" },
	{ value: "course", label: "Course scoped" },
];

const SCOPE_LABELS: Record<CollegeAdminRole["scopeType"], string> = {
	college: "College-wide",
	faculty: "Faculty",
	department: "Department",
	course: "Course",
	self: "Self",
	platform: "Platform",
};

function groupPermissions(permissions: CollegeAdminPermission[]) {
	return permissions.reduce<Record<string, CollegeAdminPermission[]>>(
		(groups, permission) => {
			const moduleName = permission.module || permission.key.split(".")[0] || "General";
			groups[moduleName] = [...(groups[moduleName] ?? []), permission];
			return groups;
		},
		{},
	);
}

function isEditableScope(value: CollegeAdminRole["scopeType"]): value is EditableScopeType {
	return ["college", "faculty", "department", "course"].includes(value);
}

function getRoleDraft(role?: CollegeAdminRole): RoleDraft {
	return {
		name: role?.name ?? "",
		description: role?.description ?? "",
		scopeType: role && isEditableScope(role.scopeType) ? role.scopeType : "college",
		permissionKeys: role?.permissions.map((permission) => permission.key) ?? [],
	};
}

function formatDate(value?: string) {
	if (!value) {
		return "Not saved";
	}

	return new Intl.DateTimeFormat("en-NG", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

function typePill(roleType: CollegeAdminRole["roleType"]) {
	const tone =
		roleType === "custom"
			? "border-emerald-200 bg-emerald-50 text-emerald-700"
			: "border-sky-200 bg-sky-50 text-sky-700";

	return `rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${tone}`;
}

function quoteCsv(value: unknown) {
	const text = String(value ?? "").replaceAll("\"", "\"\"");
	return `"${text}"`;
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
	const headers = Object.keys(rows[0] ?? {});
	const csv = [
		headers.map(quoteCsv).join(","),
		...rows.map((row) => headers.map((header) => quoteCsv(row[header])).join(",")),
	].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");

	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

async function parseError(response: Response, fallback: string) {
	const payload = (await response.json().catch(() => null)) as
		| { error?: string }
		| null;
	return payload?.error ?? fallback;
}

function PermissionGrid({
	permissionGroups,
	selectedKeys,
	onToggle,
	readOnly,
}: {
	permissionGroups: Record<string, CollegeAdminPermission[]>;
	selectedKeys: string[];
	onToggle?: (key: string) => void;
	readOnly?: boolean;
}) {
	const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);
	const visibleGroups = useMemo(
		() =>
			Object.entries(permissionGroups)
				.map(([moduleName, items]) => [
					moduleName,
					readOnly
						? items.filter((permission) => selectedSet.has(permission.key))
						: items,
				] as const)
				.filter(([, items]) => items.length > 0),
		[permissionGroups, readOnly, selectedSet],
	);

	return (
		<div className="grid gap-4 xl:grid-cols-2">
			{visibleGroups.map(([moduleName, items]) => (
				<div key={moduleName} className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4">
					<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
						{moduleName}
					</p>
					<div className="mt-3 space-y-2">
						{items.map((permission) => {
							const checked = selectedSet.has(permission.key);

							return (
								<button
									key={permission.key}
									type="button"
									onClick={() => onToggle?.(permission.key)}
									disabled={readOnly}
									className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm font-bold transition ${
										checked
											? "border-[#B7770D]/50 bg-[#fff8ec] text-[#0D2B55]"
											: "border-[#dbe5f1] bg-white text-[#536783] hover:border-[#2E86C1]"
									}`}
								>
									<span>
										<span className="block">{permission.label}</span>
										<span className="mt-1 block text-[11px] font-black uppercase tracking-[0.12em] text-[#8395AF]">
											{permission.key}
										</span>
									</span>
									{checked ? <Check className="size-4 shrink-0 text-[#B7770D]" /> : null}
								</button>
							);
						})}
					</div>
				</div>
			))}
		</div>
	);
}

function PermissionPicker({
	permissionGroups,
	selectedKeys,
	onToggle,
	readOnly,
}: {
	permissionGroups: Record<string, CollegeAdminPermission[]>;
	selectedKeys: string[];
	onToggle?: (key: string) => void;
	readOnly?: boolean;
}) {
	const [permissionSearch, setPermissionSearch] = useState("");
	const [moduleFilter, setModuleFilter] = useState("all");
	const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);
	const moduleOptions = useMemo(
		() => Object.keys(permissionGroups).sort((left, right) => left.localeCompare(right)),
		[permissionGroups],
	);
	const filteredGroups = useMemo(() => {
		const normalizedSearch = permissionSearch.trim().toLowerCase();

		return Object.fromEntries(
			Object.entries(permissionGroups)
				.filter(([moduleName]) => moduleFilter === "all" || moduleName === moduleFilter)
				.map(([moduleName, items]) => [
					moduleName,
					items.filter((permission) => {
						if (readOnly && !selectedSet.has(permission.key)) {
							return false;
						}

						const haystack = [
							moduleName,
							permission.key,
							permission.label,
							permission.module,
							permission.action,
							permission.description,
						]
							.join(" ")
							.toLowerCase();

						return !normalizedSearch || haystack.includes(normalizedSearch);
					}),
				])
				.filter(([, items]) => items.length > 0),
		) as Record<string, CollegeAdminPermission[]>;
	}, [moduleFilter, permissionGroups, permissionSearch, readOnly, selectedSet]);
	const filteredCount = useMemo(
		() =>
			Object.values(filteredGroups).reduce(
				(total, items) => total + items.length,
				0,
			),
		[filteredGroups],
	);

	function resetPermissionFilters() {
		setPermissionSearch("");
		setModuleFilter("all");
	}

	return (
		<div className="space-y-4">
			<div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem_auto]">
				<label className="relative">
					<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
					<input
						value={permissionSearch}
						onChange={(event) => setPermissionSearch(event.target.value)}
						placeholder="Search modules or permissions"
						className="h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] pl-11 pr-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
					/>
				</label>
				<select
					value={moduleFilter}
					onChange={(event) => setModuleFilter(event.target.value)}
					className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
				>
					<option value="all">All modules</option>
					{moduleOptions.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>
				<button
					type="button"
					onClick={resetPermissionFilters}
					className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#d3dfed] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
				>
					Reset
				</button>
			</div>
			<p className="text-xs font-bold text-[#60728f]">
				Showing {filteredCount} permission{filteredCount === 1 ? "" : "s"}.
			</p>
			{filteredCount === 0 ? (
				<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-5 text-sm font-bold text-[#60728f]">
					No permissions match this search.
				</div>
			) : (
				<PermissionGrid
					permissionGroups={filteredGroups}
					selectedKeys={selectedKeys}
					onToggle={onToggle}
					readOnly={readOnly}
				/>
			)}
		</div>
	);
}

function RoleModal({
	role,
	mode,
	draft,
	permissionGroups,
	canSave,
	isSaving,
	onClose,
	onDraftChange,
	onTogglePermission,
	onSave,
}: {
	role: CollegeAdminRole | null;
	mode: ModalMode | null;
	draft: RoleDraft;
	permissionGroups: Record<string, CollegeAdminPermission[]>;
	canSave: boolean;
	isSaving: boolean;
	onClose: () => void;
	onDraftChange: (draft: RoleDraft) => void;
	onTogglePermission: (key: string) => void;
	onSave: () => void;
}) {
	if (!role || !mode) {
		return null;
	}

	const isEdit = mode === "edit";
	const selectedKeys = isEdit
		? draft.permissionKeys
		: role.permissions.map((permission) => permission.key);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
				<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
							{isEdit ? "Edit Role Permissions" : "Role Details"}
						</p>
						<h2 className="mt-2 text-xl font-black sm:text-2xl">{role.name}</h2>
						<p className="mt-1 text-sm font-semibold text-[#c5d4e8]">
							{role.code} - {SCOPE_LABELS[role.scopeType]} - {role.permissions.length} permissions
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#0D2B55]"
						aria-label="Close role details"
					>
						<X className="size-5" />
					</button>
				</div>

				<div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-5 sm:p-6">
					{isEdit ? (
						<div className="grid gap-3 lg:grid-cols-2">
							<input
								value={draft.name}
								onChange={(event) =>
									onDraftChange({ ...draft, name: event.target.value })
								}
								placeholder="Role name"
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							/>
							<select
								value={draft.scopeType}
								onChange={(event) =>
									onDraftChange({
										...draft,
										scopeType: event.target.value as EditableScopeType,
									})
								}
								className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
							>
								{SCOPE_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
							<textarea
								value={draft.description}
								onChange={(event) =>
									onDraftChange({ ...draft, description: event.target.value })
								}
								placeholder="Role description"
								className="min-h-24 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-[#0D2B55] outline-none focus:border-[#2E86C1] lg:col-span-2"
							/>
						</div>
					) : (
						<div className="grid gap-3 md:grid-cols-3">
							<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
								<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
									Type
								</p>
								<p className="mt-2 text-lg font-black text-[#0D2B55]">
									{role.roleType}
								</p>
							</div>
							<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
								<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
									Scope
								</p>
								<p className="mt-2 text-lg font-black text-[#0D2B55]">
									{SCOPE_LABELS[role.scopeType]}
								</p>
							</div>
							<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
								<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
									Last Updated
								</p>
								<p className="mt-2 text-lg font-black text-[#0D2B55]">
									{formatDate(role.updatedAt)}
								</p>
							</div>
						</div>
					)}

					<div className="mt-5 rounded-3xl border border-[#dbe5f1] bg-white">
						<div className="border-b border-[#dbe5f1] bg-[#fbfdff] px-5 py-4">
							<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
								Permission Matrix
							</p>
							<p className="mt-1 text-sm font-semibold text-[#60728f]">
								{isEdit
									? "Select the actions this college role can use."
									: role.description || "Current permissions assigned to this role."}
							</p>
						</div>
						<div className="p-4">
							{!isEdit && selectedKeys.length === 0 ? (
								<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-5 text-sm font-bold text-[#60728f]">
									No permissions assigned.
								</div>
							) : (
								<PermissionPicker
									permissionGroups={permissionGroups}
									selectedKeys={selectedKeys}
									onToggle={onTogglePermission}
									readOnly={!isEdit}
								/>
							)}
						</div>
					</div>

					<div className="sticky bottom-0 mt-5 flex flex-col gap-3 border-t border-[#dbe5f1] bg-white/95 pt-4 backdrop-blur sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={onClose}
							className="inline-flex items-center justify-center rounded-2xl border border-[#dbe5f1] px-5 py-3 text-sm font-black text-[#0D2B55] transition hover:border-[#0D2B55]"
						>
							Close
						</button>
						{isEdit ? (
							<button
								type="button"
								onClick={onSave}
								disabled={!canSave || isSaving || !draft.name.trim()}
								className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866] disabled:cursor-not-allowed disabled:opacity-50"
							>
								{isSaving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
								Save role
							</button>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}

function CreateRoleModal({
	open,
	draft,
	permissionGroups,
	canCreate,
	isCreating,
	onClose,
	onDraftChange,
	onTogglePermission,
	onCreate,
}: {
	open: boolean;
	draft: RoleDraft;
	permissionGroups: Record<string, CollegeAdminPermission[]>;
	canCreate: boolean;
	isCreating: boolean;
	onClose: () => void;
	onDraftChange: (draft: RoleDraft) => void;
	onTogglePermission: (key: string) => void;
	onCreate: () => void;
}) {
	if (!open) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
				<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
							Create College Role
						</p>
						<h2 className="mt-2 text-xl font-black sm:text-2xl">
							New staff role
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#0D2B55]"
						aria-label="Close create role form"
					>
						<X className="size-5" />
					</button>
				</div>

				<div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-5 sm:p-6">
					<div className="grid gap-3 lg:grid-cols-2">
						<input
							value={draft.name}
							onChange={(event) =>
								onDraftChange({ ...draft, name: event.target.value })
							}
							placeholder="e.g. HOD Science"
							className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
						/>
						<select
							value={draft.scopeType}
							onChange={(event) =>
								onDraftChange({
									...draft,
									scopeType: event.target.value as EditableScopeType,
								})
							}
							className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
						>
							{SCOPE_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
						<textarea
							value={draft.description}
							onChange={(event) =>
								onDraftChange({ ...draft, description: event.target.value })
							}
							placeholder="Role description"
							className="min-h-24 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-[#0D2B55] outline-none focus:border-[#2E86C1] lg:col-span-2"
						/>
					</div>

					<div className="mt-5 rounded-3xl border border-[#dbe5f1] bg-white">
						<div className="border-b border-[#dbe5f1] bg-[#fbfdff] px-5 py-4">
							<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
								Permissions
							</p>
							<p className="mt-1 text-sm font-semibold text-[#60728f]">
								Choose the modules and actions this new role can access.
							</p>
						</div>
						<div className="p-4">
							<PermissionPicker
								permissionGroups={permissionGroups}
								selectedKeys={draft.permissionKeys}
								onToggle={onTogglePermission}
							/>
						</div>
					</div>

					<div className="sticky bottom-0 mt-5 flex flex-col gap-3 border-t border-[#dbe5f1] bg-white/95 pt-4 backdrop-blur sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={onClose}
							className="inline-flex items-center justify-center rounded-2xl border border-[#dbe5f1] px-5 py-3 text-sm font-black text-[#0D2B55] transition hover:border-[#0D2B55]"
						>
							Close
						</button>
						<button
							type="button"
							onClick={onCreate}
							disabled={!canCreate || isCreating || !draft.name.trim()}
							className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866] disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isCreating ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
							Create role
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function CollegeAdminRolesWorkspace({
	collegeSlug,
	collegeName,
	initialRoles,
	permissions,
	canCreate,
	canUpdate,
}: CollegeAdminRolesWorkspaceProps) {
	const [roles, setRoles] = useState(initialRoles);
	const [search, setSearch] = useState("");
	const [roleType, setRoleType] = useState<RoleTypeFilter>("all");
	const [scopeType, setScopeType] = useState<ScopeFilter>("all");
	const [moduleFilter, setModuleFilter] = useState("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [openActionsId, setOpenActionsId] = useState<string | number | null>(null);
	const [modalRole, setModalRole] = useState<CollegeAdminRole | null>(null);
	const [modalMode, setModalMode] = useState<ModalMode | null>(null);
	const [editDraft, setEditDraft] = useState<RoleDraft>(getRoleDraft());
	const [createOpen, setCreateOpen] = useState(false);
	const [createDraft, setCreateDraft] = useState<RoleDraft>(getRoleDraft());
	const [isCreating, setIsCreating] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const permissionGroups = useMemo(() => groupPermissions(permissions), [permissions]);
	const moduleOptions = useMemo(
		() => Object.keys(permissionGroups).sort((left, right) => left.localeCompare(right)),
		[permissionGroups],
	);
	const scopeOptions = useMemo(
		() =>
			Array.from(new Set(roles.map((role) => role.scopeType))).sort((left, right) =>
				SCOPE_LABELS[left].localeCompare(SCOPE_LABELS[right]),
			),
		[roles],
	);
	const stats = useMemo(
		() => ({
			total: roles.length,
			custom: roles.filter((role) => role.roleType === "custom").length,
			system: roles.filter((role) => role.roleType === "system").length,
			assignedPermissions: roles.reduce(
				(total, role) => total + role.permissions.length,
				0,
			),
		}),
		[roles],
	);
	const filteredRoles = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return roles.filter((role) => {
			const haystack = [
				role.name,
				role.code,
				role.description,
				role.roleType,
				role.scopeType,
				...role.permissions.flatMap((permission) => [
					permission.key,
					permission.label,
					permission.module,
				]),
			]
				.join(" ")
				.toLowerCase();
			const hasModule =
				moduleFilter === "all" ||
				role.permissions.some(
					(permission) =>
						(permission.module || permission.key.split(".")[0]) === moduleFilter,
				);

			return (
				(!normalizedSearch || haystack.includes(normalizedSearch)) &&
				(roleType === "all" || role.roleType === roleType) &&
				(scopeType === "all" || role.scopeType === scopeType) &&
				hasModule
			);
		});
	}, [moduleFilter, roleType, roles, scopeType, search]);
	const pageCount = Math.max(1, Math.ceil(filteredRoles.length / PAGE_SIZE));
	const safePage = Math.min(currentPage, pageCount);
	const paginatedRoles = filteredRoles.slice(
		(safePage - 1) * PAGE_SIZE,
		safePage * PAGE_SIZE,
	);

	function updateFilter<T>(setter: (value: T) => void, value: T) {
		setter(value);
		setCurrentPage(1);
	}

	function clearFilters() {
		setSearch("");
		setRoleType("all");
		setScopeType("all");
		setModuleFilter("all");
		setCurrentPage(1);
	}

	function toggleDraftPermission(
		draft: RoleDraft,
		setter: (draft: RoleDraft) => void,
		key: string,
	) {
		setter({
			...draft,
			permissionKeys: draft.permissionKeys.includes(key)
				? draft.permissionKeys.filter((item) => item !== key)
				: [...draft.permissionKeys, key],
		});
	}

	function openRole(role: CollegeAdminRole, mode: ModalMode) {
		setModalRole(role);
		setModalMode(mode);
		setEditDraft(getRoleDraft(role));
		setError("");
		setMessage("");
		closeActions();
	}

	function closeRoleModal() {
		setModalRole(null);
		setModalMode(null);
	}

	function closeActions() {
		setOpenActionsId(null);
	}

	function openCreateModal() {
		setCreateDraft(getRoleDraft());
		setCreateOpen(true);
		setError("");
		setMessage("");
	}

	function exportFiltered() {
		downloadCsv(
			`${collegeSlug}-roles.csv`,
			filteredRoles.map((role) => ({
				name: role.name,
				code: role.code,
				roleType: role.roleType,
				scopeType: role.scopeType,
				permissions: role.permissions.length,
				permissionKeys: role.permissions.map((permission) => permission.key).join("; "),
				updatedAt: role.updatedAt ?? "",
			})),
		);
	}

	async function createRole() {
		if (!canCreate || !createDraft.name.trim()) return;

		setIsCreating(true);
		setError("");
		setMessage("");

		try {
			const response = await fetch(
				`/api/college-admin/roles?collegeSlug=${encodeURIComponent(collegeSlug)}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(createDraft),
				},
			);

			if (!response.ok) {
				throw new Error(await parseError(response, "Unable to create role."));
			}

			const payload = (await response.json()) as { role: CollegeAdminRole };
			setRoles((current) =>
				[...current, payload.role].sort((a, b) => a.name.localeCompare(b.name)),
			);
			setCreateOpen(false);
			setCreateDraft(getRoleDraft());
			setMessage(`${payload.role.name} was created for ${collegeName}.`);
		} catch (createError) {
			setError(createError instanceof Error ? createError.message : "Unable to create role.");
		} finally {
			setIsCreating(false);
		}
	}

	async function saveSelectedRole() {
		if (!canUpdate || !modalRole || !editDraft.name.trim()) return;

		setIsSaving(true);
		setError("");
		setMessage("");

		try {
			const response = await fetch(
				`/api/college-admin/roles/${modalRole.id}?collegeSlug=${encodeURIComponent(collegeSlug)}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(editDraft),
				},
			);

			if (!response.ok) {
				throw new Error(await parseError(response, "Unable to update role."));
			}

			const payload = (await response.json()) as { role: CollegeAdminRole };
			setRoles((current) =>
				current.map((role) =>
					String(role.id) === String(payload.role.id) ? payload.role : role,
				),
			);
			setModalRole(payload.role);
			setEditDraft(getRoleDraft(payload.role));
			setMessage(`${payload.role.name} permissions were updated.`);
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Unable to update role.");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<section className="space-y-5">
			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							College Roles
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							Role and permission table
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#556987]">
							Create HOD, clerk, cashier, supervisor, and other college-only
							roles for {collegeName}. Use View to inspect permissions and Edit
							to update role access.
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={exportFiltered}
							disabled={filteredRoles.length === 0}
							className="inline-flex h-12 items-center gap-2 rounded-2xl border border-[#d3dfed] bg-white px-5 text-sm font-black text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D] disabled:cursor-not-allowed disabled:opacity-50"
						>
							<ShieldCheck className="size-4" />
							Export CSV
						</button>
						<button
							type="button"
							onClick={openCreateModal}
							disabled={!canCreate}
							className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<Plus className="size-4" />
							Create Role
						</button>
					</div>
				</div>

				<div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{[
						["Total Roles", stats.total],
						["Custom Roles", stats.custom],
						["System Roles", stats.system],
						["Assigned Permissions", stats.assignedPermissions],
					].map(([label, value]) => (
						<div
							key={label}
							className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4"
						>
							<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
								{label}
							</p>
							<p className="mt-2 text-3xl font-black text-[#0D2B55]">{value}</p>
						</div>
					))}
				</div>
			</div>

			{message ? (
				<div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
					{message}
				</div>
			) : null}
			{error ? (
				<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
					{error}
				</div>
			) : null}

			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-4 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
						<Filter className="size-4" />
						Filters
					</div>
					<button
						type="button"
						onClick={clearFilters}
						className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#d3dfed] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
					>
						Reset filters
					</button>
				</div>
				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
					<label className="relative xl:col-span-2">
						<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
						<input
							value={search}
							onChange={(event) => updateFilter(setSearch, event.target.value)}
							placeholder="Search role, code, permission"
							className="h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] pl-11 pr-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>
					<select
						value={roleType}
						onChange={(event) =>
							updateFilter(setRoleType, event.target.value as RoleTypeFilter)
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="all">All role types</option>
						<option value="custom">Custom</option>
						<option value="system">System</option>
					</select>
					<select
						value={scopeType}
						onChange={(event) =>
							updateFilter(setScopeType, event.target.value as ScopeFilter)
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="all">All scopes</option>
						{scopeOptions.map((option) => (
							<option key={option} value={option}>
								{SCOPE_LABELS[option]}
							</option>
						))}
					</select>
					<select
						value={moduleFilter}
						onChange={(event) => updateFilter(setModuleFilter, event.target.value)}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="all">All modules</option>
						{moduleOptions.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="overflow-hidden rounded-3xl border border-[#d7e2f0] bg-white shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe5f1] px-4 py-4 sm:px-5">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
							Roles Table
						</p>
						<p className="mt-1 text-sm font-semibold text-[#60728f]">
							Showing {paginatedRoles.length} of {filteredRoles.length} roles
						</p>
					</div>
					<div className="flex items-center gap-2 rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-4 py-2 text-xs font-black text-[#0D2B55]">
						Page {safePage} of {pageCount}
					</div>
				</div>

				{filteredRoles.length === 0 ? (
					<div className="p-8 text-center">
						<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eef4fb] text-[#2E86C1]">
							<ShieldCheck className="size-6" />
						</div>
						<h3 className="mt-4 text-lg font-black text-[#06183A]">
							No roles found
						</h3>
						<p className="mt-2 text-sm text-[#60728f]">
							Adjust the filters or create a college-scoped staff role.
						</p>
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className="min-w-[980px] w-full border-collapse text-left">
								<thead className="bg-[#f8fbff]">
									<tr className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
										<th className="px-5 py-4">Role</th>
										<th className="px-5 py-4">Type</th>
										<th className="px-5 py-4">Scope</th>
										<th className="px-5 py-4">Permissions</th>
										<th className="px-5 py-4">Last Updated</th>
										<th className="px-5 py-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[#dbe5f1]">
									{paginatedRoles.map((role) => {
										const modules = Array.from(
											new Set(
												role.permissions.map(
													(permission) =>
														permission.module || permission.key.split(".")[0],
												),
											),
										).sort((left, right) => left.localeCompare(right));

										return (
											<tr
												key={role.id}
												className="bg-white transition hover:bg-[#f8fbff]"
											>
												<td className="px-5 py-4">
													<p className="font-black text-[#06183A]">{role.name}</p>
													<p className="mt-1 max-w-[18rem] break-words text-sm font-semibold text-[#60728f]">
														{role.code}
													</p>
												</td>
												<td className="px-5 py-4">
													<span className={typePill(role.roleType)}>
														{role.roleType}
													</span>
												</td>
												<td className="px-5 py-4">
													<p className="text-sm font-black text-[#0D2B55]">
														{SCOPE_LABELS[role.scopeType]}
													</p>
												</td>
												<td className="px-5 py-4">
													<p className="text-sm font-black text-[#0D2B55]">
														{role.permissions.length} permissions
													</p>
													<p className="mt-1 max-w-[20rem] truncate text-xs font-bold text-[#60728f]">
														{modules.length ? modules.join(", ") : "No modules assigned"}
													</p>
												</td>
												<td className="px-5 py-4">
													<p className="text-sm font-bold text-[#60728f]">
														{formatDate(role.updatedAt)}
													</p>
												</td>
												<td className="px-5 py-4">
													<RowActionMenu
														label={`Open actions for ${role.name}`}
														open={openActionsId === role.id}
														onOpenChange={(open) =>
															setOpenActionsId(open ? role.id : null)
														}
														items={[
															{
																label: "View",
																icon: <Eye className="size-4" />,
																onSelect: () => openRole(role, "view"),
															},
															{
																label: "Edit permissions",
																icon: <Pencil className="size-4" />,
																disabled: !canUpdate,
																className: "text-[#0D2B55] hover:bg-[#eef4fb]",
																onSelect: () => openRole(role, "edit"),
															},
														]}
													/>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>

						<div className="flex flex-col gap-3 border-t border-[#dbe5f1] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
							<p className="text-sm font-semibold text-[#60728f]">
								Rows per page: {PAGE_SIZE}
							</p>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
									disabled={safePage === 1}
									className="h-10 rounded-2xl border border-[#d3dfed] bg-white px-4 text-sm font-black text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D] disabled:cursor-not-allowed disabled:opacity-40"
								>
									Previous
								</button>
								<button
									type="button"
									onClick={() =>
										setCurrentPage((page) => Math.min(pageCount, page + 1))
									}
									disabled={safePage === pageCount}
									className="h-10 rounded-2xl bg-[#0D2B55] px-4 text-sm font-black text-white transition hover:bg-[#123866] disabled:cursor-not-allowed disabled:opacity-40"
								>
									Next
								</button>
							</div>
						</div>
					</>
				)}
			</div>

			<RoleModal
				role={modalRole}
				mode={modalMode}
				draft={editDraft}
				permissionGroups={permissionGroups}
				canSave={canUpdate}
				isSaving={isSaving}
				onClose={closeRoleModal}
				onDraftChange={setEditDraft}
				onTogglePermission={(key) =>
					toggleDraftPermission(editDraft, setEditDraft, key)
				}
				onSave={saveSelectedRole}
			/>
			<CreateRoleModal
				open={createOpen}
				draft={createDraft}
				permissionGroups={permissionGroups}
				canCreate={canCreate}
				isCreating={isCreating}
				onClose={() => setCreateOpen(false)}
				onDraftChange={setCreateDraft}
				onTogglePermission={(key) =>
					toggleDraftPermission(createDraft, setCreateDraft, key)
				}
				onCreate={createRole}
			/>
		</section>
	);
}
