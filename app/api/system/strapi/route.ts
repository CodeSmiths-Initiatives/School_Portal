import { getBackendHealth } from "@/lib/services";

export async function GET() {
	const health = await getBackendHealth();

	return Response.json({
		...health,
		authConfigured: Boolean(process.env.STRAPI_API_TOKEN),
	});
}
