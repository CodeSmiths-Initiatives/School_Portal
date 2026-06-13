type StrapiLike = {
  db: {
    query: (uid: string) => {
      findOne: (
        args: Record<string, unknown>,
      ) => Promise<Record<string, unknown> | null>;
      findMany: (
        args: Record<string, unknown>,
      ) => Promise<Record<string, unknown>[]>;
      create: (
        args: Record<string, unknown>,
      ) => Promise<Record<string, unknown>>;
      update: (
        args: Record<string, unknown>,
      ) => Promise<Record<string, unknown>>;
      deleteMany: (
        args: Record<string, unknown>,
      ) => Promise<Record<string, unknown>>;
    };
  };
  plugin: (name: string) => {
    service: (serviceName: string) => {
      add: (data: Record<string, unknown>) => Promise<Record<string, unknown>>;
      edit: (
        id: unknown,
        data: Record<string, unknown>,
      ) => Promise<Record<string, unknown>>;
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
    warn?: (message: string) => void;
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

type DemoCollegeDefinition = {
  name: string;
  slug: string;
  code: string;
  contactEmail: string;
  city: string;
  primaryFaculty: string;
  primaryFacultySlug: string;
  primaryFacultyCode: string;
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

const demoCollegeDefinitions: DemoCollegeDefinition[] = [
  {
    name: "Kwara State College of Applied Sciences",
    slug: "kwara-applied-sciences",
    code: "KAS",
    contactEmail: "admin.kas@iums.test",
    city: "Ilorin",
    primaryFaculty: "Faculty of Computing",
    primaryFacultySlug: "computing",
    primaryFacultyCode: "FOC",
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
  {
    name: "Kwara State College of Business and Health",
    slug: "kwara-business-health",
    code: "KBH",
    contactEmail: "admin.kbh@iums.test",
    city: "Offa",
    primaryFaculty: "Faculty of Management Sciences",
    primaryFacultySlug: "management-sciences",
    primaryFacultyCode: "FMS",
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
  {
    name: "Kwara College of Education",
    slug: "kwara-college-education",
    code: "KCE",
    contactEmail: "admin.kce@iums.test",
    city: "Oro",
    primaryFaculty: "Faculty of Education",
    primaryFacultySlug: "education",
    primaryFacultyCode: "FED",
    departments: [
      {
        name: "Educational Management",
        slug: "educational-management",
        code: "EDM",
        courses: [
          {
            title: "Foundations of Education",
            code: "EDM101",
            level: 100,
            semester: "first",
            creditUnits: 3,
          },
          {
            title: "Teaching Practice Methods",
            code: "EDM202",
            level: 200,
            semester: "second",
            creditUnits: 2,
          },
        ],
      },
    ],
  },
  {
    name: "Kwara Polytechnic Institute",
    slug: "kwara-polytechnic-institute",
    code: "KPI",
    contactEmail: "admin.kpi@iums.test",
    city: "Ilorin",
    primaryFaculty: "School of Engineering Technology",
    primaryFacultySlug: "engineering-technology",
    primaryFacultyCode: "SET",
    departments: [
      {
        name: "Electrical Engineering",
        slug: "electrical-engineering",
        code: "EEE",
        courses: [
          {
            title: "Circuit Theory",
            code: "EEE101",
            level: 100,
            semester: "first",
            creditUnits: 3,
          },
          {
            title: "Workshop Practice",
            code: "EEE102",
            level: 100,
            semester: "second",
            creditUnits: 2,
          },
        ],
      },
    ],
  },
  {
    name: "Kwara Agriculture and Technology",
    slug: "kwara-agriculture-technology",
    code: "KAT",
    contactEmail: "admin.kat@iums.test",
    city: "Lafiagi",
    primaryFaculty: "Faculty of Agriculture",
    primaryFacultySlug: "agriculture",
    primaryFacultyCode: "FAG",
    departments: [
      {
        name: "Agricultural Extension",
        slug: "agricultural-extension",
        code: "AGE",
        courses: [
          {
            title: "Crop Production Principles",
            code: "AGE101",
            level: 100,
            semester: "first",
            creditUnits: 3,
          },
          {
            title: "Farm Management",
            code: "AGE203",
            level: 200,
            semester: "second",
            creditUnits: 3,
          },
        ],
      },
    ],
  },
];

const colleges: CollegeSeed[] = demoCollegeDefinitions.map((college) => ({
  name: college.name,
  slug: college.slug,
  code: college.code,
  contactEmail: college.contactEmail,
  metadata: {
    intakeSession: "2026/2027",
    city: college.city,
    seedKey: "demo-tenant-v2",
    admin: {
      name: `${college.code} College Admin`,
      username: `admin.${college.code.toLowerCase()}`,
      email: `admin.${college.code.toLowerCase()}@iums.test`,
      phone: `+2348000000${college.code.length}${college.code.charCodeAt(0)}`,
      roleCode: "platform-college-admin",
      studentRoleCode: "platform-student",
      roleAssignmentScope: "college",
      provisionedAt: "2026-06-05T00:00:00.000Z",
      seeded: true,
    },
  },
  faculties: [
    {
      name: college.primaryFaculty,
      slug: college.primaryFacultySlug,
      code: college.primaryFacultyCode,
      departments: college.departments,
    },
  ],
}));

const superadminRoleSeed: RoleSeed = {
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
};

const collegeAdminRoleSeed: RoleSeed = {
  name: "College Admin",
  code: "platform-college-admin",
  description:
    "Global college admin role template. Tenant access comes from each user's college role assignment.",
  roleType: "system",
  tenantScope: "college",
  scopeType: "college",
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
    "courses.delete",
    "courses.assign_staff",
    "courses.approve",
    "courses.reject",
    "payments.view",
    "payments.verify",
    "payments.export",
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
};

const studentRoleSeed: RoleSeed = {
  name: "Student",
  code: "platform-student",
  description:
    "Global student/applicant role template. Tenant access comes from each user's college role assignment.",
  roleType: "system",
  tenantScope: "college",
  scopeType: "self",
  permissions: [
    "dashboard.view",
    "profile.view",
    "profile.update",
    "admissions.view",
    "admissions.create",
    "courses.view",
    "courses.register",
    "results.view",
    "payments.view",
    "payments.create",
    "payments.print",
    "hostels.view",
    "notices.view",
  ],
};

function collegeRoleSeeds(college: DemoCollegeDefinition): RoleSeed[] {
  const code = college.code.toLowerCase();

  return [
    {
      name: `${college.code} HOD`,
      code: `${code}-hod`,
      description:
        "College-scoped department leadership role for course review, result approval, and academic oversight.",
      roleType: "custom",
      tenantScope: "college",
      scopeType: "department",
      collegeCode: college.code,
      permissions: [
        "dashboard.view",
        "students.view",
        "admissions.view",
        "courses.view",
        "courses.create",
        "courses.update",
        "courses.delete",
        "courses.assign_staff",
        "courses.approve",
        "courses.reject",
        "results.view",
        "results.approve",
        "reports.view",
        "notices.view",
      ],
    },
    {
      name: `${college.code} Clerk`,
      code: `${code}-clerk`,
      description:
        "College-scoped registry role for admission review, student lookup, and document follow-up.",
      roleType: "custom",
      tenantScope: "college",
      scopeType: "college",
      collegeCode: college.code,
      permissions: [
        "dashboard.view",
        "students.view",
        "students.update",
        "admissions.view",
        "admissions.update",
        "courses.view",
        "payments.view",
        "payments.print",
        "notices.view",
      ],
    },
    {
      name: `${college.code} Cashier`,
      code: `${code}-cashier`,
      description:
        "College-scoped finance role for payment ledger review, verification, export, and receipt printing.",
      roleType: "custom",
      tenantScope: "college",
      scopeType: "college",
      collegeCode: college.code,
      permissions: [
        "dashboard.view",
        "students.view",
        "payments.view",
        "payments.verify",
        "payments.export",
        "payments.print",
        "reports.view",
        "notices.view",
      ],
    },
  ];
}

const roleSeeds: RoleSeed[] = [
  superadminRoleSeed,
  collegeAdminRoleSeed,
  studentRoleSeed,
  ...demoCollegeDefinitions.flatMap(collegeRoleSeeds),
];

function collegeUserSeeds(college: DemoCollegeDefinition): UserSeed[] {
  const code = college.code.toLowerCase();
  const title = college.code;

  return [
    {
      name: `${title} College Admin`,
      username: `admin.${code}`,
      email: `admin.${code}@iums.test`,
      password: "Admin@123",
      portalRoleCode: "platform-college-admin",
      scopeType: "college",
      collegeCode: college.code,
    },
    ...Array.from({ length: 5 }, (_, index) => {
      const number = index + 1;

      return {
        name: `${title} Student ${number}`,
        username: `student${number}.${code}`,
        email: `student${number}.${code}@iums.test`,
        password: "Student@1",
        portalRoleCode: "platform-student",
        scopeType: "self" as const,
        collegeCode: college.code,
      };
    }),
    {
      name: `${title} HOD`,
      username: `hod.${code}`,
      email: `hod.${code}@iums.test`,
      password: "Hod@1234",
      portalRoleCode: `${code}-hod`,
      scopeType: "department",
      collegeCode: college.code,
    },
    {
      name: `${title} Clerk One`,
      username: `clerk1.${code}`,
      email: `clerk1.${code}@iums.test`,
      password: "Clerk@123",
      portalRoleCode: `${code}-clerk`,
      scopeType: "college",
      collegeCode: college.code,
    },
    {
      name: `${title} Clerk Two`,
      username: `clerk2.${code}`,
      email: `clerk2.${code}@iums.test`,
      password: "Clerk@123",
      portalRoleCode: `${code}-clerk`,
      scopeType: "college",
      collegeCode: college.code,
    },
    {
      name: `${title} Cashier`,
      username: `cashier.${code}`,
      email: `cashier.${code}@iums.test`,
      password: "Cashier@1",
      portalRoleCode: `${code}-cashier`,
      scopeType: "college",
      collegeCode: college.code,
    },
  ];
}

const userSeeds: UserSeed[] = [
  {
    name: "Principal Superadmin",
    username: "superadmin",
    email: "superadmin@iums.test",
    password: "Super@123",
    portalRoleCode: "platform-superadmin",
    scopeType: "platform",
  },
  ...demoCollegeDefinitions.flatMap(collegeUserSeeds),
];

const demoCollegeCodes = demoCollegeDefinitions.map((college) => college.code);
const demoCollegeSlugs = demoCollegeDefinitions.map((college) => college.slug);
const demoCustomRoleCodes = demoCollegeDefinitions.flatMap((college) => {
  const code = college.code.toLowerCase();
  return [`${code}-hod`, `${code}-clerk`, `${code}-cashier`];
});
const legacySeedRoleCodes = [
  "kscas-student",
  "kscas-teacher",
  "kscas-hod",
  "kscas-clerk",
  "kscas-lab-technician",
  "kscbh-bursary-officer",
  "kscbh-course-adviser",
];
const demoUserEmails = userSeeds.map((user) => user.email);
const legacySeedUserEmails = [
  "admin.kwara@iums.test",
  "student.kwara@iums.test",
  "hod.kwara@iums.test",
  "clerk.kwara@iums.test",
];
const legacyQaApplicantEmails = [
  "qa.student.one@iums.test",
  "qa.student.two@iums.test",
  "qa.student.pay1@example.com",
  "qa.student.pay2@example.com",
  "alex@example.com",
  "stu@example.com",
];
const legacyCollegeCodes = ["KDC785", "MGM1", "MGM", "MGMVASHI", "QAT235"];
const demoSeedKey = "demo-tenant-v2";

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

async function deleteManySafe(
  strapi: StrapiLike,
  uid: string,
  where: Record<string, unknown>,
) {
  try {
    await strapi.db.query(uid).deleteMany({ where });
  } catch (error) {
    strapi.log.warn?.(
      `[seed] Cleanup skipped for ${uid}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

async function cleanupDemoSeedData(strapi: StrapiLike) {
  const allSeedEmails = [...new Set([...demoUserEmails, ...legacySeedUserEmails])];
  const allSeedRoleCodes = [
    ...new Set([...demoCustomRoleCodes, ...legacySeedRoleCodes]),
  ];
  const seedUsers = await strapi.db
    .query("plugin::users-permissions.user")
    .findMany({
      where: { email: { $in: allSeedEmails } },
    });
  const seedRoles = await strapi.db.query("api::portal-role.portal-role").findMany({
    where: { code: { $in: allSeedRoleCodes } },
  });
  const seedUserIds = seedUsers
    .map((user) => user.id)
    .filter((id): id is number => typeof id === "number");
  const seedRoleIds = seedRoles
    .map((role) => role.id)
    .filter((id): id is number => typeof id === "number");

  await deleteManySafe(strapi, "api::payment-ledger-entry.payment-ledger-entry", {
    $or: [
      { entryNumber: { $startsWith: "LED-SEED-" } },
      { reference: { $startsWith: "ADM-SEED-" } },
      { reference: { $startsWith: "INV-ADM-SEED-" } },
      { reference: { $startsWith: "ADM-178" } },
      { reference: { $startsWith: "INV-ADM-178" } },
    ],
  });
  await deleteManySafe(strapi, "api::payment-transaction.payment-transaction", {
    $or: [
      { reference: { $startsWith: "ADM-SEED-" } },
      { reference: { $startsWith: "ADM-178" } },
    ],
  });
  await deleteManySafe(strapi, "api::payment-invoice.payment-invoice", {
    $or: [
      { invoiceNumber: { $startsWith: "INV-ADM-SEED-" } },
      { invoiceNumber: { $startsWith: "INV-ADM-178" } },
      { payerEmail: { $in: allSeedEmails } },
      { payerEmail: { $in: legacyQaApplicantEmails } },
    ],
  });
  await deleteManySafe(strapi, "api::admission-application.admission-application", {
    $or: [
      { applicationNumber: { $startsWith: "APP-SEED-" } },
      { applicationNumber: { $startsWith: "APP-KSCAS-178" } },
      { applicantEmail: { $in: allSeedEmails } },
      { applicantEmail: { $in: legacyQaApplicantEmails } },
    ],
  });
  await deleteManySafe(strapi, "api::audit-log.audit-log", {
    action: {
      $in: [
        "seed.college.synced",
        "seed.user.provisioned",
        "seed.payment.posted",
        "settings.notice.updated",
        "settings.maintenance.updated",
        "enrollment_created",
        "payment_completed",
      ],
    },
  });

  if (seedUserIds.length > 0 || seedRoleIds.length > 0) {
    await deleteManySafe(strapi, "api::role-assignment.role-assignment", {
      $or: [
        ...(seedUserIds.length > 0 ? [{ user: { $in: seedUserIds } }] : []),
        ...(seedRoleIds.length > 0 ? [{ role: { $in: seedRoleIds } }] : []),
      ],
    });
  }

  if (seedUserIds.length > 0) {
    await deleteManySafe(strapi, "plugin::users-permissions.user", {
      id: { $in: seedUserIds },
    });
  }

  if (seedRoleIds.length > 0) {
    await deleteManySafe(strapi, "api::portal-role.portal-role", {
      id: { $in: seedRoleIds },
    });
  }
}

async function archiveLegacyQaColleges(strapi: StrapiLike) {
  const legacyColleges = await strapi.db.query("api::college.college").findMany({
    where: { code: { $in: legacyCollegeCodes } },
    limit: 50,
  });

  for (const college of legacyColleges) {
    if (!college.id) {
      continue;
    }

    await strapi.db.query("api::college.college").update({
      where: { id: college.id },
      data: { status: "archived" },
    });
  }
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

async function upsertCollege(strapi: StrapiLike, college: CollegeSeed) {
  const existing = await strapi.db.query("api::college.college").findOne({
    where: {
      $or: [
        { code: college.code },
        { slug: college.slug },
        ...(college.slug === "kwara-applied-sciences" ? [{ code: "KSCAS" }] : []),
        ...(college.slug === "kwara-business-health" ? [{ code: "KSCBH" }] : []),
      ],
    },
  });
  const data = {
    name: college.name,
    slug: college.slug,
    code: college.code,
    status: "active",
    contactEmail: college.contactEmail,
    metadata: college.metadata,
  };

  if (existing?.id) {
    return strapi.db.query("api::college.college").update({
      where: { id: existing.id },
      data,
    });
  }

  return strapi.db.query("api::college.college").create({ data });
}

async function seedColleges(strapi: StrapiLike) {
  const collegeMap = new Map<string, Record<string, unknown>>();

  for (const college of colleges) {
    const collegeRecord = await upsertCollege(strapi, college);
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
    const roleData = {
      name: role.name,
      code: role.code,
      description: role.description,
      roleType: role.roleType,
      tenantScope: role.tenantScope,
      scopeType: role.scopeType,
      permissions: permissionIds,
      ...(collegeId ? { college: collegeId } : {}),
    };

    const roleRecord = await upsertByField(
      strapi,
      "api::portal-role.portal-role",
      "code",
      role.code,
      roleData,
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
    return strapi
      .plugin("users-permissions")
      .service("user")
      .edit(existing.id, {
        ...baseData,
        password: user.password,
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

  if (data.isPrimary && data.user) {
    const activeAssignments = await strapi.db
      .query("api::role-assignment.role-assignment")
      .findMany({
        where: {
          user: data.user,
          status: "active",
        },
      });

    for (const assignment of activeAssignments) {
      if (assignment.id) {
        await strapi.db.query("api::role-assignment.role-assignment").update({
          where: { id: assignment.id },
          data: { isPrimary: false },
        });
      }
    }
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
  const userMap = new Map<string, Record<string, unknown>>();

  if (!pluginRoleId) {
    strapi.log.info(
      "[seed] Users skipped because the authenticated plugin role was not found.",
    );
    return userMap;
  }

  for (const user of userSeeds) {
    const userRecord = await upsertPortalUser(strapi, user, pluginRoleId);
    userMap.set(user.email, userRecord);
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

  return userMap;
}

function numericId(record?: Record<string, unknown>) {
  return typeof record?.id === "number" ? record.id : undefined;
}

function seededIso(daysAgo: number, offsetMinutes = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setMinutes(date.getMinutes() - offsetMinutes);
  return date.toISOString();
}

async function seedAdmissionAndPaymentData(
  strapi: StrapiLike,
  collegeMap: Map<string, Record<string, unknown>>,
  userMap: Map<string, Record<string, unknown>>,
) {
  const amount = 16500;
  let applicationCount = 0;
  let paidInvoiceCount = 0;
  let pendingInvoiceCount = 0;

  for (const [collegeIndex, college] of demoCollegeDefinitions.entries()) {
    const collegeRecord = collegeMap.get(college.code);
    const collegeId = numericId(collegeRecord);

    if (!collegeId) {
      continue;
    }

    for (let index = 1; index <= 5; index += 1) {
      const email = `student${index}.${college.code.toLowerCase()}@iums.test`;
      const userRecord = userMap.get(email);
      const userId = numericId(userRecord);
      const reference = `ADM-SEED-${college.code}-${String(index).padStart(2, "0")}`;
      const applicationNumber = `APP-SEED-${college.code}-${String(index).padStart(3, "0")}`;
      const isPaid = index <= 3;
      const isPending = index === 4;
      const createdAt = seededIso(collegeIndex * 2 + index, index * 7);
      const application = await upsertByField(
        strapi,
        "api::admission-application.admission-application",
        "applicationNumber",
        applicationNumber,
        {
          applicationNumber,
          applicantUsername: `student${index}.${college.code.toLowerCase()}`,
          applicantEmail: email,
          programmeType: index % 2 === 0 ? "topup" : "undergraduate",
          facultyKey: college.primaryFacultySlug,
          departmentKey: college.departments[0]?.slug,
          entrySession: "2026/2027",
          status: isPaid ? "submitted" : isPending ? "payment_pending" : "draft",
          paymentStatus: isPaid ? "paid" : isPending ? "pending" : "not_started",
          currentStep: isPaid ? "submitted" : isPending ? "payment" : "programme",
          completedSteps: isPaid
            ? ["account", "programme", "payment"]
            : isPending
              ? ["account", "programme"]
              : ["account"],
          lastSavedAt: createdAt,
          submittedAt: isPaid ? createdAt : undefined,
          metadata: {
            seedKey: demoSeedKey,
            collegeSlug: college.slug,
            source: "default-demo-seed",
          },
          college: collegeId,
          ...(userId ? { applicant: userId } : {}),
        },
      );
      applicationCount += 1;

      if (!isPaid && !isPending) {
        continue;
      }

      const invoiceNumber = `INV-ADM-SEED-${college.code}-${String(index).padStart(2, "0")}`;
      const invoice = await upsertByField(
        strapi,
        "api::payment-invoice.payment-invoice",
        "invoiceNumber",
        invoiceNumber,
        {
          invoiceNumber,
          module: "admission",
          description: "Application Fee",
          amount,
          currency: "NGN",
          status: isPaid ? "paid" : "pending",
          payerName: `${college.code} Student ${index}`,
          payerEmail: email,
          payerIdentifier: applicationNumber,
          paidAt: isPaid ? createdAt : undefined,
          metadata: {
            seedKey: demoSeedKey,
            collegeSlug: college.slug,
            applicationNumber,
            paymentReference: reference,
          },
          college: collegeId,
          ...(userId ? { payer: userId } : {}),
          admissionApplication: application.id,
        },
      );
      const transaction = await upsertByField(
        strapi,
        "api::payment-transaction.payment-transaction",
        "reference",
        reference,
        {
          reference,
          gateway: "paystack",
          channel: "card",
          amount,
          currency: "NGN",
          status: isPaid ? "success" : "initialized",
          gatewayStatus: isPaid ? "success" : "initialized",
          gatewayMessage: isPaid
            ? "Seeded Paystack transaction verified"
            : "Seeded Paystack checkout initialized",
          paidAt: isPaid ? createdAt : undefined,
          verifiedAt: isPaid ? createdAt : undefined,
          metadata: {
            seedKey: demoSeedKey,
            collegeSlug: college.slug,
            applicationNumber,
            invoiceNumber,
          },
          college: collegeId,
          invoice: invoice.id,
          ...(userId ? { payer: userId } : {}),
          admissionApplication: application.id,
        },
      );

      await upsertByField(
        strapi,
        "api::payment-ledger-entry.payment-ledger-entry",
        "entryNumber",
        `LED-SEED-CHARGE-${college.code}-${String(index).padStart(2, "0")}`,
        {
          entryNumber: `LED-SEED-CHARGE-${college.code}-${String(index).padStart(2, "0")}`,
          entryType: "charge",
          direction: "debit",
          amount,
          currency: "NGN",
          module: "admission",
          description: "Application Fee invoice raised",
          reference: invoiceNumber,
          postedAt: createdAt,
          metadata: { seedKey: demoSeedKey, paymentReference: reference },
          college: collegeId,
          invoice: invoice.id,
          transaction: transaction.id,
          ...(userId ? { payer: userId } : {}),
          admissionApplication: application.id,
        },
      );

      if (isPaid) {
        await upsertByField(
          strapi,
          "api::payment-ledger-entry.payment-ledger-entry",
          "entryNumber",
          `LED-SEED-PAYMENT-${college.code}-${String(index).padStart(2, "0")}`,
          {
            entryNumber: `LED-SEED-PAYMENT-${college.code}-${String(index).padStart(2, "0")}`,
            entryType: "payment",
            direction: "credit",
            amount,
            currency: "NGN",
            module: "admission",
            description: "Gateway payment verified",
            reference,
            postedAt: createdAt,
            metadata: { seedKey: demoSeedKey, channel: "card" },
            college: collegeId,
            invoice: invoice.id,
            transaction: transaction.id,
            ...(userId ? { payer: userId } : {}),
            admissionApplication: application.id,
          },
        );
        paidInvoiceCount += 1;
      } else {
        pendingInvoiceCount += 1;
      }
    }
  }

  return { applicationCount, paidInvoiceCount, pendingInvoiceCount };
}

async function seedAuditData(
  strapi: StrapiLike,
  collegeMap: Map<string, Record<string, unknown>>,
  userMap: Map<string, Record<string, unknown>>,
) {
  const superadmin = userMap.get("superadmin@iums.test");
  const superadminId = numericId(superadmin);
  let auditCount = 0;

  for (const [collegeIndex, college] of demoCollegeDefinitions.entries()) {
    const collegeRecord = collegeMap.get(college.code);
    const collegeId = numericId(collegeRecord);

    if (!collegeId) {
      continue;
    }

    const events = [
      {
        action: "seed.college.synced",
        eventType: "updated",
        actorName: "Principal Superadmin",
        actorEmail: "superadmin@iums.test",
        actorRole: "Platform Superadmin",
        entityType: "college",
        entityId: String(collegeId),
        targetLabel: college.name,
        summary: `${college.name} tenant, admin, roles, and default academic records were synchronized.`,
      },
      {
        action: "seed.user.provisioned",
        eventType: "created",
        actorName: "Principal Superadmin",
        actorEmail: "superadmin@iums.test",
        actorRole: "Platform Superadmin",
        entityType: "users",
        entityId: college.code,
        targetLabel: `${college.code} tenant users`,
        summary: `Created 1 admin, 5 students, 1 HOD, 2 clerks, and 1 cashier for ${college.name}.`,
      },
      {
        action: "seed.payment.posted",
        eventType: "created",
        actorName: `cashier.${college.code.toLowerCase()}`,
        actorEmail: `cashier.${college.code.toLowerCase()}@iums.test`,
        actorRole: "Cashier",
        entityType: "payment",
        entityId: `ADM-SEED-${college.code}`,
        targetLabel: `${college.code} admission invoices`,
        summary: `Seeded 3 paid and 1 pending admission invoice for ${college.name}.`,
      },
    ];

    for (const [eventIndex, event] of events.entries()) {
      await strapi.db.query("api::audit-log.audit-log").create({
        data: {
          ...event,
          ipAddress: "127.0.0.1",
          occurredAt: seededIso(collegeIndex, eventIndex * 12),
          metadata: {
            seedKey: demoSeedKey,
            collegeSlug: college.slug,
            source: "default-demo-seed",
          },
          ...(superadminId ? { actor: superadminId } : {}),
          college: collegeId,
        },
      });
      auditCount += 1;
    }
  }

  for (const [index, event] of [
    {
      action: "settings.notice.updated",
      eventType: "settings",
      targetLabel: "Platform admission notice",
      summary:
        "Superadmin updated the platform admission notice for current applicants and college users.",
    },
    {
      action: "settings.maintenance.updated",
      eventType: "settings",
      targetLabel: "Maintenance window",
      summary:
        "Superadmin reviewed the maintenance-window settings and kept the platform in active mode.",
    },
  ].entries()) {
    await strapi.db.query("api::audit-log.audit-log").create({
      data: {
        ...event,
        actorName: "Principal Superadmin",
        actorEmail: "superadmin@iums.test",
        actorRole: "Platform Superadmin",
        entityType: "settings",
        entityId: "platform-settings",
        ipAddress: "127.0.0.1",
        occurredAt: seededIso(0, index * 9),
        metadata: {
          seedKey: demoSeedKey,
          source: "default-demo-seed",
        },
        ...(superadminId ? { actor: superadminId } : {}),
      },
    });
    auditCount += 1;
  }

  return { auditCount };
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
  await cleanupDemoSeedData(strapi);
  await archiveLegacyQaColleges(strapi);
  const permissionMap = await seedPermissions(strapi);
  await seedMenuItems(strapi, permissionMap);
  const collegeMap = await seedColleges(strapi);
  const roleMap = await seedRoles(strapi, permissionMap, collegeMap);
  const userMap = await seedUsers(strapi, collegeMap, roleMap);
  const paymentSeed = await seedAdmissionAndPaymentData(
    strapi,
    collegeMap,
    userMap,
  );
  const auditSeed = await seedAuditData(strapi, collegeMap, userMap);

  strapi.log.info(
    `[seed] Default data seed complete. Colleges=${demoCollegeCodes.length}, Admins=${demoCollegeCodes.length}, Students=25, Applications=${paymentSeed.applicationCount}, PaidInvoices=${paymentSeed.paidInvoiceCount}, PendingInvoices=${paymentSeed.pendingInvoiceCount}, AuditLogs=${auditSeed.auditCount}.`,
  );
}
