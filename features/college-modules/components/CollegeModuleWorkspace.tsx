import {
	ArrowRight,
	BadgeCheck,
	BookOpenCheck,
	Building2,
	CircleDollarSign,
	ClipboardCheck,
	LockKeyhole,
} from "lucide-react";
import type { CollegeModuleConfig } from "@/features/college-modules/config/collegeModuleConfig";
import CourseModuleWorkspace from "@/features/college-modules/components/CourseModuleWorkspace";
import HostelModuleWorkspace from "@/features/college-modules/components/HostelModuleWorkspace";
import PaymentModuleWorkspace from "@/features/college-modules/components/PaymentModuleWorkspace";
import StudentCourseWorkspace from "@/features/college-modules/components/StudentCourseWorkspace";
import { hasPermissions, type UserPermissionKey } from "@/lib/rbac";
import type { DashboardDomain } from "@/lib/auth";
import { getStudentCourseData } from "@/lib/services/student-course.service";

type CollegeModuleWorkspaceProps = {
	module: CollegeModuleConfig;
	permissions: UserPermissionKey[];
	collegeName: string;
	collegeSlug: string;
	domain: DashboardDomain;
};

const MODULE_ICONS = {
	BookOpenCheck,
	ClipboardCheck,
	Building2,
	CircleDollarSign,
};

export default async function CollegeModuleWorkspace({
	module,
	permissions,
	collegeName,
	collegeSlug,
	domain,
}: CollegeModuleWorkspaceProps) {
	const Icon = MODULE_ICONS[module.icon];
	const canView = hasPermissions(permissions, module.requiredPermissions);
	const visibleActions = module.actions.filter((action) =>
		hasPermissions(permissions, action.requiredPermissions),
	);

	if (!canView) {
		return (
			<div className="rounded-2xl border border-[#f4c7c7] bg-white p-6 shadow-sm">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#b45309]">
							Access Restricted
						</p>
						<h2 className="mt-2 text-xl font-bold text-[#0D2B55]">
							{module.title}
						</h2>
						<p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#60728f]">
							Your current role does not include the permission required to view
							this college module.
						</p>
					</div>
					<div className="flex size-12 items-center justify-center rounded-2xl bg-[#fff2f2] text-[#b42318]">
						<LockKeyhole className="size-5" />
					</div>
				</div>
			</div>
		);
	}

	if (module.key === "hostel") {
		return (
			<HostelModuleWorkspace
				permissions={permissions}
				collegeName={collegeName}
			/>
		);
	}

	if (module.key === "courses") {
		if (domain === "student") {
			const data = await getStudentCourseData(collegeSlug);

			return (
				<StudentCourseWorkspace
					data={data}
					collegeName={collegeName}
				/>
			);
		}

		return (
			<CourseModuleWorkspace
				permissions={permissions}
				collegeName={collegeName}
				collegeSlug={collegeSlug}
			/>
		);
	}

	if (module.key === "payments") {
		return (
			<PaymentModuleWorkspace
				permissions={permissions}
				collegeName={collegeName}
				collegeSlug={collegeSlug}
			/>
		);
	}

	return (
		<div className="space-y-5">
			<div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
							{module.badge}
						</p>
						<h2 className="mt-2 text-xl font-bold text-[#0D2B55]">
							{module.title}
						</h2>
						<p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#60728f]">
							{module.description}
						</p>
					</div>
					<div className="flex items-center gap-3 rounded-2xl border border-[#dbe5f1] bg-[#f8fbff] px-4 py-3">
						<div className="flex size-11 items-center justify-center rounded-xl bg-[#eef4fb] text-[#2E86C1]">
							<Icon className="size-5" />
						</div>
						<div>
							<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8495af]">
								College
							</p>
							<p className="mt-1 text-sm font-bold text-[#0D2B55]">
								{collegeName}
							</p>
						</div>
					</div>
				</div>

				<div className="mt-5 grid gap-3 md:grid-cols-3">
					{module.metrics.map((metric) => (
						<div
							key={metric.label}
							className="rounded-2xl border border-[#e3eaf4] bg-[#fbfdff] p-4"
						>
							<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8395AF]">
								{metric.label}
							</p>
							<p className="mt-2 text-2xl font-bold text-[#0D2B55]">
								{metric.value}
							</p>
							<p className="mt-1 text-sm text-[#60728f]">
								{metric.description}
							</p>
						</div>
					))}
				</div>
			</div>

			<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
				<div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
					<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
						Shared Module Areas
					</p>
					<div className="mt-4 grid gap-3 md:grid-cols-2">
						{module.panels.map((panel) => (
							<div
								key={panel.title}
								className="rounded-2xl border border-[#e3eaf4] bg-[#fbfdff] p-4"
							>
								<div className="flex items-center justify-between gap-3">
									<h3 className="text-sm font-bold text-[#17305f]">
										{panel.title}
									</h3>
									<ArrowRight className="size-4 text-[#B7770D]" />
								</div>
								<p className="mt-2 text-sm leading-relaxed text-[#60728f]">
									{panel.description}
								</p>
							</div>
						))}
					</div>
				</div>

				<div className="rounded-2xl border border-[#dbe5f1] bg-white p-5 shadow-sm">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B7770D]">
								Role Actions
							</p>
							<p className="mt-2 text-sm text-[#60728f]">
								Only actions allowed by the current role appear here.
							</p>
						</div>
						<div className="flex size-10 items-center justify-center rounded-full bg-[#eef8f1] text-[#16803c]">
							<BadgeCheck className="size-4.5" />
						</div>
					</div>

					<div className="mt-4 space-y-3">
						{visibleActions.length > 0 ? (
							visibleActions.map((action) => (
								<div
									key={action.label}
									className="rounded-xl border border-[#e3eaf4] bg-[#fbfdff] px-4 py-3"
								>
									<p className="text-sm font-bold text-[#17305f]">
										{action.label}
									</p>
									<p className="mt-1 text-sm leading-relaxed text-[#60728f]">
										{action.description}
									</p>
								</div>
							))
						) : (
							<div className="rounded-xl border border-dashed border-[#d6e0ee] bg-[#fbfdff] px-4 py-3">
								<p className="text-sm font-bold text-[#17305f]">
									View-only access
								</p>
								<p className="mt-1 text-sm leading-relaxed text-[#60728f]">
									This role can review the module but does not currently have
									write, approval, upload, print, or allocation permissions.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
