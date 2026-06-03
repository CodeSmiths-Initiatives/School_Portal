import { notFound } from "next/navigation";
import {
	CollegeModuleShell,
	isCollegeModuleKey,
} from "@/features/college-modules";

export default async function CollegeSharedModulePage({
	params,
}: {
	params: Promise<{ collegeSlug: string; moduleKey: string }>;
}) {
	const { collegeSlug, moduleKey } = await params;

	if (!isCollegeModuleKey(moduleKey)) {
		notFound();
	}

	return <CollegeModuleShell collegeSlug={collegeSlug} moduleKey={moduleKey} />;
}
