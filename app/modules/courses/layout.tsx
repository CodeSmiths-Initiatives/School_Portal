import type { Metadata } from "next";
export const metadata: Metadata = {
	title: "Course Portal",
	description: "Course definitions and management for 2025/2026",
};
export default function PortalLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
