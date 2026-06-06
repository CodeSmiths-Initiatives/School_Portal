"use client";

import {
	ArrowRight,
	BadgeCheck,
	Building2,
	KeyRound,
	Mail,
	Pencil,
	Phone,
	Plus,
	ShieldCheck,
	UserCog,
	UserRound,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
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

function getActiveCount(colleges: ProvisionedCollege[]) {
	return colleges.filter((college) => college.status === "active").length;
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

export function CollegeProvisioningWorkspace({
	initialColleges,
}: CollegeProvisioningWorkspaceProps) {
	const [colleges, setColleges] = useState(initialColleges);
	const [form, setForm] = useState<ProvisionCollegeInput>(() => createEmptyForm());
	const [editingCollege, setEditingCollege] = useState<ProvisionedCollege | null>(null);
	const [editForm, setEditForm] = useState<UpdateCollegeInput | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [search, setSearch] = useState("");

	const filteredColleges = useMemo(() => {
		const query = search.trim().toLowerCase();

		if (!query) {
			return colleges;
		}

		return colleges.filter((college) =>
			[college.name, college.code, college.slug, college.admin?.email]
				.filter(Boolean)
				.some((value) => String(value).toLowerCase().includes(query)),
		);
	}, [colleges, search]);

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

	function openEditDrawer(college: ProvisionedCollege) {
		setEditingCollege(college);
		setEditForm(createEditForm(college));
	}

	function closeEditDrawer() {
		setEditingCollege(null);
		setEditForm(null);
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
			closeEditDrawer();
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
		const nextStatus = college.status === "active" ? "inactive" : "active";
		const confirmed =
			nextStatus === "active" ||
			window.confirm(
				"This will block all users under this college and hide it from the Apply page.",
			);

		if (!confirmed) {
			return;
		}

		void updateCollege(
			college,
			{ status: nextStatus },
			nextStatus === "active" ? "College reactivated" : "College deactivated",
		);
	}

	function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!editingCollege || !editForm) {
			return;
		}

		void updateCollege(editingCollege, editForm, "College updated");
	}

	return (
		<div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_26rem]">
			<section className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
							College Directory
						</p>
						<h2 className="mt-2 text-2xl font-black text-[#06183A]">
							Provision colleges and admins
						</h2>
						<p className="mt-2 max-w-2xl text-sm leading-7 text-[#556987]">
							Create each college tenant with one primary college admin. The
							admin can sign in immediately, while all applications stay scoped
							to the college slug.
						</p>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] px-4 py-3">
							<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
								Colleges
							</p>
							<p className="mt-2 text-2xl font-black text-[#0D2B55]">
								{colleges.length}
							</p>
						</div>
						<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] px-4 py-3">
							<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
								Active
							</p>
							<p className="mt-2 text-2xl font-black text-[#0D2B55]">
								{getActiveCount(colleges)}
							</p>
						</div>
					</div>
				</div>

				<div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-3">
					<div className="flex items-center gap-3 px-2">
						<div className="flex size-10 items-center justify-center rounded-full bg-[#eef4fb] text-[#2E86C1]">
							<Building2 className="size-5" />
						</div>
						<div>
							<p className="text-sm font-black text-[#0D2B55]">
								Tenant-aware admission directory
							</p>
							<p className="text-xs font-semibold text-[#6b7f9c]">
								New active colleges appear on the public Apply page.
							</p>
						</div>
					</div>
					<input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Search college, code, admin"
						className="h-12 w-full rounded-2xl border border-[#cbd9ec] bg-white px-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1] sm:w-72"
					/>
				</div>

				<div className="mt-5 grid gap-4 lg:grid-cols-2">
					{filteredColleges.map((college) => (
						<article
							key={college.slug}
							className="group rounded-2xl border border-[#dbe5f1] bg-[#fbfdff] p-5 transition hover:-translate-y-0.5 hover:border-[#B7770D]/50 hover:bg-white hover:shadow-[0_18px_34px_rgba(13,43,85,0.1)]"
						>
							<div className="flex items-start justify-between gap-4">
								<div className="flex items-center gap-3">
									<div className="flex size-12 items-center justify-center rounded-2xl bg-[#eef4fb] text-[#0D2B55]">
										<Building2 className="size-5" />
									</div>
									<div>
										<p className="text-lg font-black text-[#06183A]">
											{college.name}
										</p>
										<p className="mt-1 text-xs font-black uppercase tracking-[0.22em] text-[#B7770D]">
											{college.code}
										</p>
									</div>
								</div>
								<span
									className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${
										college.status === "active"
											? "border-[#cfe8d3] bg-[#eefaf0] text-[#0B7A32]"
											: "border-[#f0d49d] bg-[#fff8eb] text-[#B7770D]"
									}`}
								>
									{college.status}
								</span>
							</div>

							<div className="mt-5 rounded-2xl border border-[#e2eaf4] bg-white p-4">
								<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
									Primary Admin
								</p>
								<div className="mt-3 space-y-2 text-sm font-semibold text-[#405879]">
									<p className="flex items-center gap-2">
										<UserRound className="size-4 text-[#2E86C1]" />
										{college.admin?.name || college.admin?.username || "Not assigned"}
									</p>
									<p className="flex items-center gap-2">
										<Mail className="size-4 text-[#2E86C1]" />
										{college.admin?.email || college.contactEmail || "No email"}
									</p>
									<p className="flex items-center gap-2">
										<Phone className="size-4 text-[#2E86C1]" />
										{college.admin?.phone || "Phone pending"}
									</p>
								</div>
							</div>

							<div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-[#6b7f9c]">
								<span>{college.slug}</span>
								<span>Updated {formatDate(college.updatedAt)}</span>
							</div>

							<div className="mt-4 grid gap-2 sm:grid-cols-3">
								<button
									type="button"
									onClick={() => openEditDrawer(college)}
									className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dbe5f1] bg-white px-3 text-xs font-black text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
								>
									<UserCog className="size-4" />
									View Admin
								</button>
								<button
									type="button"
									onClick={() => openEditDrawer(college)}
									className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dbe5f1] bg-white px-3 text-xs font-black text-[#0D2B55] transition hover:border-[#2E86C1] hover:text-[#2E86C1]"
								>
									<Pencil className="size-4" />
									Edit
								</button>
								<button
									type="button"
									disabled={isUpdating}
									onClick={() => handleStatusChange(college)}
									className={`inline-flex h-10 items-center justify-center rounded-xl px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
										college.status === "active"
											? "border border-[#f0d49d] bg-[#fff8eb] text-[#B7770D] hover:bg-[#fff2d7]"
											: "border border-[#cfe8d3] bg-[#effaf1] text-[#0B7A32] hover:bg-[#e2f7e6]"
									}`}
								>
									{college.status === "active" ? "Deactivate" : "Reactivate"}
								</button>
							</div>
						</article>
					))}
				</div>
			</section>

			<aside className="rounded-3xl border border-[#d7e2f0] bg-white p-5 shadow-[0_18px_45px_rgba(13,43,85,0.08)] sm:p-6">
				<div className="rounded-2xl bg-[#0D2B55] p-5 text-white">
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#E4A11B]">
								New Tenant
							</p>
							<h3 className="mt-2 text-xl font-black">Create college</h3>
						</div>
						<div className="flex size-12 items-center justify-center rounded-full border border-[#B7770D] text-[#E4A11B]">
							<Plus className="size-5" />
						</div>
					</div>
					<p className="mt-3 text-sm leading-6 text-[#b8c7dc]">
						One submit creates the college, primary admin account, college
						assignment, and invitation email using the global admin/student
						role templates.
					</p>
				</div>

				<form className="mt-5 space-y-4" onSubmit={handleSubmit}>
					<label className="block">
						<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
							College Name
						</span>
						<input
							required
							value={form.name}
							onChange={(event) => updateField("name", event.target.value)}
							placeholder="e.g. Kwara College of Science"
							className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>

					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
						<label className="block">
							<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
								Code
							</span>
							<input
								required
								value={form.code}
								onChange={(event) => updateField("code", event.target.value)}
								placeholder="KCS"
								className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
							/>
						</label>
						<label className="block">
							<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
								Contact Email
							</span>
							<input
								value={form.contactEmail}
								onChange={(event) =>
									updateField("contactEmail", event.target.value)
								}
								placeholder="office@college.edu.ng"
								className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
							/>
						</label>
					</div>

					<div className="my-2 flex items-center gap-3">
						<div className="h-px flex-1 bg-[#dbe5f1]" />
						<span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#B7770D]">
							College Admin
						</span>
						<div className="h-px flex-1 bg-[#dbe5f1]" />
					</div>

					<label className="block">
						<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
							Admin Name
						</span>
						<input
							required
							value={form.adminName}
							onChange={(event) => updateField("adminName", event.target.value)}
							placeholder="e.g. Dr. Amina Bello"
							className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>

					<label className="block">
						<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
							Username
						</span>
						<input
							required
							value={form.adminUsername}
							onChange={(event) =>
								updateField("adminUsername", event.target.value)
							}
							placeholder="kwara.science.admin"
							className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
						/>
					</label>

					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
						<label className="block">
							<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
								Admin Email
							</span>
							<input
								required
								value={form.adminEmail}
								onChange={(event) => updateField("adminEmail", event.target.value)}
								placeholder="admin@college.edu.ng"
								className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
							/>
						</label>
						<label className="block">
							<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
								Phone
							</span>
							<input
								value={form.adminPhone}
								onChange={(event) => updateField("adminPhone", event.target.value)}
								placeholder="+234..."
								className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
							/>
						</label>
					</div>

					<label className="block">
						<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
							Temporary Password
						</span>
						<div className="mt-2 flex gap-2">
							<input
								required
								readOnly
								value={form.temporaryPassword}
								placeholder="A1b2C@261430!"
								className="h-12 min-w-0 flex-1 rounded-2xl border border-[#cbd9ec] bg-[#eef4fb] px-4 text-sm font-black tracking-[0.06em] text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
							/>
							<button
								type="button"
								onClick={() =>
									updateField("temporaryPassword", createTemporaryPassword())
								}
								className="flex size-12 items-center justify-center rounded-2xl border border-[#cbd9ec] bg-white text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
								aria-label="Generate temporary password"
							>
								<KeyRound className="size-5" />
							</button>
						</div>
					</label>

					<div className="rounded-2xl border border-[#cfe8d3] bg-[#effaf1] p-4 text-sm leading-6 text-[#1f6b35]">
						<div className="flex gap-3">
							<ShieldCheck className="mt-0.5 size-5 shrink-0" />
							<p>
								The temporary password is auto-generated in the required
								RandomAlphaNumeric(5)@YYHHmm! pattern and sent to the admin
								invitation email.
							</p>
						</div>
					</div>

					<button
						type="submit"
						disabled={isSubmitting}
						className="group flex h-13 w-full items-center justify-center gap-3 rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_14px_26px_rgba(13,43,85,0.24)] transition hover:bg-[#123a73] disabled:cursor-not-allowed disabled:opacity-60"
					>
						{isSubmitting ? "Creating college..." : "Create College and Admin"}
						<ArrowRight className="size-4 transition group-hover:translate-x-1" />
					</button>
				</form>
			</aside>

			{editingCollege && editForm ? (
				<div className="fixed inset-0 z-50 flex justify-end bg-[#06183A]/45 backdrop-blur-sm">
					<button
						type="button"
						className="hidden flex-1 cursor-default lg:block"
						aria-label="Close college editor"
						onClick={closeEditDrawer}
					/>
					<aside className="app-scrollbar h-full w-full max-w-xl overflow-y-auto bg-white shadow-[-24px_0_60px_rgba(6,24,58,0.24)]">
						<div className="sticky top-0 z-10 border-b border-[#dbe5f1] bg-white/95 p-5 backdrop-blur">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#B7770D]">
										Edit College
									</p>
									<h3 className="mt-2 text-2xl font-black text-[#06183A]">
										{editingCollege.name}
									</h3>
									<p className="mt-1 text-sm font-semibold text-[#60728f]">
										Code and slug are locked to protect URLs, invoices, payments,
										and admission records.
									</p>
								</div>
								<button
									type="button"
									onClick={closeEditDrawer}
									className="flex size-11 items-center justify-center rounded-full border border-[#dbe5f1] text-[#0D2B55] transition hover:border-[#B7770D] hover:text-[#B7770D]"
									aria-label="Close editor"
								>
									<X className="size-5" />
								</button>
							</div>
						</div>

						<form className="space-y-5 p-5" onSubmit={handleEditSubmit}>
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
									<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
										Locked Code
									</p>
									<p className="mt-2 text-lg font-black text-[#0D2B55]">
										{editingCollege.code}
									</p>
								</div>
								<div className="rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] p-4">
									<p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8395AF]">
										Locked Slug
									</p>
									<p className="mt-2 break-all text-sm font-black text-[#0D2B55]">
										{editingCollege.slug}
									</p>
								</div>
							</div>

							<label className="block">
								<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
									College Name
								</span>
								<input
									required
									value={editForm.name ?? ""}
									onChange={(event) => updateEditField("name", event.target.value)}
									className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
								/>
							</label>

							<div className="grid gap-3 sm:grid-cols-2">
								<label className="block">
									<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
										Contact Email
									</span>
									<input
										value={editForm.contactEmail ?? ""}
										onChange={(event) =>
											updateEditField("contactEmail", event.target.value)
										}
										className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
									/>
								</label>
								<label className="block">
									<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
										Status
									</span>
									<select
										value={editForm.status ?? "active"}
										onChange={(event) =>
											updateEditField(
												"status",
												event.target.value as UpdateCollegeInput["status"],
											)
										}
										className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
									>
										<option value="active">Active</option>
										<option value="inactive">Inactive</option>
										<option value="archived">Archived</option>
									</select>
								</label>
							</div>

							<div className="rounded-2xl border border-[#f0d49d] bg-[#fff8eb] p-4 text-sm font-semibold leading-6 text-[#7a4d04]">
								Admin email and username are editable, but both must remain
								globally unique because portal login accepts either value.
							</div>

							<label className="block">
								<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
									Admin Name
								</span>
								<input
									value={editForm.adminName ?? ""}
									onChange={(event) =>
										updateEditField("adminName", event.target.value)
									}
									className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
								/>
							</label>

							<div className="grid gap-3 sm:grid-cols-2">
								<label className="block">
									<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
										Admin Username
									</span>
									<input
										required
										value={editForm.adminUsername ?? ""}
										onChange={(event) =>
											updateEditField("adminUsername", event.target.value)
										}
										className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
									/>
								</label>
								<label className="block">
									<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
										Admin Email
									</span>
									<input
										required
										value={editForm.adminEmail ?? ""}
										onChange={(event) =>
											updateEditField("adminEmail", event.target.value)
										}
										className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
									/>
								</label>
							</div>

							<label className="block">
								<span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0D2B55]">
									Admin Phone
								</span>
								<input
									value={editForm.adminPhone ?? ""}
									onChange={(event) =>
										updateEditField("adminPhone", event.target.value)
									}
									className="mt-2 h-12 w-full rounded-2xl border border-[#cbd9ec] bg-[#f8fbff] px-4 text-sm font-semibold text-[#0D2B55] outline-none transition focus:border-[#2E86C1]"
								/>
							</label>

							<div className="grid gap-3 sm:grid-cols-[1fr_auto]">
								<button
									type="submit"
									disabled={isUpdating}
									className="flex h-12 items-center justify-center rounded-2xl bg-[#0D2B55] px-5 text-sm font-black text-white shadow-[0_14px_26px_rgba(13,43,85,0.24)] transition hover:bg-[#123a73] disabled:cursor-not-allowed disabled:opacity-60"
								>
									{isUpdating ? "Saving..." : "Save College Changes"}
								</button>
								<button
									type="button"
									disabled={isUpdating}
									onClick={() => handleStatusChange(editingCollege)}
									className="flex h-12 items-center justify-center rounded-2xl border border-[#f0d49d] bg-[#fff8eb] px-5 text-sm font-black text-[#B7770D] transition hover:bg-[#fff2d7] disabled:cursor-not-allowed disabled:opacity-60"
								>
									{editingCollege.status === "active"
										? "Deactivate"
										: "Reactivate"}
								</button>
							</div>
						</form>
					</aside>
				</div>
			) : null}
		</div>
	);
}
