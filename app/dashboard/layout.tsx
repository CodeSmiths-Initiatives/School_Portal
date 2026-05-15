import type { Metadata } from "next";
export const metadata: Metadata = {
	title: "Dashboard | Kwara State University Admission Portal",
};
export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
