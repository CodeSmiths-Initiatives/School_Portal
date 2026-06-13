"use client";

import {
	Check,
	Eye,
	Filter,
	LoaderCircle,
	Pencil,
	RefreshCcw,
	Save,
	Search,
	ShieldCheck,
	Users,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { RowActionMenu } from "@/components/ui/row-action-menu";
import { toast } from "@/lib/toast";
import type {
	GlobalPermission,
	GlobalRoleCode,
	GlobalRoleManagementPayload,
	GlobalRoleTemplate,
} from "@/lib/services/superadmin-role.service";

type GlobalRolePermissionWorkspaceProps = {
	initialData: GlobalRoleManagementPayload;
};

type RoleFilter = "all" | GlobalRoleCode;
type ModalMode = "view" | "edit";

type RoleDraft = {
	permissionKeys: string[];
};

const PAGE_SIZE = 20;

const roleAccent = {
	"platform-college-admin": {
		icon: ShieldCheck,
		label: "College Admin",
		description:
			"Shared admin role used by every college admin. College assignment applies the tenant scope.",
	},
	"platform-student": {
		icon: Users,
		label: "Student",
		description:
			"Shared student role used by every applicant and student across all colleges.",
	},
} satisfies Record<
	GlobalRoleCode,
	{
		icon: typeof ShieldCheck;
		label: string;
		description: string;
	}
>;

function groupPermissions(permissions: GlobalPermission[]) {
	return permissions.reduce<Record<string, GlobalPermission[]>>((groups, permission) => {
		const moduleName = permission.module || permission.key.split(".")[0] || "General";
		groups[moduleName] = [...(groups[moduleName] ?? []), permission];
		return groups;
	}, {});
}

function getRolePermissions(role: GlobalRoleTemplate) {
	return role.permissions.map((permission) => permission.key);
}

function formatScope(value: GlobalRoleTemplate["scopeType"]) {
	return value
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function rolePill(role: GlobalRoleTemplate) {
	const tone =
		role.code === "platform-college-admin"
			? "border-sky-200 bg-sky-50 text-sky-700"
			: "border-emerald-200 bg-emerald-50 text-emerald-700";

	return `rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${tone}`;
}

async function parseError(response: Response, fallback: string) {
	const payload = (await response.json().catch(() => null)) as
		| { error?: string }
		| null;
	return payload?.error ?? fallback;
}

function PermissionPicker({
	permissionGroups,
	selectedKeys,
	readOnly,
	onToggle,
}: {
	permissionGroups: Record<string, GlobalPermission[]>;
	selectedKeys: string[];
	readOnly?: boolean;
	onToggle?: (key: string) => void;
}) {
	const [permissionSearch, setPermissionSearch] = useState("");
	const [moduleFilter, setModuleFilter] = useState("all");
	const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);
	const modules = useMemo(
		() => Object.keys(permissionGroups).sort((left, right) => left.localeCompare(right)),
		[permissionGroups],
	);
	const filteredGroups = useMemo(() => {
		const search = permissionSearch.trim().toLowerCase();

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

						return !search || haystack.includes(search);
					}),
				])
				.filter(([, items]) => items.length > 0),
		) as Record<string, GlobalPermission[]>;
	}, [moduleFilter, permissionGroups, permissionSearch, readOnly, selectedSet]);
	const filteredCount = useMemo(
		() => Object.values(filteredGroups).reduce((total, items) => total + items.length, 0),
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
					{modules.map((moduleName) => (
						<option key={moduleName} value={moduleName}>
							{moduleName}
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
				<div className="grid gap-4 xl:grid-cols-2">
					{Object.entries(filteredGroups).map(([moduleName, items]) => (
						<div
							key={moduleName}
							className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4"
						>
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
											{checked ? (
												<Check className="size-4 shrink-0 text-[#B7770D]" />
											) : null}
										</button>
									);
								})}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function RoleModal({
	role,
	mode,
	draft,
	permissionGroups,
	isSaving,
	onClose,
	onTogglePermission,
	onSave,
}: {
	role: GlobalRoleTemplate | null;
	mode: ModalMode | null;
	draft: RoleDraft;
	permissionGroups: Record<string, GlobalPermission[]>;
	isSaving: boolean;
	onClose: () => void;
	onTogglePermission: (key: string) => void;
	onSave: () => void;
}) {
	if (!role || !mode) {
		return null;
	}

	const isEdit = mode === "edit";
	const selectedKeys = isEdit ? draft.permissionKeys : getRolePermissions(role);
	const RoleIcon = roleAccent[role.code].icon;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
				<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
					<div className="flex items-start gap-4">
						<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-[#E4A11B]">
							<RoleIcon className="size-5" />
						</div>
						<div>
							<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
								{isEdit ? "Edit Template Permissions" : "Role Template Details"}
							</p>
							<h2 className="mt-2 text-xl font-black sm:text-2xl">{role.name}</h2>
							<p className="mt-1 text-sm font-semibold text-[#c5d4e8]">
								{role.code} - {selectedKeys.length} permissions
							</p>
						</div>
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
								{formatScope(role.scopeType)}
							</p>
						</div>
						<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
							<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
								Template
							</p>
							<p className="mt-2 text-lg font-black text-[#0D2B55]">
								{roleAccent[role.code].label}
							</p>
						</div>
					</div>

					<div className="mt-5 rounded-3xl border border-[#dbe5f1] bg-white">
						<div className="border-b border-[#dbe5f1] bg-[#fbfdff] px-5 py-4">
							<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
								Permission Matrix
							</p>
							<p className="mt-1 text-sm font-semibold text-[#60728f]">
								{isEdit
									? "Select the actions this global template should allow."
									: role.description || roleAccent[role.code].description}
							</p>
						</div>
						<div className="p-4">
							<PermissionPicker
								permissionGroups={permissionGroups}
								selectedKeys={selectedKeys}
								onToggle={onTogglePermission}
								readOnly={!isEdit}
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
						{isEdit ? (
							<button
								type="button"
								onClick={onSave}
								disabled={isSaving}
								className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866] disabled:cursor-not-allowed disabled:opacity-50"
							>
								{isSaving ? (
									<LoaderCircle className="size-4 animate-spin" />
								) : (
									<Save className="size-4" />
								)}
								Save permissions
							</button>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}

export function GlobalRolePermissionWorkspace({
	initialData,
}: GlobalRolePermissionWorkspaceProps) {
	const [roles, setRoles] = useState(initialData.roles);
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
	const [moduleFilter, setModuleFilter] = useState("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [openActionsId, setOpenActionsId] = useState<string | number | null>(null);
	const [modalRole, setModalRole] = useState<GlobalRoleTemplate | null>(null);
	const [modalMode, setModalMode] = useState<ModalMode | null>(null);
	const [draft, setDraft] = useState<RoleDraft>({ permissionKeys: [] });
	const [isSaving, setIsSaving] = useState(false);
	const permissionGroups = useMemo(
		() => groupPermissions(initialData.permissions),
		[initialData.permissions],
	);
	const moduleOptions = useMemo(
		() =>
			Array.from(
				new Set(
					initialData.permissions.map(
						(permission) => permission.module || permission.key.split(".")[0],
					),
				),
			).sort((left, right) => left.localeCompare(right)),
		[initialData.permissions],
	);
	const stats = useMemo(
		() => ({
			total: roles.length,
			adminPermissions:
				roles.find((role) => role.code === "platform-college-admin")?.permissions
					.length ?? 0,
			studentPermissions:
				roles.find((role) => role.code === "platform-student")?.permissions.length ??
				0,
			availablePermissions: initialData.permissions.length,
		}),
		[initialData.permissions.length, roles],
	);
	const filteredRoles = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return roles.filter((role) => {
			const hasModule =
				moduleFilter === "all" ||
				role.permissions.some(
					(permission) =>
						(permission.module || permission.key.split(".")[0]) === moduleFilter,
				);
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

			return (
				(roleFilter === "all" || role.code === roleFilter) &&
				hasModule &&
				(!normalizedSearch || haystack.includes(normalizedSearch))
			);
		});
	}, [moduleFilter, roleFilter, roles, search]);
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
		setRoleFilter("all");
		setModuleFilter("all");
		setCurrentPage(1);
	}

	function openRole(role: GlobalRoleTemplate, mode: ModalMode) {
		setModalRole(role);
		setModalMode(mode);
		setDraft({ permissionKeys: getRolePermissions(role) });
		setOpenActionsId(null);
	}

	function closeRoleModal() {
		setModalRole(null);
		setModalMode(null);
	}

	function toggleDraftPermission(key: string) {
		setDraft((current) => ({
			permissionKeys: current.permissionKeys.includes(key)
				? current.permissionKeys.filter((item) => item !== key)
				: [...current.permissionKeys, key].sort(),
		}));
	}

	async function saveSelectedRole() {
		if (!modalRole) {
			return;
		}

		setIsSaving(true);

		try {
			const response = await fetch("/api/superadmin/roles", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					roleCode: modalRole.code,
					permissionKeys: draft.permissionKeys,
				}),
			});

			if (!response.ok) {
				throw new Error(await parseError(response, "Unable to update role permissions."));
			}

			const payload = (await response.json()) as { role: GlobalRoleTemplate };
			setRoles((current) =>
				current.map((role) => (role.code === payload.role.code ? payload.role : role)),
			);
			setModalRole(payload.role);
			setDraft({ permissionKeys: getRolePermissions(payload.role) });
			toast.success({
				title: "Permissions updated",
				description: `${roleAccent[payload.role.code].label} template is now synced.`,
			});
		} catch (error) {
			toast.error({
				title: "Role update failed",
				description:
					error instanceof Error
						? error.message
						: "Please review the selected permissions.",
			});
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
							Global Role Templates
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							Role and permission table
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#556987]">
							Manage only the shared College Admin and Student templates. No new
							platform role is created here; tenant membership still comes from
							role assignments.
						</p>
					</div>
				</div>

				<div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{[
						["Global Roles", stats.total],
						["Admin Permissions", stats.adminPermissions],
						["Student Permissions", stats.studentPermissions],
						["Available Permissions", stats.availablePermissions],
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

			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-4 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
						<Filter className="size-4" />
						Filters
					</div>
					<button
						type="button"
						onClick={clearFilters}
						className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[#d3dfed] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
					>
						<RefreshCcw className="size-3.5" />
						Reset filters
					</button>
				</div>
				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_14rem_14rem]">
					<label className="relative">
						<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
						<input
							value={search}
							onChange={(event) => updateFilter(setSearch, event.target.value)}
							placeholder="Search role, code, permission"
							className="h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] pl-11 pr-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>
					<select
						value={roleFilter}
						onChange={(event) =>
							updateFilter(setRoleFilter, event.target.value as RoleFilter)
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						<option value="all">All roles</option>
						<option value="platform-college-admin">College Admin</option>
						<option value="platform-student">Student</option>
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
							Adjust the filters to see the global role templates.
						</p>
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className="min-w-[980px] w-full border-collapse text-left">
								<thead className="bg-[#f8fbff]">
									<tr className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
										<th className="px-5 py-4">Role</th>
										<th className="px-5 py-4">Template</th>
										<th className="px-5 py-4">Scope</th>
										<th className="px-5 py-4">Permissions</th>
										<th className="px-5 py-4">Modules</th>
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
													<span className={rolePill(role)}>
														{roleAccent[role.code].label}
													</span>
												</td>
												<td className="px-5 py-4">
													<p className="text-sm font-black text-[#0D2B55]">
														{formatScope(role.scopeType)}
													</p>
												</td>
												<td className="px-5 py-4">
													<p className="text-sm font-black text-[#0D2B55]">
														{role.permissions.length} permissions
													</p>
												</td>
												<td className="px-5 py-4">
													<p className="max-w-[20rem] truncate text-xs font-bold text-[#60728f]">
														{modules.length ? modules.join(", ") : "No modules assigned"}
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
				draft={draft}
				permissionGroups={permissionGroups}
				isSaving={isSaving}
				onClose={closeRoleModal}
				onTogglePermission={toggleDraftPermission}
				onSave={saveSelectedRole}
			/>
		</section>
	);
}
