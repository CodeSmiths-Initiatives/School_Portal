const TEMPORARY_PASSWORD_RANDOM_LENGTH = 5;
const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function padTwo(value: number) {
	return String(value).padStart(2, "0");
}

function randomIndex(max: number) {
	const cryptoApi = globalThis.crypto;

	if (cryptoApi?.getRandomValues) {
		const bytes = new Uint32Array(1);
		cryptoApi.getRandomValues(bytes);
		return bytes[0] % max;
	}

	return Math.floor(Math.random() * max);
}

function randomAlphaNumeric(length: number) {
	return Array.from(
		{ length },
		() => ALPHANUMERIC[randomIndex(ALPHANUMERIC.length)],
	).join("");
}

export const TEMPORARY_PASSWORD_PATTERN = /^[A-Za-z0-9]{5}@[0-9]{6}!$/;

export function createTemporaryPassword(now = new Date()) {
	const yy = padTwo(now.getFullYear() % 100);
	const hh = padTwo(now.getHours());
	const mm = padTwo(now.getMinutes());

	return `${randomAlphaNumeric(TEMPORARY_PASSWORD_RANDOM_LENGTH)}@${yy}${hh}${mm}!`;
}
