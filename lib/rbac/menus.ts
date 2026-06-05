import type { DashboardDomain } from "@/lib/auth";
import { buildDashboardPath } from "@/lib/auth";
import type { MenuItemDefinition, UserPermissionKey } from "./types";
import { hasPermissions } from "./guards";

export const MENU_CATALOG = [
  {
    key: "dashboard",
    label: "Overview",
    href: "/dashboard",
    icon: "LayoutDashboard",
    domains: ["student", "staff", "admin", "superadmin"],
    requiredPermissions: ["dashboard.view"],
  },
  {
    key: "profile",
    label: "Profile",
    href: "/college/[collegeSlug]/student/profile",
    icon: "Users",
    domains: ["student"],
    requiredPermissions: ["profile.view"],
  },
  {
    key: "colleges",
    label: "Colleges",
    href: "/superadmin/colleges",
    icon: "Building2",
    domains: ["superadmin"],
    requiredPermissions: ["colleges.view"],
  },
  {
    key: "faculties",
    label: "Faculties",
    href: "/faculties",
    icon: "Network",
    domains: ["admin"],
    requiredPermissions: ["faculties.view"],
  },
  {
    key: "departments",
    label: "Departments",
    href: "/departments",
    icon: "FolderKanban",
    domains: ["admin"],
    requiredPermissions: ["departments.view"],
  },
  {
    key: "students",
    label: "Students",
    href: "/students",
    icon: "Users",
    domains: ["staff", "admin"],
    requiredPermissions: ["students.view"],
  },
  {
    key: "staff",
    label: "Staff",
    href: "/staff",
    icon: "Users",
    domains: ["admin", "superadmin"],
    requiredPermissions: ["staff.view"],
  },
  {
    key: "admissions",
    label: "Admissions",
    href: "/college/[collegeSlug]/student/admission",
    icon: "FolderKanban",
    domains: ["student"],
    requiredPermissions: ["admissions.view"],
  },
  {
    key: "courses",
    label: "Courses",
    href: "/college/[collegeSlug]/modules/courses",
    icon: "BookOpen",
    domains: ["student", "staff", "admin"],
    requiredPermissions: ["courses.view"],
  },
  {
    key: "results",
    label: "Results",
    href: "/college/[collegeSlug]/modules/results",
    icon: "BadgeCheck",
    domains: ["student", "staff", "admin"],
    requiredPermissions: ["results.view"],
  },
  {
    key: "payments",
    label: "Payments",
    href: "/college/[collegeSlug]/modules/payments",
    icon: "CircleDollarSign",
    domains: ["student", "staff", "admin"],
    requiredPermissions: ["payments.view"],
  },
  {
    key: "hostel",
    label: "Hostel",
    href: "/college/[collegeSlug]/modules/hostel",
    icon: "Building2",
    domains: ["student", "staff", "admin"],
    requiredPermissions: ["hostels.view"],
  },
  {
    key: "notices",
    label: "Notices",
    href: "/notices",
    icon: "Bell",
    domains: ["student", "staff", "admin"],
    requiredPermissions: ["notices.view"],
  },
  {
    key: "reports",
    label: "Reports",
    href: "/reports",
    icon: "BarChart3",
    domains: ["staff", "admin", "superadmin"],
    requiredPermissions: ["reports.view"],
  },
  {
    key: "roles",
    label: "Roles",
    href: "/roles",
    icon: "ShieldCheck",
    domains: ["admin", "superadmin"],
    requiredPermissions: ["roles.view"],
  },
  {
    key: "audit",
    label: "Audit",
    href: "/audit",
    icon: "FileBarChart2",
    domains: ["superadmin"],
    requiredPermissions: ["audit.view"],
  },
  {
    key: "settings",
    label: "Settings",
    href: "/settings",
    icon: "Settings",
    domains: ["admin", "superadmin"],
    requiredPermissions: ["settings.view"],
  },
] as const satisfies readonly MenuItemDefinition[];

type DashboardMenuOptions = {
  domain: DashboardDomain;
  permissions: UserPermissionKey[];
  collegeSlug?: string;
};

export function getVisibleDashboardMenus({
  domain,
  permissions,
  collegeSlug,
}: DashboardMenuOptions): MenuItemDefinition[] {
  const dashboardHomePath = buildDashboardPath(domain, {
    collegeSlug,
    useTenantTemplate: Boolean(collegeSlug),
  });

  return MENU_CATALOG.filter((item) => {
    const menuItem = item as MenuItemDefinition;
    const domains = menuItem.domains as readonly DashboardDomain[];

    if (!domains.includes(domain)) {
      return false;
    }

    if (menuItem.href.includes("[collegeSlug]") && !collegeSlug) {
      return false;
    }

    return hasPermissions(permissions, menuItem.requiredPermissions, {
      mode: menuItem.permissionMode,
    });
  }).map((item) => {
    if (item.key === "dashboard") {
      return {
        ...item,
        href: dashboardHomePath,
      };
    }

    if (item.key === "roles" && domain === "superadmin") {
      return {
        ...item,
        href: "/superadmin/roles",
      };
    }

    if (item.href.includes("[collegeSlug]")) {
      return {
        ...item,
        href: collegeSlug
          ? item.href.replace("[collegeSlug]", collegeSlug)
          : item.href,
      };
    }

    return item;
  });
}
