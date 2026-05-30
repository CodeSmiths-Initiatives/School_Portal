type StrapiLike = {
	db: {
		query: (uid: string) => {
			findOne: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
			create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
			update: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
		};
	};
	log: {
		info: (message: string) => void;
	};
};

type PermissionSeed = {
	key: string;
	module: string;
	action: string;
	label: string;
	description?: string;
};

type MenuSeed = {
	key: string;
	label: string;
	href: string;
	icon: string;
	order: number;
	domains: string[];
	requiredPermissions: string[];
};

type CollegeSeed = {
	name: string;
	slug: string;
	code: string;
	contactEmail: string;
	metadata: Record<string, unknown>;
	faculties: Array<{
		name: string;
		slug: string;
		code: string;
		departments: Array<{
			name: string;
			slug: string;
			code: string;
			courses: Array<{
				title: string;
				code: string;
				level: number;
				semester: "first" | "second" | "summer";
				creditUnits: number;
			}>;
		}>;
	}>;
};

type RoleSeed = {
	name: string;
	code: string;
	description: string;
	roleType: "system" | "custom";
	tenantScope: "platform" | "college";
	scopeType: "platform" | "college" | "faculty" | "department" | "course" | "self";
	collegeCode?: string;
	permissions: string[];
};

const permissions: PermissionSeed[] = [
	["dashboard", "view", "View dashboard"],
	["colleges", "view", "View colleges"],
	["colleges", "create", "Create college"],
	["colleges", "update", "Update college"],
	["colleges", "delete", "Delete college"],
	["faculties", "view", "View faculties"],
	["faculties", "create", "Create faculty"],
	["faculties", "update", "Update faculty"],
	["faculties", "delete", "Delete faculty"],
	["departments", "view", "View departments"],
	["departments", "create", "Create department"],
	["departments", "update", "Update department"],
	["departments", "delete", "Delete department"],
	["staff", "view", "View staff"],
	["staff", "create", "Create staff"],
	["staff", "update", "Update staff"],
	["staff", "delete", "Delete staff"],
	["staff", "assign_role", "Assign staff role"],
	["students", "view", "View students"],
	["students", "create", "Create student"],
	["students", "update", "Update student"],
	["students", "delete", "Delete student"],
	["students", "export", "Export students"],
	["admissions", "view", "View admissions"],
	["admissions", "create", "Create application"],
	["admissions", "update", "Update admission"],
	["admissions", "approve", "Approve admission"],
	["admissions", "reject", "Reject admission"],
	["courses", "view", "View courses"],
	["courses", "create", "Create course"],
	["courses", "update", "Update course"],
	["courses", "delete", "Delete course"],
	["courses", "assign_staff", "Assign course staff"],
	["courses", "register", "Register course"],
	["results", "view", "View results"],
	["results", "create", "Create result"],
	["results", "upload", "Upload result"],
	["results", "approve", "Approve result"],
	["results", "reject", "Reject result"],
	["results", "print", "Print result"],
	["payments", "view", "View payments"],
	["payments", "create", "Create payment"],
	["payments", "verify", "Verify payment"],
	["payments", "refund", "Refund payment"],
	["payments", "export", "Export payments"],
	["payments", "print", "Print receipt"],
	["notices", "view", "View notices"],
	["notices", "create", "Create notice"],
	["notices", "update", "Update notice"],
	["notices", "delete", "Delete notice"],
	["notices", "publish", "Publish notice"],
	["reports", "view", "View reports"],
	["reports", "export", "Export reports"],
	["reports", "print", "Print reports"],
	["roles", "view", "View roles"],
	["roles", "create", "Create role"],
	["roles", "update", "Update role"],
	["roles", "delete", "Delete role"],
	["roles", "assign_permissions", "Assign permissions"],
	["audit", "view", "View audit logs"],
	["settings", "view", "View settings"],
	["settings", "update", "Update settings"],
].map(([module, action, label]) => ({
	key: `${module}.${action}`,
	module,
	action,
	label,
}));

const menuItems: MenuSeed[] = [
	{ key: "dashboard", label: "Overview", href: "/dashboard", icon: "LayoutDashboard", order: 10, domains: ["student", "staff", "admin", "superadmin"], requiredPermissions: ["dashboard.view"] },
	{ key: "colleges", label: "Colleges", href: "/platform/colleges", icon: "Building2", order: 20, domains: ["superadmin"], requiredPermissions: ["colleges.view"] },
	{ key: "faculties", label: "Faculties", href: "/faculties", icon: "Network", order: 30, domains: ["admin"], requiredPermissions: ["faculties.view"] },
	{ key: "departments", label: "Departments", href: "/departments", icon: "FolderKanban", order: 40, domains: ["admin"], requiredPermissions: ["departments.view"] },
	{ key: "students", label: "Students", href: "/students", icon: "Users", order: 50, domains: ["staff", "admin"], requiredPermissions: ["students.view"] },
	{ key: "staff", label: "Staff", href: "/staff", icon: "Users", order: 60, domains: ["admin", "superadmin"], requiredPermissions: ["staff.view"] },
	{ key: "admissions", label: "Admissions", href: "/admissions", icon: "FolderKanban", order: 70, domains: ["student", "staff", "admin"], requiredPermissions: ["admissions.view"] },
	{ key: "courses", label: "Courses", href: "/modules/courses", icon: "BookOpen", order: 80, domains: ["student", "staff", "admin"], requiredPermissions: ["courses.view"] },
	{ key: "results", label: "Results", href: "/results", icon: "BadgeCheck", order: 90, domains: ["student", "staff"], requiredPermissions: ["results.view"] },
	{ key: "payments", label: "Payments", href: "/payments", icon: "CircleDollarSign", order: 100, domains: ["student", "admin"], requiredPermissions: ["payments.view"] },
	{ key: "notices", label: "Notices", href: "/notices", icon: "Bell", order: 110, domains: ["student", "staff", "admin"], requiredPermissions: ["notices.view"] },
	{ key: "reports", label: "Reports", href: "/reports", icon: "BarChart3", order: 120, domains: ["staff", "admin", "superadmin"], requiredPermissions: ["reports.view"] },
	{ key: "roles", label: "Roles", href: "/roles", icon: "ShieldCheck", order: 130, domains: ["admin", "superadmin"], requiredPermissions: ["roles.view"] },
	{ key: "audit", label: "Audit", href: "/audit", icon: "FileBarChart2", order: 140, domains: ["superadmin"], requiredPermissions: ["audit.view"] },
	{ key: "settings", label: "Settings", href: "/settings", icon: "Settings", order: 150, domains: ["admin", "superadmin"], requiredPermissions: ["settings.view"] },
];

const colleges: CollegeSeed[] = [
	{
		name: "Kwara State College of Applied Sciences",
		slug: "kwara-applied-sciences",
		code: "KSCAS",
		contactEmail: "admin@kscas.edu.ng",
		metadata: { intakeSession: "2026/2027", city: "Ilorin" },
		faculties: [
			{
				name: "Faculty of Computing",
				slug: "computing",
				code: "FOC",
				departments: [
					{
						name: "Computer Science",
						slug: "computer-science",
						code: "CSC",
						courses: [
							{ title: "Introduction to Programming", code: "CSC101", level: 100, semester: "first", creditUnits: 3 },
							{ title: "Data Structures", code: "CSC201", level: 200, semester: "first", creditUnits: 3 },
						],
					},
					{
						name: "Information Technology",
						slug: "information-technology",
						code: "IFT",
						courses: [
							{ title: "Web Systems Fundamentals", code: "IFT102", level: 100, semester: "second", creditUnits: 2 },
						],
					},
				],
			},
		],
	},
	{
		name: "Kwara State College of Business and Health",
		slug: "kwara-business-health",
		code: "KSCBH",
		contactEmail: "admin@kscbh.edu.ng",
		metadata: { intakeSession: "2026/2027", city: "Offa" },
		faculties: [
			{
				name: "Faculty of Management Sciences",
				slug: "management-sciences",
				code: "FMS",
				departments: [
					{
						name: "Business Administration",
						slug: "business-administration",
						code: "BUS",
						courses: [
							{ title: "Principles of Management", code: "BUS101", level: 100, semester: "first", creditUnits: 3 },
						],
					},
					{
						name: "Health Information Management",
						slug: "health-information-management",
						code: "HIM",
						courses: [
							{ title: "Health Records Management", code: "HIM201", level: 200, semester: "second", creditUnits: 3 },
						],
					},
				],
			},
		],
	},
];

const roleSeeds: RoleSeed[] = [
	{
		name: "Platform Superadmin",
		code: "platform-superadmin",
		description: "Owns all colleges, platform reporting, global roles, and audit oversight.",
		roleType: "system",
		tenantScope: "platform",
		scopeType: "platform",
		permissions: [
			"dashboard.view",
			"colleges.view",
			"colleges.create",
			"colleges.update",
			"staff.view",
			"staff.create",
			"roles.view",
			"roles.create",
			"roles.update",
			"roles.assign_permissions",
			"reports.view",
			"reports.export",
			"audit.view",
			"settings.view",
			"settings.update",
		],
	},
	{
		name: "College Admin",
		code: "kscas-college-admin",
		description: "Administers staff, students, courses, admissions, reports, and local roles for KSCAS.",
		roleType: "system",
		tenantScope: "college",
		scopeType: "college",
		collegeCode: "KSCAS",
		permissions: [
			"dashboard.view",
			"faculties.view",
			"faculties.create",
			"departments.view",
			"departments.create",
			"staff.view",
			"staff.create",
			"staff.assign_role",
			"students.view",
			"students.create",
			"admissions.view",
			"admissions.approve",
			"courses.view",
			"courses.create",
			"courses.assign_staff",
			"payments.view",
			"payments.verify",
			"notices.view",
			"notices.create",
			"reports.view",
			"roles.view",
			"roles.create",
			"roles.assign_permissions",
			"settings.view",
		],
	},
	{
		name: "Teacher",
		code: "kscas-teacher",
		description: "Teaching role scoped to selected departments or courses.",
		roleType: "custom",
		tenantScope: "college",
		scopeType: "department",
		collegeCode: "KSCAS",
		permissions: ["dashboard.view", "students.view", "courses.view", "results.view", "results.upload", "notices.view"],
	},
	{
		name: "Clerk",
		code: "kscas-clerk",
		description: "Admission support role for applicant review and student records.",
		roleType: "custom",
		tenantScope: "college",
		scopeType: "college",
		collegeCode: "KSCAS",
		permissions: ["dashboard.view", "students.view", "students.update", "admissions.view", "admissions.update", "payments.view", "notices.view"],
	},
	{
		name: "Lab Technician",
		code: "kscas-lab-technician",
		description: "Technical staff role with course and notice access.",
		roleType: "custom",
		tenantScope: "college",
		scopeType: "department",
		collegeCode: "KSCAS",
		permissions: ["dashboard.view", "courses.view", "students.view", "notices.view"],
	},
	{
		name: "College Admin",
		code: "kscbh-college-admin",
		description: "Administers staff, students, courses, admissions, reports, and local roles for KSCBH.",
		roleType: "system",
		tenantScope: "college",
		scopeType: "college",
		collegeCode: "KSCBH",
		permissions: [
			"dashboard.view",
			"faculties.view",
			"faculties.create",
			"departments.view",
			"departments.create",
			"staff.view",
			"staff.create",
			"staff.assign_role",
			"students.view",
			"students.create",
			"admissions.view",
			"admissions.approve",
			"courses.view",
			"courses.create",
			"courses.assign_staff",
			"payments.view",
			"payments.verify",
			"notices.view",
			"reports.view",
			"roles.view",
			"roles.create",
			"roles.assign_permissions",
			"settings.view",
		],
	},
	{
		name: "Bursary Officer",
		code: "kscbh-bursary-officer",
		description: "Finance operations role for payment review and reporting.",
		roleType: "custom",
		tenantScope: "college",
		scopeType: "college",
		collegeCode: "KSCBH",
		permissions: ["dashboard.view", "payments.view", "payments.verify", "payments.export", "reports.view", "notices.view"],
	},
	{
		name: "Course Adviser",
		code: "kscbh-course-adviser",
		description: "Academic advising role for students, courses, and results.",
		roleType: "custom",
		tenantScope: "college",
		scopeType: "department",
		collegeCode: "KSCBH",
		permissions: ["dashboard.view", "students.view", "courses.view", "courses.assign_staff", "results.view", "results.approve", "notices.view"],
	},
];

async function upsertByField(
	strapi: StrapiLike,
	uid: string,
	field: string,
	value: string,
	data: Record<string, unknown>,
) {
	const existing = await strapi.db.query(uid).findOne({
		where: { [field]: value },
	});

	if (existing?.id) {
		return strapi.db.query(uid).update({
			where: { id: existing.id },
			data,
		});
	}

	return strapi.db.query(uid).create({ data });
}

async function seedPermissions(strapi: StrapiLike) {
	const created = new Map<string, Record<string, unknown>>();

	for (const item of permissions) {
		const record = await upsertByField(strapi, "api::permission.permission", "key", item.key, item);
		created.set(item.key, record);
	}

	return created;
}

async function seedMenuItems(strapi: StrapiLike, permissionMap: Map<string, Record<string, unknown>>) {
	for (const item of menuItems) {
		const requiredPermissionIds = item.requiredPermissions
			.map((key) => permissionMap.get(key)?.id)
			.filter(Boolean);

		await upsertByField(strapi, "api::menu-item.menu-item", "key", item.key, {
			key: item.key,
			label: item.label,
			href: item.href,
			icon: item.icon,
			order: item.order,
			domains: item.domains,
			isActive: true,
			requiredPermissions: requiredPermissionIds,
		});
	}
}

async function seedColleges(strapi: StrapiLike) {
	const collegeMap = new Map<string, Record<string, unknown>>();

	for (const college of colleges) {
		const collegeRecord = await upsertByField(strapi, "api::college.college", "code", college.code, {
			name: college.name,
			slug: college.slug,
			code: college.code,
			status: "active",
			contactEmail: college.contactEmail,
			metadata: college.metadata,
		});
		collegeMap.set(college.code, collegeRecord);

		for (const faculty of college.faculties) {
			const facultyCode = `${college.code}-${faculty.code}`;
			const facultyRecord = await upsertByField(strapi, "api::faculty.faculty", "code", facultyCode, {
				name: faculty.name,
				slug: `${college.slug}-${faculty.slug}`,
				code: facultyCode,
				college: collegeRecord.id,
			});

			for (const department of faculty.departments) {
				const departmentCode = `${college.code}-${department.code}`;
				const departmentRecord = await upsertByField(strapi, "api::department.department", "code", departmentCode, {
					name: department.name,
					slug: `${college.slug}-${department.slug}`,
					code: departmentCode,
					college: collegeRecord.id,
					faculty: facultyRecord.id,
				});

				for (const course of department.courses) {
					await upsertByField(strapi, "api::course.course", "code", `${college.code}-${course.code}`, {
						title: course.title,
						code: `${college.code}-${course.code}`,
						level: course.level,
						semester: course.semester,
						creditUnits: course.creditUnits,
						status: "active",
						college: collegeRecord.id,
						department: departmentRecord.id,
					});
				}
			}
		}
	}

	return collegeMap;
}

async function seedRoles(
	strapi: StrapiLike,
	permissionMap: Map<string, Record<string, unknown>>,
	collegeMap: Map<string, Record<string, unknown>>,
) {
	for (const role of roleSeeds) {
		const permissionIds = role.permissions
			.map((key) => permissionMap.get(key)?.id)
			.filter(Boolean);
		const collegeId = role.collegeCode ? collegeMap.get(role.collegeCode)?.id : undefined;

		await upsertByField(strapi, "api::portal-role.portal-role", "code", role.code, {
			name: role.name,
			code: role.code,
			description: role.description,
			roleType: role.roleType,
			tenantScope: role.tenantScope,
			scopeType: role.scopeType,
			college: collegeId,
			permissions: permissionIds,
		});
	}
}

export async function seedDefaultData(strapi: StrapiLike) {
	if (process.env.STRAPI_SEED_DEFAULT_DATA === "false") {
		strapi.log.info("[seed] Default data seed skipped.");
		return;
	}

	strapi.log.info("[seed] Syncing default tenant, RBAC, menu, and academic data...");

	const permissionMap = await seedPermissions(strapi);
	await seedMenuItems(strapi, permissionMap);
	const collegeMap = await seedColleges(strapi);
	await seedRoles(strapi, permissionMap, collegeMap);

	strapi.log.info("[seed] Default data seed complete.");
}
