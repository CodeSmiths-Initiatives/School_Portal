type StrapiLike = {
  db: {
    query: (uid: string) => {
      findOne: (
        args: Record<string, unknown>,
      ) => Promise<Record<string, unknown> | null>;
      create: (
        args: Record<string, unknown>,
      ) => Promise<Record<string, unknown>>;
      update: (
        args: Record<string, unknown>,
      ) => Promise<Record<string, unknown>>;
    };
  };
  plugin: (name: string) => {
    service: (serviceName: string) => {
      add: (data: Record<string, unknown>) => Promise<Record<string, unknown>>;
    };
  };
  store: (options: { type: string; name: string }) => {
    get: (args: { key: string }) => Promise<Record<string, unknown> | null>;
    set: (args: {
      key: string;
      value: Record<string, unknown>;
    }) => Promise<void>;
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
  scopeType:
    | "platform"
    | "college"
    | "faculty"
    | "department"
    | "course"
    | "self";
  collegeCode?: string;
  permissions: string[];
};

type UserSeed = {
  name: string;
  username: string;
  email: string;
  password: string;
  portalRoleCode: string;
  scopeType:
    | "platform"
    | "college"
    | "faculty"
    | "department"
    | "course"
    | "self";
  collegeCode?: string;
};

const permissions: PermissionSeed[] = [
  ["dashboard", "view", "View dashboard"],
  ["profile", "view", "View profile"],
  ["profile", "update", "Update profile"],
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
  ["courses", "approve", "Approve course"],
  ["courses", "reject", "Reject course"],
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
  ["hostels", "view", "View hostels"],
  ["hostels", "create", "Create hostel"],
  ["hostels", "update", "Update hostel"],
  ["hostels", "allocate", "Allocate hostel"],
].map(([module, action, label]) => ({
  key: `${module}.${action}`,
  module,
  action,
  label,
}));

const menuItems: MenuSeed[] = [
  {
    key: "dashboard",
    label: "Overview",
    href: "/dashboard",
    icon: "LayoutDashboard",
    order: 10,
    domains: ["student", "staff", "admin", "superadmin"],
    requiredPermissions: ["dashboard.view"],
  },
  {
    key: "profile",
    label: "Profile",
    href: "/college/[collegeSlug]/student/profile",
    icon: "Users",
    order: 20,
    domains: ["student"],
    requiredPermissions: ["profile.view"],
  },
  {
    key: "colleges",
    label: "Colleges",
    href: "/superadmin/colleges",
    icon: "Building2",
    order: 30,
    domains: ["superadmin"],
    requiredPermissions: ["colleges.view"],
  },
  {
    key: "faculties",
    label: "Faculties",
    href: "/faculties",
    icon: "Network",
    order: 40,
    domains: ["admin"],
    requiredPermissions: ["faculties.view"],
  },
  {
    key: "departments",
    label: "Departments",
    href: "/departments",
    icon: "FolderKanban",
    order: 50,
    domains: ["admin"],
    requiredPermissions: ["departments.view"],
  },
  {
    key: "students",
    label: "Students",
    href: "/students",
    icon: "Users",
    order: 60,
    domains: ["staff", "admin"],
    requiredPermissions: ["students.view"],
  },
  {
    key: "staff",
    label: "Staff",
    href: "/staff",
    icon: "Users",
    order: 70,
    domains: ["admin", "superadmin"],
    requiredPermissions: ["staff.view"],
  },
  {
    key: "admissions",
    label: "Admissions",
    href: "/college/[collegeSlug]/student/admission",
    icon: "FolderKanban",
    order: 80,
    domains: ["student"],
    requiredPermissions: ["admissions.view"],
  },
  {
    key: "courses",
    label: "Courses",
    href: "/college/[collegeSlug]/modules/courses",
    icon: "BookOpen",
    order: 90,
    domains: ["student", "staff", "admin"],
    requiredPermissions: ["courses.view"],
  },
  {
    key: "results",
    label: "Results",
    href: "/college/[collegeSlug]/modules/results",
    icon: "BadgeCheck",
    order: 100,
    domains: ["student", "staff", "admin"],
    requiredPermissions: ["results.view"],
  },
  {
    key: "payments",
    label: "Payments",
    href: "/college/[collegeSlug]/modules/payments",
    icon: "CircleDollarSign",
    order: 110,
    domains: ["student", "staff", "admin"],
    requiredPermissions: ["payments.view"],
  },
  {
    key: "hostel",
    label: "Hostel",
    href: "/college/[collegeSlug]/modules/hostel",
    icon: "Building2",
    order: 120,
    domains: ["student", "staff", "admin"],
    requiredPermissions: ["hostels.view"],
  },
  {
    key: "notices",
    label: "Notices",
    href: "/notices",
    icon: "Bell",
    order: 130,
    domains: ["student", "staff", "admin"],
    requiredPermissions: ["notices.view"],
  },
  {
    key: "reports",
    label: "Reports",
    href: "/reports",
    icon: "BarChart3",
    order: 140,
    domains: ["staff", "admin", "superadmin"],
    requiredPermissions: ["reports.view"],
  },
  {
    key: "roles",
    label: "Roles",
    href: "/roles",
    icon: "ShieldCheck",
    order: 150,
    domains: ["admin", "superadmin"],
    requiredPermissions: ["roles.view"],
  },
  {
    key: "audit",
    label: "Audit",
    href: "/audit",
    icon: "FileBarChart2",
    order: 160,
    domains: ["superadmin"],
    requiredPermissions: ["audit.view"],
  },
  {
    key: "settings",
    label: "Settings",
    href: "/settings",
    icon: "Settings",
    order: 170,
    domains: ["admin", "superadmin"],
    requiredPermissions: ["settings.view"],
  },
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
              {
                title: "Introduction to Programming",
                code: "CSC101",
                level: 100,
                semester: "first",
                creditUnits: 3,
              },
              {
                title: "Data Structures",
                code: "CSC201",
                level: 200,
                semester: "first",
                creditUnits: 3,
              },
            ],
          },
          {
            name: "Information Technology",
            slug: "information-technology",
            code: "IFT",
            courses: [
              {
                title: "Web Systems Fundamentals",
                code: "IFT102",
                level: 100,
                semester: "second",
                creditUnits: 2,
              },
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
              {
                title: "Principles of Management",
                code: "BUS101",
                level: 100,
                semester: "first",
                creditUnits: 3,
              },
            ],
          },
          {
            name: "Health Information Management",
            slug: "health-information-management",
            code: "HIM",
            courses: [
              {
                title: "Health Records Management",
                code: "HIM201",
                level: 200,
                semester: "second",
                creditUnits: 3,
              },
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
    description:
      "Owns all colleges, platform reporting, global roles, and audit oversight.",
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
    description:
      "Administers staff, students, courses, admissions, reports, and local roles for KSCAS.",
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
      "courses.update",
      "courses.assign_staff",
      "courses.approve",
      "courses.reject",
      "payments.view",
      "payments.verify",
      "payments.print",
      "notices.view",
      "notices.create",
      "reports.view",
      "roles.view",
      "roles.create",
      "roles.assign_permissions",
      "settings.view",
      "hostels.view",
      "hostels.create",
      "hostels.update",
      "hostels.allocate",
    ],
  },
  {
    name: "Student",
    code: "kscas-student",
    description:
      "Student/applicant role for college-scoped dashboard, admission progress, payments, courses, hostel, and notices.",
    roleType: "system",
    tenantScope: "college",
    scopeType: "self",
    collegeCode: "KSCAS",
    permissions: [
      "dashboard.view",
      "profile.view",
      "profile.update",
      "admissions.view",
      "courses.view",
      "courses.register",
      "results.view",
      "payments.view",
      "payments.print",
      "hostels.view",
      "notices.view",
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
    permissions: [
      "dashboard.view",
      "students.view",
      "courses.view",
      "results.view",
      "results.upload",
      "notices.view",
    ],
  },
  {
    name: "Head of Department",
    code: "kscas-hod",
    description:
      "Department leadership role for academic oversight, course review, and result approval.",
    roleType: "custom",
    tenantScope: "college",
    scopeType: "department",
    collegeCode: "KSCAS",
    permissions: [
      "dashboard.view",
      "students.view",
      "courses.view",
      "courses.assign_staff",
      "courses.approve",
      "courses.reject",
      "results.view",
      "results.approve",
      "notices.view",
      "reports.view",
    ],
  },
  {
    name: "Clerk",
    code: "kscas-clerk",
    description:
      "Admission support role for applicant review and student records.",
    roleType: "custom",
    tenantScope: "college",
    scopeType: "college",
    collegeCode: "KSCAS",
    permissions: [
      "dashboard.view",
      "students.view",
      "students.update",
      "admissions.view",
      "admissions.update",
      "payments.view",
      "payments.print",
      "notices.view",
    ],
  },
  {
    name: "Lab Technician",
    code: "kscas-lab-technician",
    description: "Technical staff role with course and notice access.",
    roleType: "custom",
    tenantScope: "college",
    scopeType: "department",
    collegeCode: "KSCAS",
    permissions: [
      "dashboard.view",
      "courses.view",
      "students.view",
      "notices.view",
    ],
  },
  {
    name: "College Admin",
    code: "kscbh-college-admin",
    description:
      "Administers staff, students, courses, admissions, reports, and local roles for KSCBH.",
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
      "courses.update",
      "courses.assign_staff",
      "courses.approve",
      "courses.reject",
      "payments.view",
      "payments.verify",
      "payments.print",
      "notices.view",
      "reports.view",
      "roles.view",
      "roles.create",
      "roles.assign_permissions",
      "settings.view",
      "hostels.view",
      "hostels.create",
      "hostels.update",
      "hostels.allocate",
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
    permissions: [
      "dashboard.view",
      "payments.view",
      "payments.verify",
      "payments.export",
      "payments.print",
      "reports.view",
      "notices.view",
    ],
  },
  {
    name: "Course Adviser",
    code: "kscbh-course-adviser",
    description: "Academic advising role for students, courses, and results.",
    roleType: "custom",
    tenantScope: "college",
    scopeType: "department",
    collegeCode: "KSCBH",
    permissions: [
      "dashboard.view",
      "students.view",
      "courses.view",
      "courses.assign_staff",
      "courses.approve",
      "courses.reject",
      "results.view",
      "results.approve",
      "notices.view",
    ],
  },
];

const userSeeds: UserSeed[] = [
  {
    name: "Principal Superadmin",
    username: "superadmin",
    email: "superadmin@iums.test",
    password: "Super@123",
    portalRoleCode: "platform-superadmin",
    scopeType: "platform",
  },
  {
    name: "Kwara College Admin",
    username: "kwara.admin",
    email: "admin.kwara@iums.test",
    password: "Admin@123",
    portalRoleCode: "kscas-college-admin",
    scopeType: "college",
    collegeCode: "KSCAS",
  },
  {
    name: "Kwara Student",
    username: "kwara.student",
    email: "student.kwara@iums.test",
    password: "Student@1",
    portalRoleCode: "kscas-student",
    scopeType: "self",
    collegeCode: "KSCAS",
  },
  {
    name: "Kwara HOD",
    username: "kwara.hod",
    email: "hod.kwara@iums.test",
    password: "Hod@1234",
    portalRoleCode: "kscas-hod",
    scopeType: "department",
    collegeCode: "KSCAS",
  },
  {
    name: "Kwara Clerk",
    username: "kwara.clerk",
    email: "clerk.kwara@iums.test",
    password: "Clerk@123",
    portalRoleCode: "kscas-clerk",
    scopeType: "college",
    collegeCode: "KSCAS",
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
    const record = await upsertByField(
      strapi,
      "api::permission.permission",
      "key",
      item.key,
      item,
    );
    created.set(item.key, record);
  }

  return created;
}

async function seedMenuItems(
  strapi: StrapiLike,
  permissionMap: Map<string, Record<string, unknown>>,
) {
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
    const collegeRecord = await upsertByField(
      strapi,
      "api::college.college",
      "code",
      college.code,
      {
        name: college.name,
        slug: college.slug,
        code: college.code,
        status: "active",
        contactEmail: college.contactEmail,
        metadata: college.metadata,
      },
    );
    collegeMap.set(college.code, collegeRecord);

    for (const faculty of college.faculties) {
      const facultyCode = `${college.code}-${faculty.code}`;
      const facultyRecord = await upsertByField(
        strapi,
        "api::faculty.faculty",
        "code",
        facultyCode,
        {
          name: faculty.name,
          slug: `${college.slug}-${faculty.slug}`,
          code: facultyCode,
          college: collegeRecord.id,
        },
      );

      for (const department of faculty.departments) {
        const departmentCode = `${college.code}-${department.code}`;
        const departmentRecord = await upsertByField(
          strapi,
          "api::department.department",
          "code",
          departmentCode,
          {
            name: department.name,
            slug: `${college.slug}-${department.slug}`,
            code: departmentCode,
            college: collegeRecord.id,
            faculty: facultyRecord.id,
          },
        );

        for (const course of department.courses) {
          await upsertByField(
            strapi,
            "api::course.course",
            "code",
            `${college.code}-${course.code}`,
            {
              title: course.title,
              code: `${college.code}-${course.code}`,
              level: course.level,
              semester: course.semester,
              creditUnits: course.creditUnits,
              status: "active",
              college: collegeRecord.id,
              department: departmentRecord.id,
            },
          );
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
  const roleMap = new Map<string, Record<string, unknown>>();

  for (const role of roleSeeds) {
    const permissionIds = role.permissions
      .map((key) => permissionMap.get(key)?.id)
      .filter(Boolean);
    const collegeId = role.collegeCode
      ? collegeMap.get(role.collegeCode)?.id
      : undefined;

    const roleRecord = await upsertByField(
      strapi,
      "api::portal-role.portal-role",
      "code",
      role.code,
      {
        name: role.name,
        code: role.code,
        description: role.description,
        roleType: role.roleType,
        tenantScope: role.tenantScope,
        scopeType: role.scopeType,
        college: collegeId,
        permissions: permissionIds,
      },
    );
    roleMap.set(role.code, roleRecord);
  }

  return roleMap;
}

async function getAuthenticatedPluginRoleId(strapi: StrapiLike) {
  const role = await strapi.db.query("plugin::users-permissions.role").findOne({
    where: { type: "authenticated" },
  });

  return role?.id;
}

async function upsertPortalUser(
  strapi: StrapiLike,
  user: UserSeed,
  pluginRoleId: unknown,
) {
  const existing = await strapi.db
    .query("plugin::users-permissions.user")
    .findOne({
      where: { email: user.email },
    });

  const baseData = {
    username: user.username,
    email: user.email,
    provider: "local",
    confirmed: true,
    blocked: false,
    role: pluginRoleId,
  };

  if (existing?.id) {
    return strapi.db.query("plugin::users-permissions.user").update({
      where: { id: existing.id },
      data: baseData,
    });
  }

  return strapi
    .plugin("users-permissions")
    .service("user")
    .add({
      ...baseData,
      password: user.password,
    });
}

async function upsertRoleAssignment(
  strapi: StrapiLike,
  data: Record<string, unknown>,
) {
  const where: Record<string, unknown> = {
    user: data.user,
    role: data.role,
    scopeType: data.scopeType,
  };
  const assignmentData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );

  if (data.college !== undefined) {
    where.college = data.college;
  }
  if (data.faculty !== undefined) {
    where.faculty = data.faculty;
  }
  if (data.department !== undefined) {
    where.department = data.department;
  }
  if (data.course !== undefined) {
    where.course = data.course;
  }

  const existing = await strapi.db
    .query("api::role-assignment.role-assignment")
    .findOne({
      where,
    });

  if (existing?.id) {
    return strapi.db.query("api::role-assignment.role-assignment").update({
      where: { id: existing.id },
      data: assignmentData,
    });
  }

  return strapi.db.query("api::role-assignment.role-assignment").create({
    data: assignmentData,
  });
}

async function seedUsers(
  strapi: StrapiLike,
  collegeMap: Map<string, Record<string, unknown>>,
  roleMap: Map<string, Record<string, unknown>>,
) {
  const pluginRoleId = await getAuthenticatedPluginRoleId(strapi);

  if (!pluginRoleId) {
    strapi.log.info(
      "[seed] Users skipped because the authenticated plugin role was not found.",
    );
    return;
  }

  for (const user of userSeeds) {
    const userRecord = await upsertPortalUser(strapi, user, pluginRoleId);
    const collegeId = user.collegeCode
      ? collegeMap.get(user.collegeCode)?.id
      : undefined;
    const portalRoleId = roleMap.get(user.portalRoleCode)?.id;

    if (!portalRoleId) {
      strapi.log.info(
        `[seed] Role assignment skipped for ${user.email}; portal role not found.`,
      );
      continue;
    }

    await upsertRoleAssignment(strapi, {
      user: userRecord.id,
      role: portalRoleId,
      college: collegeId,
      scopeType: user.scopeType,
      status: "active",
      isPrimary: true,
    });
  }
}

async function syncUsersPermissionsSettings(strapi: StrapiLike) {
  const pluginStore = strapi.store({
    type: "plugin",
    name: "users-permissions",
  });
  const frontendUrl = (
    process.env.FRONTEND_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  const senderEmail =
    process.env.SMTP_FROM ?? process.env.SMTP_USERNAME ?? "no-reply@iums.local";
  const replyToEmail = process.env.SMTP_REPLY_TO ?? senderEmail;

  const advancedSettings = (await pluginStore.get({ key: "advanced" })) ?? {};
  await pluginStore.set({
    key: "advanced",
    value: {
      ...advancedSettings,
      email_reset_password: `${frontendUrl}/reset-password`,
      email_confirmation_redirection: `${frontendUrl}/signin`,
    },
  });

  const emailSettings = (await pluginStore.get({ key: "email" })) ?? {};
  const resetPasswordSettings =
    (emailSettings.reset_password as Record<string, unknown> | undefined) ?? {};
  const resetPasswordOptions =
    (resetPasswordSettings.options as Record<string, unknown> | undefined) ??
    {};

  await pluginStore.set({
    key: "email",
    value: {
      ...emailSettings,
      reset_password: {
        ...resetPasswordSettings,
        display:
          resetPasswordSettings.display ?? "Email.template.reset_password",
        icon: resetPasswordSettings.icon ?? "sync",
        options: {
          ...resetPasswordOptions,
          from: {
            name: "School Portal",
            email: senderEmail,
          },
          response_email: replyToEmail,
          object: "Reset your School Portal password",
          message: `<p>Hello <%= USER.username %>,</p>

<p>We received a request to reset your School Portal password.</p>
<p>Use this reset code in the portal:</p>
<p><strong>Code = <%= TOKEN %></strong></p>

<p>If you did not request this, you can ignore this email.</p>`,
        },
      },
    },
  });
}

export async function seedDefaultData(strapi: StrapiLike) {
  if (process.env.STRAPI_SEED_DEFAULT_DATA === "false") {
    strapi.log.info("[seed] Default data seed skipped.");
    return;
  }

  strapi.log.info(
    "[seed] Syncing default tenant, RBAC, menu, and academic data...",
  );

  await syncUsersPermissionsSettings(strapi);
  const permissionMap = await seedPermissions(strapi);
  await seedMenuItems(strapi, permissionMap);
  const collegeMap = await seedColleges(strapi);
  const roleMap = await seedRoles(strapi, permissionMap, collegeMap);
  await seedUsers(strapi, collegeMap, roleMap);

  strapi.log.info("[seed] Default data seed complete.");
}
