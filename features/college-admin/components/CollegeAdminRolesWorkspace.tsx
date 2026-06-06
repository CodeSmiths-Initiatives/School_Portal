"use client";

import {
	BadgeCheck,
	Check,
	LoaderCircle,
	Plus,
	Save,
	ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
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

type ScopeType = "college" | "faculty" | "department" | "course";

const SCOPE_OPTIONS: Array<{ value: ScopeType; label: string }> = [
	{ value: "college", label: "College-wide" },
	{ value: "faculty", label: "Faculty scoped" },
	{ value: "department", label: "Department scoped" },
	{ value: "course", label: "Course scoped" },
];

function groupPermissions(permissions: CollegeAdminPermission[]) {
	return permissions.reduce<Record<string, CollegeAdminPermission[]>>(
		(groups, permission) => {
			const module = permission.module || permission.key.split(".")[0] || "General";
			groups[module] = [...(groups[module] ?? []), permission];
			return groups;
		},
		{},
	);
}

async function parseError(response: Response, fallback: string) {
	const payload = (await response.json().catch(() => null)) as
		| { error?: string }
		| null;
	return payload?.error ?? fallback;
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
	const [selectedRoleId, setSelectedRoleId] = useState(
		String(initialRoles[0]?.id ?? ""),
	);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [scopeType, setScopeType] = useState<ScopeType>("college");
	const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<string[]>([]);
	const [isCreating, setIsCreating] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const permissionGroups = useMemo(() => groupPermissions(permissions), [permissions]);
	const selectedRole = roles.find((role) => String(role.id) === selectedRoleId) ?? roles[0];
	const selectedRolePermissionKeys = selectedRole?.permissions.map((item) => item.key) ?? [];

	function toggleDraftPermission(key: string) {
		setSelectedPermissionKeys((current) =>
			current.includes(key)
				? current.filter((item) => item !== key)
				: [...current, key],
		);
	}

	function toggleExistingPermission(key: string) {
		if (!selectedRole) return;

		const existing = selectedRolePermissionKeys.includes(key)
			? selectedRolePermissionKeys.filter((item) => item !== key)
			: [...selectedRolePermissionKeys, key];

		setRoles((current) =>
			current.map((role) =>
				String(role.id) === String(selectedRole.id)
					? {
							...role,
							permissions: permissions.filter((permission) =>
								existing.includes(permission.key),
							),
						}
					: role,
			),
		);
	}

	async function createRole() {
		if (!canCreate || !name.trim()) return;

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
					body: JSON.stringify({
						name,
						description,
						scopeType,
						permissionKeys: selectedPermissionKeys,
					}),
				},
			);

			if (!response.ok) {
				throw new Error(await parseError(response, "Unable to create role."));
			}

			const payload = (await response.json()) as { role: CollegeAdminRole };
			setRoles((current) => [...current, payload.role].sort((a, b) => a.name.localeCompare(b.name)));
			setSelectedRoleId(String(payload.role.id));
			setName("");
			setDescription("");
			setScopeType("college");
			setSelectedPermissionKeys([]);
			setMessage(`${payload.role.name} was created for ${collegeName}.`);
		} catch (createError) {
			setError(createError instanceof Error ? createError.message : "Unable to create role.");
		} finally {
			setIsCreating(false);
		}
	}

	async function saveSelectedRole() {
		if (!canUpdate || !selectedRole) return;

		setIsSaving(true);
		setError("");
		setMessage("");

		try {
			const response = await fetch(
				`/api/college-admin/roles/${selectedRole.id}?collegeSlug=${encodeURIComponent(collegeSlug)}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: selectedRole.name,
						description: selectedRole.description ?? "",
						scopeType: selectedRole.scopeType,
						permissionKeys: selectedRole.permissions.map((permission) => permission.key),
					}),
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
			setMessage(`${payload.role.name} permissions were updated.`);
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Unable to update role.");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<section className="grid gap-5 xl:grid-cols-[minmax(22rem,0.8fr)_minmax(0,1.2fr)]">
			<div className="space-y-5">
				<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
					<p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#B7770D]">
						College Roles
					</p>
					<h2 className="mt-2 text-2xl font-black text-[#06183A]">
						Role and permission builder
					</h2>
					<p className="mt-2 text-sm leading-7 text-[#60728f]">
						Create HOD, clerk, cashier, supervisor, and other college-only
						roles. Permissions remain scoped to {collegeName}.
					</p>
					<div className="mt-5 grid gap-3 sm:grid-cols-2">
						<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
							<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
								Roles
							</p>
							<p className="mt-2 text-3xl font-black text-[#0D2B55]">{roles.length}</p>
						</div>
						<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
							<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
								Permissions
							</p>
							<p className="mt-2 text-3xl font-black text-[#0D2B55]">
								{permissions.length}
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
					<div className="flex items-center justify-between gap-3">
						<p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#B7770D]">
							Existing Roles
						</p>
						<ShieldCheck className="size-5 text-[#2E86C1]" />
					</div>
					<div className="mt-4 space-y-3">
						{roles.map((role) => (
							<button
								key={role.id}
								type="button"
								onClick={() => setSelectedRoleId(String(role.id))}
								className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
									String(role.id) === String(selectedRole?.id)
										? "border-[#B7770D] bg-[#fff8ec] ring-2 ring-[#B7770D]/10"
										: "border-[#dbe5f1] bg-[#fbfdff]"
								}`}
							>
								<div className="flex items-start justify-between gap-3">
									<div>
										<h3 className="font-black text-[#0D2B55]">{role.name}</h3>
										<p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#8395AF]">
											{role.scopeType} / {role.permissions.length} permissions
										</p>
									</div>
									<BadgeCheck className="size-5 text-[#B7770D]" />
								</div>
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="space-y-5">
				<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
					<p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#B7770D]">
						Create Role
					</p>
					<div className="mt-4 grid gap-3 lg:grid-cols-2">
						<input
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder="e.g. HOD Science"
							className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
						/>
						<select
							value={scopeType}
							onChange={(event) => setScopeType(event.target.value as ScopeType)}
							className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
						>
							{SCOPE_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
						<textarea
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							placeholder="Role description"
							className="min-h-24 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-[#0D2B55] outline-none focus:border-[#2E86C1] lg:col-span-2"
						/>
					</div>
					<div className="mt-4 max-h-64 overflow-y-auto rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-3">
						{Object.entries(permissionGroups).map(([module, items]) => (
							<div key={module} className="mb-4 last:mb-0">
								<p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#8395AF]">
									{module}
								</p>
								<div className="grid gap-2 sm:grid-cols-2">
									{items.map((permission) => (
										<label
											key={permission.key}
											className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#dbe5f1] bg-white px-3 py-2 text-sm font-bold text-[#0D2B55]"
										>
											<input
												type="checkbox"
												checked={selectedPermissionKeys.includes(permission.key)}
												onChange={() => toggleDraftPermission(permission.key)}
											/>
											{permission.label}
										</label>
									))}
								</div>
							</div>
						))}
					</div>
					<button
						type="button"
						onClick={createRole}
						disabled={!canCreate || isCreating || !name.trim()}
						className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isCreating ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
						Create Role
					</button>
				</div>

				<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#B7770D]">
								Permission Matrix
							</p>
							<h2 className="mt-2 text-xl font-black text-[#06183A]">
								{selectedRole?.name ?? "Select a role"}
							</h2>
							<p className="mt-1 text-sm text-[#60728f]">
								Update what this college role can view, add, edit, approve,
								print, export, or manage.
							</p>
						</div>
						<button
							type="button"
							onClick={saveSelectedRole}
							disabled={!canUpdate || isSaving || !selectedRole}
							className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white transition hover:bg-[#113765] disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isSaving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
							Save
						</button>
					</div>

					{message ? (
						<div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
							{message}
						</div>
					) : null}
					{error ? (
						<div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
							{error}
						</div>
					) : null}

					<div className="mt-5 grid gap-4 xl:grid-cols-2">
						{Object.entries(permissionGroups).map(([module, items]) => (
							<div key={module} className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4">
								<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
									{module}
								</p>
								<div className="mt-3 space-y-2">
									{items.map((permission) => {
										const checked = selectedRolePermissionKeys.includes(permission.key);

										return (
											<button
												key={permission.key}
												type="button"
												onClick={() => toggleExistingPermission(permission.key)}
												disabled={!selectedRole || !canUpdate}
												className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm font-bold transition ${
													checked
														? "border-[#B7770D]/50 bg-[#fff8ec] text-[#0D2B55]"
														: "border-[#dbe5f1] bg-white text-[#536783]"
												}`}
											>
												<span>{permission.label}</span>
												{checked ? <Check className="size-4 text-[#B7770D]" /> : null}
											</button>
										);
									})}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
