import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
	createDefaultPlatformSettings,
	maintenanceWindowSchema,
	platformSettingsSchema,
	type MaintenanceWindow,
	type PlatformSettings,
} from "@/lib/services/superadmin-settings.service";

const SETTINGS_PATH = path.join(
	process.cwd(),
	".codex",
	"runtime",
	"platform-settings.json",
);

function isMaintenanceCurrentlyActive(maintenance: MaintenanceWindow, now = new Date()) {
	if (!maintenance.enabled) {
		return false;
	}

	const startAt = new Date(maintenance.startAt);
	const endAt = new Date(maintenance.endAt);

	return startAt <= now && now < endAt;
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
	try {
		const raw = await readFile(SETTINGS_PATH, "utf8");
		const parsed = platformSettingsSchema.safeParse(JSON.parse(raw));

		if (parsed.success) {
			return parsed.data;
		}
	} catch {
		// Fall back to defaults when the local-preview store has not been created.
	}

	return createDefaultPlatformSettings();
}

export async function saveMaintenanceWindow(
	maintenance: MaintenanceWindow,
): Promise<PlatformSettings> {
	const parsed = maintenanceWindowSchema.parse(maintenance);
	const current = await getPlatformSettings();
	const nextSettings = { ...current, maintenance: parsed };

	await mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
	await writeFile(SETTINGS_PATH, JSON.stringify(nextSettings, null, 2), "utf8");

	return nextSettings;
}

export async function getActiveMaintenanceWindow() {
	const settings = await getPlatformSettings();

	return isMaintenanceCurrentlyActive(settings.maintenance)
		? settings.maintenance
		: null;
}
