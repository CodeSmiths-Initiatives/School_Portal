import { DASHBOARD_PATHS } from "@/lib/auth";
import { redirect } from "next/navigation";

export default function StaffDashboardPage() {
	redirect(DASHBOARD_PATHS.staff);
}
