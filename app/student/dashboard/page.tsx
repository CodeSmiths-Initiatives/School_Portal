import { redirect } from "next/navigation";
import { DASHBOARD_PATHS } from "@/lib/auth";

export default function StudentDashboardPage() {
	redirect(DASHBOARD_PATHS.student);
}
