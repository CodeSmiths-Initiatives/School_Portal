type StrapiContext = {
	request: {
		body?: unknown;
		header: Record<string, string | undefined>;
	};
	unauthorized: (message?: string) => unknown;
	badRequest: (message?: string) => unknown;
	conflict: (message?: string) => unknown;
	body: unknown;
};

type RegisterStudentPayload = {
	username?: unknown;
	email?: unknown;
	password?: unknown;
	collegeSlug?: unknown;
};

const DEV_REGISTRATION_SECRET =
	"iums-local-registration-secret-change-before-production";

function getRegistrationSecret() {
	const configured = process.env.PORTAL_REGISTRATION_SECRET;

	if (configured) {
		return configured;
	}

	if (process.env.NODE_ENV === "production") {
		return null;
	}

	return DEV_REGISTRATION_SECRET;
}

function normalizeEmail(value: string) {
	return value.trim().toLowerCase();
}

function normalizeUsername(value: string) {
	return value.trim();
}

function getHeader(ctx: StrapiContext, name: string) {
	const lowerName = name.toLowerCase();
	return ctx.request.header[lowerName] ?? ctx.request.header[name];
}

function parsePayload(body: unknown) {
	const payload = (body ?? {}) as RegisterStudentPayload;
	const username = typeof payload.username === "string" ? normalizeUsername(payload.username) : "";
	const email = typeof payload.email === "string" ? normalizeEmail(payload.email) : "";
	const password = typeof payload.password === "string" ? payload.password : "";
	const collegeSlug =
		typeof payload.collegeSlug === "string" ? payload.collegeSlug.trim() : "";

	return { username, email, password, collegeSlug };
}

async function getAuthenticatedPluginRoleId() {
	const role = await strapi.db.query("plugin::users-permissions.role").findOne({
		where: { type: "authenticated" },
	});

	return role?.id;
}

async function findExistingAssignment(userId: number, roleId: number, collegeId: number) {
	return strapi.db.query("api::role-assignment.role-assignment").findOne({
		where: {
			user: userId,
			role: roleId,
			college: collegeId,
			scopeType: "self",
		},
	});
}

export default {
	async registerStudent(ctx: StrapiContext) {
		const expectedSecret = getRegistrationSecret();
		const providedSecret = getHeader(ctx, "x-portal-registration-secret");

		if (!expectedSecret || providedSecret !== expectedSecret) {
			return ctx.unauthorized("Student registration is not authorized.");
		}

		const payload = parsePayload(ctx.request.body);

		if (!payload.username || !payload.email || !payload.password || !payload.collegeSlug) {
			return ctx.badRequest("Username, email, password, and college are required.");
		}

		const college = await strapi.db.query("api::college.college").findOne({
			where: { slug: payload.collegeSlug, status: "active" },
		});

		if (!college?.id || !college.code) {
			return ctx.badRequest("Selected college could not be resolved.");
		}

		const studentRoleCode = `${String(college.code).toLowerCase()}-student`;
		const studentRole = await strapi.db.query("api::portal-role.portal-role").findOne({
			where: {
				code: studentRoleCode,
				college: college.id,
			},
		});

		if (!studentRole?.id) {
			return ctx.badRequest("The selected college does not have a student role configured.");
		}

		const pluginRoleId = await getAuthenticatedPluginRoleId();

		if (!pluginRoleId) {
			return ctx.badRequest("The authenticated user role is not configured.");
		}

		const existingUser = await strapi.db
			.query("plugin::users-permissions.user")
			.findOne({
				where: {
					$or: [{ email: payload.email }, { username: payload.username }],
				},
			});

		if (
			existingUser?.id &&
			existingUser.email &&
			normalizeEmail(String(existingUser.email)) !== payload.email
		) {
			return ctx.conflict("Username is already linked to another email address.");
		}

		const userService = strapi.plugin("users-permissions").service("user");
		const user = existingUser?.id
			? await userService.edit(existingUser.id, {
					username: payload.username,
					email: payload.email,
					password: payload.password,
					provider: "local",
					confirmed: true,
					blocked: false,
					role: pluginRoleId,
				})
			: await userService.add({
					username: payload.username,
					email: payload.email,
					password: payload.password,
					provider: "local",
					confirmed: true,
					blocked: false,
					role: pluginRoleId,
				});

		const assignment = await findExistingAssignment(user.id, studentRole.id, college.id);

		if (assignment?.id) {
			await strapi.db.query("api::role-assignment.role-assignment").update({
				where: { id: assignment.id },
				data: {
					status: "active",
					isPrimary: true,
				},
			});
		} else {
			await strapi.db.query("api::role-assignment.role-assignment").create({
				data: {
					user: user.id,
					role: studentRole.id,
					college: college.id,
					scopeType: "self",
					status: "active",
					isPrimary: true,
				},
			});
		}

		ctx.body = {
			ok: true,
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
			},
			college: {
				id: college.id,
				name: college.name,
				slug: college.slug,
				code: college.code,
			},
			role: {
				id: studentRole.id,
				name: studentRole.name,
				code: studentRole.code,
			},
		};
	},
};
