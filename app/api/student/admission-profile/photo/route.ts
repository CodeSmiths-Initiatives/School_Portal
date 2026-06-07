import {
	getCurrentAuthSession,
	getCurrentAuthToken,
} from "@/lib/auth/server-session";
import { getStrapiBaseUrl } from "@/lib/api";
import { NextResponse } from "next/server";

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png"]);

type StrapiUploadFile = {
	id?: number;
	url?: string;
	name?: string;
	mime?: string;
	size?: number;
};

function buildPublicMediaUrl(url: string) {
	if (url.startsWith("http://") || url.startsWith("https://")) {
		return url;
	}

	return `${getStrapiBaseUrl()}${url.startsWith("/") ? url : `/${url}`}`;
}

function jsonError(message: string, status: number) {
	return NextResponse.json({ error: message }, { status });
}

async function uploadToStrapi(input: {
	token: string;
	formData: FormData;
}) {
	return fetch(`${getStrapiBaseUrl()}/api/upload`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${input.token}`,
		},
		body: input.formData,
		cache: "no-store",
	});
}

export async function POST(request: Request) {
	const session = await getCurrentAuthSession();

	if (!session || session.user.domain !== "student") {
		return jsonError("You must sign in as a student to upload a photo.", 401);
	}

	let formData: FormData;

	try {
		formData = await request.formData();
	} catch {
		return jsonError("Invalid photo upload request.", 400);
	}

	const collegeSlug = String(formData.get("collegeSlug") ?? "").trim();
	const file = formData.get("file");

	if (!collegeSlug) {
		return jsonError("College slug is required.", 400);
	}

	if (session.user.collegeSlug !== collegeSlug) {
		return jsonError("Photo upload must match your assigned college.", 403);
	}

	if (!(file instanceof File)) {
		return jsonError("Passport photograph file is required.", 400);
	}

	if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
		return jsonError("Only JPG and PNG passport photographs are allowed.", 400);
	}

	if (file.size > MAX_PHOTO_SIZE) {
		return jsonError("Passport photograph must be under 2MB.", 400);
	}

	const sessionToken = await getCurrentAuthToken();
	const apiToken = process.env.STRAPI_API_TOKEN;
	const token = sessionToken ?? apiToken;

	if (!token) {
		return jsonError("Strapi upload authorization is not configured.", 500);
	}

	const uploadForm = new FormData();
	const extension = file.type === "image/png" ? "png" : "jpg";
	const safeName = `${collegeSlug}-${session.user.username}-passport-${Date.now()}.${extension}`;

	uploadForm.append("files", file, safeName);
	uploadForm.append(
		"fileInfo",
		JSON.stringify({
			name: safeName.replace(/\.[^.]+$/, ""),
			alternativeText: `${session.user.name} passport photograph`,
			caption: `${collegeSlug} admission passport photograph`,
		}),
	);

	let response = await uploadToStrapi({ token, formData: uploadForm });

	if (
		!response.ok &&
		sessionToken &&
		apiToken &&
		sessionToken !== apiToken &&
		(response.status === 401 || response.status === 403)
	) {
		response = await uploadToStrapi({ token: apiToken, formData: uploadForm });
	}

	if (!response.ok) {
		let message = "Unable to upload passport photograph.";

		try {
			const payload = (await response.json()) as {
				error?: { message?: string };
			};
			message = payload.error?.message ?? message;
		} catch {
			// Keep the safe fallback.
		}

		return jsonError(message, response.status);
	}

	const files = (await response.json()) as StrapiUploadFile[];
	const uploaded = files[0];

	if (!uploaded?.url) {
		return jsonError("Passport photograph upload did not return a media URL.", 502);
	}

	return NextResponse.json({
		file: {
			id: uploaded.id,
			name: uploaded.name,
			mime: uploaded.mime,
			size: uploaded.size,
			url: buildPublicMediaUrl(uploaded.url),
			path: uploaded.url,
		},
	});
}
