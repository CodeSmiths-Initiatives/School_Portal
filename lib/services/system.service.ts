import { checkStrapiHealth } from "@/lib/api";

export async function getBackendHealth() {
	return checkStrapiHealth();
}
