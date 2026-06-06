type StrapiContext = {
	request: {
		header: {
			authorization?: string;
		};
	};
	unauthorized: (message?: string) => unknown;
	notFound: (message?: string) => unknown;
	body: unknown;
};

type StrapiJwtPayload = {
	id?: number;
};

function getBearerToken(ctx: StrapiContext) {
	const authorization = ctx.request.header.authorization;

	if (!authorization?.startsWith("Bearer ")) {
		return null;
	}

	return authorization.slice("Bearer ".length).trim();
}

function mapPermissionKeys(role: Record<string, unknown>) {
	const permissions = role.permissions;

	if (!Array.isArray(permissions)) {
		return [];
	}

	return permissions
		.map((permission) =>
			typeof permission === "object" && permission !== null
				? (permission as Record<string, unknown>).key
				: null,
		)
		.filter((key): key is string => typeof key === "string");
}

function getRoleCode(assignment: Record<string, unknown>) {
	const role = assignment.role;

	if (!role || typeof role !== "object") {
		return "";
	}

	return String((role as Record<string, unknown>).code ?? "").toLowerCase();
}

function getAssignmentPriority(assignment: Record<string, unknown>) {
	const roleCode = getRoleCode(assignment);

	if (roleCode === "platform-superadmin") {
		return 100;
	}

	if (roleCode === "platform-college-admin") {
		return 90;
	}

	if (roleCode === "platform-student") {
		return 80;
	}

	return assignment.isPrimary ? 50 : 0;
}

function selectPrimaryAssignment(assignments: Record<string, unknown>[]) {
	return [...assignments].sort((left, right) => {
		const priorityDelta =
			getAssignmentPriority(right) - getAssignmentPriority(left);

		if (priorityDelta !== 0) {
			return priorityDelta;
		}

		return Number(right.id ?? 0) - Number(left.id ?? 0);
	})[0];
}

export default {
	async me(ctx: StrapiContext) {
		const token = getBearerToken(ctx);

		if (!token) {
			return ctx.unauthorized("Bearer token is required.");
		}

		let payload: StrapiJwtPayload;

		try {
			payload = await strapi.plugin("users-permissions").service("jwt").verify(token);
		} catch {
			return ctx.unauthorized("Invalid or expired token.");
		}

		if (!payload.id) {
			return ctx.unauthorized("Invalid token payload.");
		}

		const user = await strapi.db.query("plugin::users-permissions.user").findOne({
			where: { id: payload.id },
		});

		if (!user?.id || user.blocked) {
			return ctx.unauthorized("User is not active.");
		}

		const assignments = await strapi.db
			.query("api::role-assignment.role-assignment")
			.findMany({
				where: {
					user: user.id,
					status: "active",
				},
				populate: {
					role: {
						populate: {
							permissions: true,
							college: true,
						},
					},
					college: true,
					faculty: true,
					department: true,
					course: true,
				},
			});

		const primaryAssignment = selectPrimaryAssignment(assignments);

		if (!primaryAssignment?.role) {
			return ctx.notFound("No active portal role assignment found for this user.");
		}

		const role = primaryAssignment.role as Record<string, unknown>;
		const college =
			(primaryAssignment.college as Record<string, unknown> | undefined) ??
			(role.college as Record<string, unknown> | undefined);
		const roleCode = String(role.code ?? "").toLowerCase();

		if (
			roleCode !== "platform-superadmin" &&
			college &&
			String(college.status ?? "active") !== "active"
		) {
			return ctx.unauthorized(
				"Your college access is currently inactive. Please contact the administrator.",
			);
		}

		ctx.body = {
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
				confirmed: user.confirmed,
			},
			assignment: {
				id: primaryAssignment.id,
				scopeType: primaryAssignment.scopeType,
				isPrimary: primaryAssignment.isPrimary,
				status: primaryAssignment.status,
			},
			role: {
				id: role.id,
				name: role.name,
				code: role.code,
				tenantScope: role.tenantScope,
				scopeType: role.scopeType,
				permissions: mapPermissionKeys(role),
			},
			college: college
				? {
						id: college.id,
						name: college.name,
						slug: college.slug,
						code: college.code,
						status: college.status,
					}
				: null,
		};
	},
};
