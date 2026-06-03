export const RESET_RESEND_DELAYS_MS = [
	60 * 1000,
	3 * 60 * 1000,
	2 * 60 * 60 * 1000,
] as const;

export type ResetResendSnapshot = {
	sendCount: number;
	availableAt: number;
};

export function getResetResendStorageKey(email: string, audience: string) {
	return `iums-reset-resend:${audience}:${email.trim().toLowerCase()}`;
}

export function getNextResetResendDelay(sendCount: number) {
	const index = Math.max(0, Math.min(sendCount - 1, RESET_RESEND_DELAYS_MS.length - 1));
	return RESET_RESEND_DELAYS_MS[index];
}

export function formatResetResendTime(milliseconds: number) {
	const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (hours > 0) {
		return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
	}

	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function readResetResendSnapshot(key: string): ResetResendSnapshot | null {
	if (typeof window === "undefined") {
		return null;
	}

	try {
		const value = window.localStorage.getItem(key);
		return value ? (JSON.parse(value) as ResetResendSnapshot) : null;
	} catch {
		return null;
	}
}

export function writeResetResendSnapshot(
	key: string,
	snapshot: ResetResendSnapshot,
) {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.setItem(key, JSON.stringify(snapshot));
}
