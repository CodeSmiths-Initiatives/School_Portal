"use client";

import {
	BadgeCheck,
	Check,
	KeyRound,
	Plus,
	Save,
	Search,
	ShieldCheck,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
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

type PermissionDraft = {
	key: string;
	label: string;
	description: string;
};

const emptyPermissionDraft: PermissionDraft = {
	key: "",
	label: "",
	description: "",
};

const roleAccent = {
	"platform-college-admin": {
		icon: ShieldCheck,
		label: "College Admin",
		description:
			"Shared admin role used by every college admin. Scope is applied by college assignment.",
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
		const moduleKey = permission.module || permission.key.split(".")[0] || "general";
		return {
			...groups,
			[moduleKey]: [...(groups[moduleKey] ?? []), permission],
		};
	}, {});
}

function normalizeSearch(value: string) {
	return value.trim().toLowerCase();
}

function permissionMatches(permission: GlobalPermission, query: string) {
	if (!query) {
		return true;
	}

	return [permission.key, permission.module, permission.action, permission.label]
		.filter(Boolean)
		.some((value) => String(value).toLowerCase().includes(query));
}

function getRolePermissions(role: GlobalRoleTemplate) {
	return new Set(role.permissions.map((permission) => permission.key));
}

function getPermissionModuleLabel(module: string) {
	return module
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

export function GlobalRolePermissionWorkspace({
	initialData,
}: GlobalRolePermissionWorkspaceProps) {
	const [roles, setRoles] = useState(initialData.roles);
	const [permissions, setPermissions] = useState(initialData.permissions);
	const [activeRoleCode, setActiveRoleCode] =
		useState<GlobalRoleCode>("platform-college-admin");
	const [selectedByRole, setSelectedByRole] = useState(() =>
		Object.fromEntries(
			initialData.roles.map((role) => [
				role.code,
				Array.from(getRolePermissions(role)),
			]),
		) as Record<GlobalRoleCode, string[]>,
	);
	const [search, setSearch] = useState("");
	const [permissionDraft, setPermissionDraft] =
		useState<PermissionDraft>(emptyPermissionDraft);
	const [isSaving, setIsSaving] = useState(false);
	const [isCreatingPermission, setIsCreatingPermission] = useState(false);

	const activeRole = roles.find((role) => role.code === activeRoleCode);
	const activePermissionSet = new Set(selectedByRole[activeRoleCode] ?? []);
	const query = normalizeSearch(search);
	const filteredPermissions = useMemo(
		() => permissions.filter((permission) => permissionMatches(permission, query)),
		[permissions, query],
	);
	const groupedPermissions = useMemo(
		() => groupPermissions(filteredPermissions),
		[filteredPermissions],
	);
	const modules = Object.keys(groupedPermissions).sort();
	const totalSelected = activePermissionSet.size;

	function togglePermission(permissionKey: string) {
		setSelectedByRole((current) => {
			const currentKeys = new Set(current[activeRoleCode] ?? []);

			if (currentKeys.has(permissionKey)) {
				currentKeys.delete(permissionKey);
			} else {
				currentKeys.add(permissionKey);
			}

			return {
				...current,
				[activeRoleCode]: Array.from(currentKeys).sort(),
			};
		});
	}

	async function handleSaveRole() {
		setIsSaving(true);

		try {
			const response = await fetch("/api/superadmin/roles", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					roleCode: activeRoleCode,
					permissionKeys: selectedByRole[activeRoleCode] ?? [],
				}),
			});
			const payload = (await response.json().catch(() => null)) as
				| { role?: GlobalRoleTemplate; error?: string }
				| null;

			if (!response.ok || !payload?.role) {
				throw new Error(payload?.error ?? "Unable to update role permissions.");
			}

			setRoles((current) =>
				current.map((role) => (role.code === payload.role!.code ? payload.role! : role)),
			);
			setSelectedByRole((current) => ({
				...current,
				[payload.role!.code]: payload.role!.permissions.map(
					(permission) => permission.key,
				),
			}));
			toast.success({
				title: "Permissions updated",
				description: `${roleAccent[activeRoleCode].label} permissions are now synced.`,
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

	async function handleCreatePermission(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsCreatingPermission(true);

		try {
			const response = await fetch("/api/superadmin/roles", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(permissionDraft),
			});
			const payload = (await response.json().catch(() => null)) as
				| { permission?: GlobalPermission; error?: string }
				| null;

			if (!response.ok || !payload?.permission) {
				throw new Error(payload?.error ?? "Unable to create permission.");
			}

			setPermissions((current) =>
				[...current, payload.permission!].sort((left, right) =>
					left.key.localeCompare(right.key),
				),
			);
			setPermissionDraft(emptyPermissionDraft);
			toast.success({
				title: "Permission created",
				description: `${payload.permission.key} is ready for role assignment.`,
			});
		} catch (error) {
			toast.error({
				title: "Permission creation failed",
				description:
					error instanceof Error
						? error.message
						: "Use a unique module.action permission key.",
			});
		} finally {
			setIsCreatingPermission(false);
		}
	}

	return (
		<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
			<section className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							Global Role Templates
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							Student and college admin permissions
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#556987]">
							These templates are reused across every college. College context is
							still enforced by role assignment, so permissions stay consistent
							while tenant data remains isolated.
						</p>
					</div>
					<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] px-4 py-3">
						<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
							Selected
						</p>
						<p className="mt-2 text-2xl font-black text-[#0D2B55]">
							{totalSelected}
						</p>
					</div>
				</div>

				<div className="mt-6 grid gap-3 md:grid-cols-2">
					{roles.map((role) => {
						const meta = roleAccent[role.code];
						const Icon = meta.icon;
						const isActive = role.code === activeRoleCode;

						return (
							<button
								key={role.code}
								type="button"
								onClick={() => setActiveRoleCode(role.code)}
								className={`rounded-2xl border p-4 text-left transition ${
									isActive
										? "border-[#B7770D] bg-[#0D2B55] text-white shadow-[0_18px_34px_rgba(13,43,85,0.18)]"
										: "border-[#dbe5f1] bg-[#fbfdff] text-[#0D2B55] hover:border-[#B7770D]/40"
								}`}
							>
								<div className="flex items-start gap-3">
									<div
										className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${
											isActive
												? "bg-white/10 text-[#E4A11B]"
												: "bg-[#eef4fb] text-[#2E86C1]"
										}`}
									>
										<Icon className="size-5" />
									</div>
									<div>
										<p className="text-base font-black">{meta.label}</p>
										<p
											className={`mt-1 text-xs font-black uppercase tracking-[0.2em] ${
												isActive ? "text-[#E4A11B]" : "text-[#8395AF]"
											}`}
										>
											{role.code}
										</p>
										<p
											className={`mt-2 text-sm leading-6 ${
												isActive ? "text-[#c8d6ea]" : "text-[#5d718f]"
											}`}
										>
											{meta.description}
										</p>
									</div>
								</div>
							</button>
						);
					})}
				</div>

				<div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-3">
					<div className="flex items-center gap-3 px-2">
						<div className="flex size-10 items-center justify-center rounded-full bg-white text-[#B7770D]">
							<KeyRound className="size-5" />
						</div>
						<div>
							<p className="text-sm font-black text-[#0D2B55]">
								{activeRole ? roleAccent[activeRole.code].label : "Role"} access
								matrix
							</p>
							<p className="text-xs font-semibold text-[#6b7f9c]">
								Toggle permissions, then save to update the global template.
							</p>
						</div>
					</div>
					<div className="relative w-full sm:w-80">
						<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8395AF]" />
						<input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search permission key or module"
							className="h-12 w-full rounded-2xl border border-[#cbd9ec] bg-white pl-11 pr-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</div>
				</div>

				<div className="mt-5 space-y-4">
					{modules.map((module) => (
						<div
							key={module}
							className="rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-4"
						>
							<div className="flex items-center justify-between gap-3">
								<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
									{getPermissionModuleLabel(module)}
								</p>
								<span className="rounded-full border border-[#dbe5f1] bg-white px-3 py-1 text-xs font-black text-[#60728f]">
									{groupedPermissions[module].length} actions
								</span>
							</div>
							<div className="mt-3 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
								{groupedPermissions[module].map((permission) => {
									const checked = activePermissionSet.has(permission.key);

									return (
										<button
											key={permission.key}
											type="button"
											onClick={() => togglePermission(permission.key)}
											className={`rounded-2xl border p-3 text-left transition ${
												checked
													? "border-[#B7770D]/70 bg-[#fff8ec]"
													: "border-[#dbe5f1] bg-white hover:border-[#B7770D]/40"
											}`}
										>
											<div className="flex items-start gap-3">
												<div
													className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border ${
														checked
															? "border-[#B7770D] bg-[#B7770D] text-white"
															: "border-[#cbd9ec] bg-[#f8fbff] text-transparent"
													}`}
												>
													<Check className="size-3.5" />
												</div>
												<div className="min-w-0">
													<p className="truncate text-sm font-black text-[#0D2B55]">
														{permission.label}
													</p>
													<p className="mt-1 truncate text-xs font-bold text-[#60728f]">
														{permission.key}
													</p>
												</div>
											</div>
										</button>
									);
								})}
							</div>
						</div>
					))}
				</div>
			</section>

			<aside className="space-y-5">
				<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
					<div className="rounded-2xl bg-[#0D2B55] p-5 text-white">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#E4A11B]">
									Save Template
								</p>
								<h3 className="mt-2 text-xl font-black">
									{roleAccent[activeRoleCode].label}
								</h3>
							</div>
							<div className="flex size-12 items-center justify-center rounded-full border border-[#B7770D] text-[#E4A11B]">
								<BadgeCheck className="size-5" />
							</div>
						</div>
						<p className="mt-3 text-sm leading-6 text-[#b8c7dc]">
							Changes apply to every user assigned this global role template
							across all colleges.
						</p>
					</div>

					<button
						type="button"
						onClick={handleSaveRole}
						disabled={isSaving}
						className="mt-5 flex h-13 w-full items-center justify-center gap-3 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_14px_26px_rgba(13,43,85,0.24)] transition hover:bg-[#123a73] disabled:cursor-not-allowed disabled:opacity-60"
					>
						<Save className="size-4" />
						{isSaving ? "Saving permissions..." : "Save Role Permissions"}
					</button>
				</div>

				<form
					onSubmit={handleCreatePermission}
					className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)]"
				>
					<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
						New Permission
					</p>
					<h3 className="mt-2 text-xl font-black text-[#06183A]">
						Add module action
					</h3>
					<p className="mt-2 text-sm leading-6 text-[#60728f]">
						Use a stable key like <span className="font-black">course.delete</span>.
						New keys become available immediately for Student/Admin templates.
					</p>

					<label className="mt-5 block">
						<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
							Permission Key
						</span>
						<input
							required
							value={permissionDraft.key}
							onChange={(event) =>
								setPermissionDraft((current) => ({
									...current,
									key: event.target.value,
								}))
							}
							placeholder="module.action"
							className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>

					<label className="mt-4 block">
						<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
							Label
						</span>
						<input
							required
							value={permissionDraft.label}
							onChange={(event) =>
								setPermissionDraft((current) => ({
									...current,
									label: event.target.value,
								}))
							}
							placeholder="Delete course"
							className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>

					<label className="mt-4 block">
						<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
							Description
						</span>
						<textarea
							value={permissionDraft.description}
							onChange={(event) =>
								setPermissionDraft((current) => ({
									...current,
									description: event.target.value,
								}))
							}
							placeholder="Optional internal note"
							className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>

					<button
						type="submit"
						disabled={isCreatingPermission}
						className="mt-5 flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-[#B7770D] bg-[#fff8ec] px-5 text-sm font-black text-[#8a5604] transition hover:bg-[#B7770D] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
					>
						<Plus className="size-4" />
						{isCreatingPermission ? "Creating permission..." : "Add Permission"}
					</button>
				</form>
			</aside>
		</div>
	);
}
