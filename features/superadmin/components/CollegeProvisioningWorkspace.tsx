"use client";

import {
	BadgeCheck,
	Building2,
	CheckCircle2,
	Eye,
	Filter,
	KeyRound,
	Mail,
	Pencil,
	Phone,
	Plus,
	Power,
	Search,
	ShieldCheck,
	UserRound,
	X,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { RowActionMenu } from "@/components/ui/row-action-menu";
import { toast } from "@/lib/toast";
import type {
	ProvisionCollegeInput,
	ProvisionedCollege,
	UpdateCollegeInput,
} from "@/lib/services/superadmin-college.service";
import { createTemporaryPassword } from "@/lib/security/temporary-password";

type CollegeProvisioningWorkspaceProps = {
	initialColleges: ProvisionedCollege[];
};

type CollegeStatusFilter = "all" | ProvisionedCollege["status"];
type CollegeModalMode = "create" | "edit";
type CollegeModalState =
	| { mode: "create"; college?: never }
	| { mode: "edit"; college: ProvisionedCollege };

const PAGE_SIZE = 10;
const STATUS_FILTERS: Array<{ label: string; value: CollegeStatusFilter }> = [
	{ label: "All status", value: "all" },
	{ label: "Active", value: "active" },
	{ label: "Inactive", value: "inactive" },
	{ label: "Archived", value: "archived" },
];

function createEmptyForm(): ProvisionCollegeInput {
	return {
		name: "",
		code: "",
		contactEmail: "",
		adminName: "",
		adminUsername: "",
		adminEmail: "",
		adminPhone: "",
		temporaryPassword: createTemporaryPassword(),
	};
}

function createEditForm(college: ProvisionedCollege): UpdateCollegeInput {
	return {
		name: college.name,
		contactEmail: college.contactEmail ?? college.admin?.email ?? "",
		adminName: college.admin?.name ?? "",
		adminUsername: college.admin?.username ?? "",
		adminEmail: college.admin?.email ?? "",
		adminPhone: college.admin?.phone ?? "",
		status: college.status,
	};
}

function formatDate(value?: string) {
	if (!value) {
		return "Recently";
	}

	return new Intl.DateTimeFormat("en-NG", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(new Date(value));
}

function statusPill(status: ProvisionedCollege["status"]) {
	const tone =
		status === "active"
			? "border-emerald-200 bg-emerald-50 text-emerald-700"
			: status === "inactive"
				? "border-amber-200 bg-amber-50 text-amber-700"
				: "border-slate-200 bg-slate-50 text-slate-700";

	return `rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${tone}`;
}

function getAdminName(college: ProvisionedCollege) {
	return college.admin?.name || college.admin?.username || "Not assigned";
}

function getAdminEmail(college: ProvisionedCollege) {
	return college.admin?.email || college.contactEmail || "No email";
}

function getNextStatus(college: ProvisionedCollege): ProvisionedCollege["status"] {
	return college.status === "active" ? "inactive" : "active";
}

function ModalShell({
	children,
	onClose,
	title,
	eyebrow,
	description,
}: {
	children: React.ReactNode;
	onClose: () => void;
	title: string;
	eyebrow: string;
	description: string;
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06172f]/60 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-[#dbe5f1] bg-white shadow-[0_30px_80px_rgba(6,23,47,0.35)]">
				<div className="flex items-start justify-between gap-4 border-b border-[#dbe5f1] bg-[#0D2B55] px-5 py-5 text-white sm:px-6">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E4A11B]">
							{eyebrow}
						</p>
						<h2 className="mt-2 text-xl font-black sm:text-2xl">{title}</h2>
						<p className="mt-1 text-sm font-semibold text-[#c5d4e8]">
							{description}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#0D2B55]"
						aria-label="Close college modal"
					>
						<X className="size-5" />
					</button>
				</div>
				<div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-5 sm:p-6">
					{children}
				</div>
			</div>
		</div>
	);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<label className="block">
			<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
				{label}
			</span>
			<div className="mt-2">{children}</div>
		</label>
	);
}

function CollegeFormModal({
	mode,
	form,
	editForm,
	college,
	isSubmitting,
	isUpdating,
	onClose,
	onCreateChange,
	onEditChange,
	onCreate,
	onEdit,
	onRegeneratePassword,
}: {
	mode: CollegeModalMode;
	form: ProvisionCollegeInput;
	editForm: UpdateCollegeInput | null;
	college?: ProvisionedCollege;
	isSubmitting: boolean;
	isUpdating: boolean;
	onClose: () => void;
	onCreateChange: <Key extends keyof ProvisionCollegeInput>(
		key: Key,
		value: ProvisionCollegeInput[Key],
	) => void;
	onEditChange: <Key extends keyof UpdateCollegeInput>(
		key: Key,
		value: UpdateCollegeInput[Key],
	) => void;
	onCreate: (event: React.FormEvent<HTMLFormElement>) => void;
	onEdit: (event: React.FormEvent<HTMLFormElement>) => void;
	onRegeneratePassword: () => void;
}) {
	const isCreate = mode === "create";
	const inputClass =
		"h-12 w-full rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]";

	if (!isCreate && !editForm) {
		return null;
	}

	return (
		<ModalShell
			onClose={onClose}
			eyebrow={isCreate ? "New Tenant" : "Edit College"}
			title={isCreate ? "Create college" : college?.name ?? "Edit college"}
			description={
				isCreate
					? "Create the college tenant and primary college admin account."
					: "Update college profile, primary admin details, and access status."
			}
		>
			<form
				className="space-y-5"
				onSubmit={isCreate ? onCreate : onEdit}
			>
				{!isCreate && college ? (
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
							<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
								Locked Code
							</p>
							<p className="mt-2 text-lg font-black text-[#0D2B55]">
								{college.code}
							</p>
						</div>
						<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
							<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
								Locked Slug
							</p>
							<p className="mt-2 break-all text-sm font-black text-[#0D2B55]">
								{college.slug}
							</p>
						</div>
					</div>
				) : null}

				<div className="grid gap-4 md:grid-cols-2">
					<Field label="College Name">
						<input
							required
							value={isCreate ? form.name : editForm?.name ?? ""}
							onChange={(event) =>
								isCreate
									? onCreateChange("name", event.target.value)
									: onEditChange("name", event.target.value)
							}
							placeholder="e.g. Kwara College of Science"
							className={inputClass}
						/>
					</Field>
					{isCreate ? (
						<Field label="Code">
							<input
								required
								value={form.code}
								onChange={(event) => onCreateChange("code", event.target.value)}
								placeholder="KCS"
								className={inputClass}
							/>
						</Field>
					) : (
						<Field label="Status">
							<select
								value={editForm?.status ?? "active"}
								onChange={(event) =>
									onEditChange(
										"status",
										event.target.value as UpdateCollegeInput["status"],
									)
								}
								className={inputClass}
							>
								<option value="active">Active</option>
								<option value="inactive">Inactive</option>
								<option value="archived">Archived</option>
							</select>
						</Field>
					)}
					<Field label="Contact Email">
						<input
							value={isCreate ? form.contactEmail : editForm?.contactEmail ?? ""}
							onChange={(event) =>
								isCreate
									? onCreateChange("contactEmail", event.target.value)
									: onEditChange("contactEmail", event.target.value)
							}
							placeholder="office@college.edu.ng"
							className={inputClass}
						/>
					</Field>
					<Field label="Admin Name">
						<input
							required
							value={isCreate ? form.adminName : editForm?.adminName ?? ""}
							onChange={(event) =>
								isCreate
									? onCreateChange("adminName", event.target.value)
									: onEditChange("adminName", event.target.value)
							}
							placeholder="e.g. Dr. Amina Bello"
							className={inputClass}
						/>
					</Field>
					<Field label="Admin Username">
						<input
							required
							value={isCreate ? form.adminUsername : editForm?.adminUsername ?? ""}
							onChange={(event) =>
								isCreate
									? onCreateChange("adminUsername", event.target.value)
									: onEditChange("adminUsername", event.target.value)
							}
							placeholder="kwara.science.admin"
							className={inputClass}
						/>
					</Field>
					<Field label="Admin Email">
						<input
							required
							value={isCreate ? form.adminEmail : editForm?.adminEmail ?? ""}
							onChange={(event) =>
								isCreate
									? onCreateChange("adminEmail", event.target.value)
									: onEditChange("adminEmail", event.target.value)
							}
							placeholder="admin@college.edu.ng"
							className={inputClass}
						/>
					</Field>
					<Field label="Admin Phone">
						<input
							value={isCreate ? form.adminPhone : editForm?.adminPhone ?? ""}
							onChange={(event) =>
								isCreate
									? onCreateChange("adminPhone", event.target.value)
									: onEditChange("adminPhone", event.target.value)
							}
							placeholder="+234..."
							className={inputClass}
						/>
					</Field>
					{isCreate ? (
						<Field label="Temporary Password">
							<div className="flex gap-2">
								<input
									required
									readOnly
									value={form.temporaryPassword}
									className="h-12 min-w-0 flex-1 rounded-2xl border border-[#cbd9ec] bg-[#eef4fb] px-4 text-sm font-black tracking-[0.06em] text-[#0D2B55] outline-none"
								/>
								<button
									type="button"
									onClick={onRegeneratePassword}
									className="flex size-12 items-center justify-center rounded-2xl border border-[#cbd9ec] bg-white text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
									aria-label="Generate temporary password"
								>
									<KeyRound className="size-5" />
								</button>
							</div>
						</Field>
					) : null}
				</div>

				<div className="rounded-2xl border border-[#cfe8d3] bg-[#effaf1] p-4 text-sm leading-6 text-[#1f6b35]">
					<div className="flex gap-3">
						<ShieldCheck className="mt-0.5 size-5 shrink-0" />
						<p>
							{isCreate
								? "The admin invitation uses the generated temporary password and global college admin role template."
								: "Code and slug stay locked so college URLs, admission records, invoices, and tenant links remain stable."}
						</p>
					</div>
				</div>

				<div className="flex flex-col-reverse gap-3 border-t border-[#dbe5f1] pt-5 sm:flex-row sm:justify-end">
					<button
						type="button"
						onClick={onClose}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-white px-5 text-sm font-black text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isSubmitting || isUpdating}
						className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866] disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isCreate
							? isSubmitting
								? "Creating college..."
								: "Create College"
							: isUpdating
								? "Saving..."
								: "Save Changes"}
					</button>
				</div>
			</form>
		</ModalShell>
	);
}

function CollegeViewModal({
	college,
	onClose,
	onEdit,
}: {
	college: ProvisionedCollege | null;
	onClose: () => void;
	onEdit: (college: ProvisionedCollege) => void;
}) {
	if (!college) {
		return null;
	}

	const rows = [
		["College Code", college.code],
		["Slug", college.slug],
		["Status", college.status],
		["Primary Admin", getAdminName(college)],
		["Admin Email", getAdminEmail(college)],
		["Admin Phone", college.admin?.phone || "Phone pending"],
		["Contact Email", college.contactEmail || "No contact email"],
		["Updated", formatDate(college.updatedAt)],
	];

	return (
		<ModalShell
			onClose={onClose}
			eyebrow="College Details"
			title={college.name}
			description="Review tenant identity, primary admin, and access state."
		>
			<div className="flex flex-wrap gap-2">
				<span className={statusPill(college.status)}>{college.status}</span>
				<span className="rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#0D2B55]">
					{college.code}
				</span>
			</div>
			<div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{rows.map(([label, value]) => (
					<div
						key={label}
						className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4"
					>
						<p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
							{label}
						</p>
						<p className="mt-1 break-words text-sm font-black text-[#0D2B55]">
							{value}
						</p>
					</div>
				))}
			</div>
			<div className="mt-5 flex flex-col-reverse gap-3 border-t border-[#dbe5f1] pt-5 sm:flex-row sm:justify-end">
				<button
					type="button"
					onClick={onClose}
					className="h-12 rounded-2xl border border-[#d3dfed] bg-white px-5 text-sm font-black text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
				>
					Close
				</button>
				<button
					type="button"
					onClick={() => onEdit(college)}
					className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866]"
				>
					<Pencil className="size-4" />
					Edit College
				</button>
			</div>
		</ModalShell>
	);
}

function CollegeRowActions({
	college,
	open,
	isUpdating,
	onToggle,
	onView,
	onEdit,
	onStatusChange,
}: {
	college: ProvisionedCollege;
	open: boolean;
	isUpdating: boolean;
	onToggle: () => void;
	onView: () => void;
	onEdit: () => void;
	onStatusChange: () => void;
}) {
	const isActive = college.status === "active";

	return (
		<RowActionMenu
			label={`Open actions for ${college.name}`}
			open={open}
			onOpenChange={(nextOpen) => {
				if (nextOpen !== open) {
					onToggle();
				}
			}}
			items={[
				{
					label: "View",
					icon: <Eye className="size-4" />,
					onSelect: onView,
				},
				{
					label: "Edit",
					icon: <Pencil className="size-4" />,
					onSelect: onEdit,
				},
				{
					label: isActive ? "Deactivate" : "Activate",
					icon: isActive ? (
						<XCircle className="size-4" />
					) : (
						<CheckCircle2 className="size-4" />
					),
					onSelect: onStatusChange,
					disabled: isUpdating,
					className: isActive
						? "text-[#c54848] hover:bg-red-50"
						: "text-emerald-700 hover:bg-emerald-50",
				},
			]}
		/>
	);
}

export function CollegeProvisioningWorkspace({
	initialColleges,
}: CollegeProvisioningWorkspaceProps) {
	const [colleges, setColleges] = useState(initialColleges);
	const [form, setForm] = useState<ProvisionCollegeInput>(() => createEmptyForm());
	const [editForm, setEditForm] = useState<UpdateCollegeInput | null>(null);
	const [modalState, setModalState] = useState<CollegeModalState | null>(null);
	const [viewCollege, setViewCollege] = useState<ProvisionedCollege | null>(null);
	const [openActionsId, setOpenActionsId] = useState<string | number | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<CollegeStatusFilter>("all");
	const [currentPage, setCurrentPage] = useState(1);

	const analytics = useMemo(
		() => [
			{
				label: "Total Colleges",
				value: colleges.length,
				note: "Provisioned tenants",
				icon: Building2,
			},
			{
				label: "Active",
				value: colleges.filter((college) => college.status === "active").length,
				note: "Visible on Apply page",
				icon: BadgeCheck,
			},
			{
				label: "Inactive",
				value: colleges.filter((college) => college.status === "inactive").length,
				note: "Access currently blocked",
				icon: Power,
			},
			{
				label: "Admins",
				value: colleges.filter((college) => college.admin?.email).length,
				note: "Primary admin accounts",
				icon: UserRound,
			},
		],
		[colleges],
	);

	const filteredColleges = useMemo(() => {
		const query = search.trim().toLowerCase();

		return colleges.filter((college) => {
			const queryMatch =
				!query ||
				[
					college.name,
					college.code,
					college.slug,
					college.contactEmail,
					college.admin?.name,
					college.admin?.username,
					college.admin?.email,
				]
					.filter(Boolean)
					.some((value) => String(value).toLowerCase().includes(query));
			const statusMatch =
				statusFilter === "all" || college.status === statusFilter;

			return queryMatch && statusMatch;
		});
	}, [colleges, search, statusFilter]);

	const pageCount = Math.max(1, Math.ceil(filteredColleges.length / PAGE_SIZE));
	const safePage = Math.min(currentPage, pageCount);
	const paginatedColleges = filteredColleges.slice(
		(safePage - 1) * PAGE_SIZE,
		safePage * PAGE_SIZE,
	);

	function updateFilter<T>(setter: (value: T) => void, value: T) {
		setter(value);
		setCurrentPage(1);
	}

	function clearFilters() {
		setSearch("");
		setStatusFilter("all");
		setCurrentPage(1);
	}

	function closeActions() {
		setOpenActionsId(null);
	}

	function openCreateModal() {
		setForm(createEmptyForm());
		setEditForm(null);
		setModalState({ mode: "create" });
	}

	function openEditModal(college: ProvisionedCollege) {
		setEditForm(createEditForm(college));
		setModalState({ mode: "edit", college });
		setViewCollege(null);
		closeActions();
	}

	function closeModal() {
		setModalState(null);
		setEditForm(null);
	}

	function updateField<Key extends keyof ProvisionCollegeInput>(
		key: Key,
		value: ProvisionCollegeInput[Key],
	) {
		setForm((current) => ({
			...current,
			[key]: value,
		}));
	}

	function updateEditField<Key extends keyof UpdateCollegeInput>(
		key: Key,
		value: UpdateCollegeInput[Key],
	) {
		setEditForm((current) =>
			current
				? {
						...current,
						[key]: value,
					}
				: current,
		);
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsSubmitting(true);

		try {
			const response = await fetch("/api/superadmin/colleges", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(form),
			});
			const payload = (await response.json().catch(() => null)) as
				| { college?: ProvisionedCollege; emailSent?: boolean; error?: string }
				| null;

			if (!response.ok || !payload?.college) {
				throw new Error(payload?.error ?? "Unable to create college.");
			}

			setColleges((current) => [payload.college!, ...current]);
			setForm(createEmptyForm());
			closeModal();
			toast.success({
				title: "College created",
				description: payload.emailSent
					? "Admin account created and invitation email sent."
					: "Admin account created. Email delivery can be retried after SMTP is configured.",
			});
		} catch (error) {
			toast.error({
				title: "College creation failed",
				description:
					error instanceof Error
						? error.message
						: "Please check the college and admin details.",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	async function updateCollege(
		college: ProvisionedCollege,
		payload: UpdateCollegeInput,
		successTitle: string,
	) {
		setIsUpdating(true);

		try {
			const response = await fetch(`/api/superadmin/colleges/${college.id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});
			const result = (await response.json().catch(() => null)) as
				| { college?: ProvisionedCollege; error?: string }
				| null;

			if (!response.ok || !result?.college) {
				throw new Error(result?.error ?? "Unable to update college.");
			}

			setColleges((current) =>
				current.map((item) =>
					String(item.id) === String(result.college!.id) ? result.college! : item,
				),
			);
			toast.success({
				title: successTitle,
				description:
					result.college.status === "active"
						? "College access is active and visible on the Apply page."
						: "College access is blocked and hidden from the Apply page.",
			});
			closeModal();
		} catch (error) {
			toast.error({
				title: "College update failed",
				description:
					error instanceof Error
						? error.message
						: "Please check the college and admin details.",
			});
		} finally {
			setIsUpdating(false);
		}
	}

	function handleStatusChange(college: ProvisionedCollege) {
		const nextStatus = getNextStatus(college);
		closeActions();
		void updateCollege(
			college,
			{ status: nextStatus },
			nextStatus === "active" ? "College activated" : "College deactivated",
		);
	}

	function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!modalState || modalState.mode !== "edit" || !editForm) {
			return;
		}

		void updateCollege(modalState.college, editForm, "College updated");
	}

	return (
		<section className="space-y-5">
			<div className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							College Directory
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							College tenant setup
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-7 text-[#556987]">
							Provision college tenants, manage primary admins, and control
							whether each college is active on the admission entry path.
						</p>
					</div>
					<button
						type="button"
						onClick={openCreateModal}
						className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(13,43,85,0.18)] transition hover:-translate-y-0.5 hover:bg-[#123866]"
					>
						<Plus className="size-4" />
						Create College
					</button>
				</div>

				<div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{analytics.map((item) => {
						const Icon = item.icon;

						return (
							<div
								key={item.label}
								className="group rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4 transition duration-300 hover:-translate-y-1 hover:border-[#b9c9dc] hover:bg-white hover:shadow-[0_18px_35px_rgba(13,43,85,0.08)]"
							>
								<div className="flex items-center justify-between gap-3">
									<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
										{item.label}
									</p>
									<span className="flex size-10 items-center justify-center rounded-2xl bg-white text-[#0D2B55] shadow-sm transition group-hover:bg-[#0D2B55] group-hover:text-white">
										<Icon className="size-4" />
									</span>
								</div>
								<p className="mt-3 text-3xl font-black text-[#0D2B55]">
									{item.value}
								</p>
								<p className="mt-1 text-sm font-semibold text-[#60728f]">
									{item.note}
								</p>
							</div>
						);
					})}
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
						className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#d3dfed] bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
					>
						Reset filters
					</button>
				</div>

				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
					<label className="relative xl:col-span-3">
						<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8faa]" />
						<input
							value={search}
							onChange={(event) => updateFilter(setSearch, event.target.value)}
							placeholder="Search college, code, slug, admin"
							className="h-12 w-full rounded-2xl border border-[#d3dfed] bg-[#f8fbff] pl-11 pr-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>
					<select
						value={statusFilter}
						onChange={(event) =>
							updateFilter(
								setStatusFilter,
								event.target.value as CollegeStatusFilter,
							)
						}
						className="h-12 rounded-2xl border border-[#d3dfed] bg-[#f8fbff] px-4 text-sm font-bold text-[#0D2B55] outline-none focus:border-[#2E86C1]"
					>
						{STATUS_FILTERS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="overflow-hidden rounded-3xl border border-[#d7e2f0] bg-white shadow-[0_18px_45px_rgba(13,43,85,0.08)]">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe5f1] px-4 py-4 sm:px-5">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
							College Table
						</p>
						<p className="mt-1 text-sm font-semibold text-[#60728f]">
							Showing {paginatedColleges.length} of {filteredColleges.length} colleges
						</p>
					</div>
					<div className="flex items-center gap-2 rounded-full border border-[#dbe5f1] bg-[#f8fbff] px-4 py-2 text-xs font-black text-[#0D2B55]">
						Page {safePage} of {pageCount}
					</div>
				</div>

				{filteredColleges.length === 0 ? (
					<div className="p-8 text-center">
						<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eef4fb] text-[#2E86C1]">
							<Building2 className="size-6" />
						</div>
						<h3 className="mt-4 text-lg font-black text-[#06183A]">
							No colleges found
						</h3>
						<p className="mt-2 text-sm text-[#60728f]">
							Adjust the filters or create a new college tenant.
						</p>
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className="min-w-[1080px] w-full border-collapse text-left">
								<thead className="bg-[#f8fbff]">
									<tr className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8395AF]">
										<th className="px-5 py-4">College</th>
										<th className="px-5 py-4">Code / Slug</th>
										<th className="px-5 py-4">Primary Admin</th>
										<th className="px-5 py-4">Contact</th>
										<th className="px-5 py-4">Status</th>
										<th className="px-5 py-4">Updated</th>
										<th className="px-5 py-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[#dbe5f1]">
									{paginatedColleges.map((college) => (
										<tr
											key={college.id}
											className="bg-white transition hover:bg-[#f8fbff]"
										>
											<td className="px-5 py-4">
												<p className="font-black text-[#06183A]">{college.name}</p>
												<p className="mt-1 text-sm font-semibold text-[#60728f]">
													Tenant ID: {college.id}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-black text-[#0D2B55]">
													{college.code}
												</p>
												<p className="mt-1 max-w-[14rem] break-words text-xs font-bold text-[#60728f]">
													{college.slug}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-black text-[#0D2B55]">
													{getAdminName(college)}
												</p>
												<p className="mt-1 text-xs font-bold text-[#60728f]">
													{college.admin?.username || "Username pending"}
												</p>
											</td>
											<td className="px-5 py-4">
												<p className="flex items-center gap-2 text-sm font-bold text-[#60728f]">
													<Mail className="size-4 text-[#2E86C1]" />
													{getAdminEmail(college)}
												</p>
												<p className="mt-1 flex items-center gap-2 text-xs font-bold text-[#60728f]">
													<Phone className="size-4 text-[#2E86C1]" />
													{college.admin?.phone || "Phone pending"}
												</p>
											</td>
											<td className="px-5 py-4">
												<span className={statusPill(college.status)}>
													{college.status}
												</span>
											</td>
											<td className="px-5 py-4">
												<p className="text-sm font-bold text-[#60728f]">
													{formatDate(college.updatedAt)}
												</p>
											</td>
											<td className="px-5 py-4">
												<CollegeRowActions
													college={college}
													open={openActionsId === college.id}
													isUpdating={isUpdating}
													onToggle={() =>
														setOpenActionsId((current) =>
															current === college.id ? null : college.id,
														)
													}
													onView={() => {
														setViewCollege(college);
														closeActions();
													}}
													onEdit={() => openEditModal(college)}
													onStatusChange={() => handleStatusChange(college)}
												/>
											</td>
										</tr>
									))}
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

			{modalState ? (
				<CollegeFormModal
					mode={modalState.mode}
					form={form}
					editForm={editForm}
					college={modalState.mode === "edit" ? modalState.college : undefined}
					isSubmitting={isSubmitting}
					isUpdating={isUpdating}
					onClose={closeModal}
					onCreateChange={updateField}
					onEditChange={updateEditField}
					onCreate={handleSubmit}
					onEdit={handleEditSubmit}
					onRegeneratePassword={() =>
						updateField("temporaryPassword", createTemporaryPassword())
					}
				/>
			) : null}
			<CollegeViewModal
				college={viewCollege}
				onClose={() => setViewCollege(null)}
				onEdit={openEditModal}
			/>
		</section>
	);
}
