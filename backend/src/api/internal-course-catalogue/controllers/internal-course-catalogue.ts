type StrapiContext = {
	params?: Record<string, string | undefined>;
	request: {
		body?: unknown;
		header: Record<string, string | undefined>;
		query?: Record<string, string | undefined>;
	};
	unauthorized: (message?: string) => unknown;
	badRequest: (message?: string) => unknown;
	notFound?: (message?: string) => unknown;
	conflict?: (message?: string) => unknown;
	body: unknown;
	status?: number;
};

type Level = "100L" | "200L" | "300L" | "400L";
type CourseType = "Core" | "Elective" | "Required" | "Borrowed" | "Carryover";
type CourseStatus = "Pending" | "Approved" | "Rejected";
type CourseMode = "On-Site" | "Online" | "Hybrid";

const DEV_INTERNAL_SECRET =
	"iums-local-registration-secret-change-before-production";
const LEVELS: Level[] = ["100L", "200L", "300L", "400L"];
const COURSE_TYPES: CourseType[] = [
	"Core",
	"Elective",
	"Required",
	"Borrowed",
	"Carryover",
];
const COURSE_STATUSES: CourseStatus[] = ["Pending", "Approved", "Rejected"];
const COURSE_MODES: CourseMode[] = ["On-Site", "Online", "Hybrid"];

function getInternalSecret() {
	const configured =
		process.env.PORTAL_INTERNAL_API_SECRET ?? process.env.PORTAL_REGISTRATION_SECRET;

	if (configured) return configured;
	if (process.env.NODE_ENV === "production") return null;

	return DEV_INTERNAL_SECRET;
}

function getHeader(ctx: StrapiContext, name: string) {
	const lowerName = name.toLowerCase();
	return ctx.request.header[lowerName] ?? ctx.request.header[name];
}

function authorize(ctx: StrapiContext) {
	const expectedSecret = getInternalSecret();
	const providedSecret = getHeader(ctx, "x-portal-internal-secret");

	return Boolean(expectedSecret && providedSecret === expectedSecret);
}

function asString(value: unknown, fallback = "") {
	return typeof value === "string" ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback = 0) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : fallback;
	}
	return fallback;
}

function asRecord(value: unknown) {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function normalizeSlug(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/&/g, " and ")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function normalizeCode(value: unknown) {
	return asString(value).toUpperCase();
}

function normalizeLevel(value: unknown): Level | null {
	const text = asString(value).toUpperCase();
	return LEVELS.includes(text as Level) ? (text as Level) : null;
}

function normalizeLevels(value: unknown): Level[] {
	const values = Array.isArray(value) ? value : [value];
	const levels = values
		.map((item) => normalizeLevel(item))
		.filter((item): item is Level => Boolean(item));

	return Array.from(new Set(levels));
}

function normalizeEnum<T extends string>(
	value: unknown,
	options: readonly T[],
	fallback: T,
) {
	const text = asString(value);
	return options.includes(text as T) ? (text as T) : fallback;
}

function mapSemester(value: unknown) {
	const text = asString(value).toLowerCase();

	if (["second", "2nd", "second semester"].includes(text)) return "second";
	if (["summer", "summer semester"].includes(text)) return "summer";

	return "first";
}

function mapLevelNumber(levels: Level[]) {
	const firstLevel = levels[0] ?? "100L";
	return asNumber(firstLevel.replace("L", ""), 100);
}

function getCourseId(course: Record<string, unknown>) {
	return asString(course.documentId) || String(course.id ?? "");
}

function mapCourse(course: Record<string, unknown>) {
	const department = asRecord(course.department);
	const rawLevels = normalizeLevels(course.levels);
	const levels = rawLevels.length
		? rawLevels
		: normalizeLevel(`${asNumber(course.level, 100)}L`)
			? [normalizeLevel(`${asNumber(course.level, 100)}L`) as Level]
			: ["100L"];

	return {
		id: getCourseId(course),
		documentId: asString(course.documentId) || undefined,
		numericId: typeof course.id === "number" ? course.id : undefined,
		code: normalizeCode(course.code),
		title: asString(course.title),
		description: asString(course.description),
		department: asString(department.name, "General Studies"),
		type: normalizeEnum(course.type, COURSE_TYPES, "Core"),
		units: asNumber(course.creditUnits, 3),
		levels,
		mode: normalizeEnum(course.mode, COURSE_MODES, "On-Site"),
		schedule: asString(course.schedule),
		lecturer: asString(course.lecturer),
		status: normalizeEnum(course.approvalStatus, COURSE_STATUSES, "Pending"),
		approvalNote: asString(course.approvalNote) || undefined,
	};
}

async function findCollegeBySlug(collegeSlug: string) {
	return strapi.db.query("api::college.college").findOne({
		where: { slug: collegeSlug },
	});
}

async function findCourseForCollege(courseId: string, collegeId: number) {
	return strapi.db.query("api::course.course").findOne({
		where: {
			$or: [{ documentId: courseId }, { id: asNumber(courseId) }],
			college: collegeId,
		},
		populate: { department: true, college: true },
	});
}

async function resolveDepartment(collegeId: number, departmentName: string) {
	const name = departmentName || "General Studies";
	const existing = await strapi.db.query("api::department.department").findOne({
		where: { name, college: collegeId },
	});

	if (existing?.id) return existing.id;

	return (
		await strapi.db.query("api::department.department").create({
			data: {
				name,
				slug: normalizeSlug(name),
				code: normalizeSlug(name).slice(0, 12).toUpperCase(),
				college: collegeId,
			},
		})
	).id;
}

async function createAuditLog(input: {
	collegeId?: number;
	action: string;
	entityId?: string;
	summary: string;
	metadata?: Record<string, unknown>;
}) {
	try {
		await strapi.db.query("api::audit-log.audit-log").create({
			data: {
				action: input.action,
				entityType: "course",
				entityId: input.entityId,
				summary: input.summary,
				metadata: input.metadata ?? {},
				occurredAt: new Date().toISOString(),
				...(input.collegeId ? { college: input.collegeId } : {}),
			},
		});
	} catch (error) {
		strapi.log.warn(
			`[internal-course-catalogue] Audit write failed: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		);
	}
}

function parseCoursePayload(body: unknown) {
	const payload = asRecord(body);
	const code = normalizeCode(payload.code);
	const title = asString(payload.title);
	const levels = normalizeLevels(payload.levels);

	return {
		code,
		title,
		description: asString(payload.description),
		department: asString(payload.department, "General Studies"),
		type: normalizeEnum(payload.type, COURSE_TYPES, "Core"),
		units: asNumber(payload.units, 3),
		levels,
		mode: normalizeEnum(payload.mode, COURSE_MODES, "On-Site"),
		schedule: asString(payload.schedule),
		lecturer: asString(payload.lecturer),
		status: normalizeEnum(payload.status, COURSE_STATUSES, "Pending"),
		approvalNote: asString(payload.approvalNote),
		semester: mapSemester(payload.semester),
	};
}

export default {
	async list(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Course catalogue access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const college = await findCollegeBySlug(collegeSlug);

		if (!college?.id) {
			return ctx.notFound?.("College could not be found.") ?? ctx.badRequest("College could not be found.");
		}

		const courses = await strapi.db.query("api::course.course").findMany({
			where: { college: college.id, status: { $ne: "archived" } },
			populate: { department: true, college: true },
			orderBy: [{ code: "asc" }, { title: "asc" }],
			limit: 1000,
		});

		const mappedCourses = (courses as Record<string, unknown>[]).map(mapCourse);

		ctx.body = {
			college: {
				id: college.id,
				name: college.name,
				slug: college.slug,
				code: college.code,
			},
			courses: mappedCourses,
			count: mappedCourses.length,
			generatedAt: new Date().toISOString(),
		};
	},

	async create(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Course catalogue access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const college = await findCollegeBySlug(collegeSlug);

		if (!college?.id) {
			return ctx.notFound?.("College could not be found.") ?? ctx.badRequest("College could not be found.");
		}

		const payload = parseCoursePayload(ctx.request.body);

		if (!payload.code || !payload.title || payload.levels.length === 0) {
			return ctx.badRequest("Course code, title, and at least one level are required.");
		}

		const existing = await strapi.db.query("api::course.course").findOne({
			where: { code: payload.code, college: college.id, status: { $ne: "archived" } },
		});

		if (existing?.id) {
			return ctx.conflict?.("A course with this code already exists in this college.") ??
				ctx.badRequest("A course with this code already exists in this college.");
		}

		const departmentId = await resolveDepartment(college.id, payload.department);
		const course = await strapi.db.query("api::course.course").create({
			data: {
				code: payload.code,
				title: payload.title,
				description: payload.description,
				type: payload.type,
				creditUnits: payload.units,
				level: mapLevelNumber(payload.levels),
				levels: payload.levels,
				semester: payload.semester,
				mode: payload.mode,
				schedule: payload.schedule,
				lecturer: payload.lecturer,
				approvalStatus: payload.status,
				approvalNote: payload.approvalNote,
				status: "active",
				college: college.id,
				department: departmentId,
			},
			populate: { department: true, college: true },
		});

		await createAuditLog({
			collegeId: college.id,
			action: "course.created",
			entityId: String(course.id),
			summary: `Created course ${payload.code}`,
			metadata: { collegeSlug, code: payload.code },
		});

		ctx.status = 201;
		ctx.body = { course: mapCourse(course as Record<string, unknown>) };
	},

	async update(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Course catalogue access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const courseId = asString(ctx.params?.id);
		const college = await findCollegeBySlug(collegeSlug);

		if (!college?.id || !courseId) {
			return ctx.badRequest("College slug and course id are required.");
		}

		const existing = await findCourseForCollege(courseId, college.id);

		if (!existing?.id) {
			return ctx.notFound?.("Course could not be found for this college.") ??
				ctx.badRequest("Course could not be found for this college.");
		}

		const payload = parseCoursePayload(ctx.request.body);

		if (!payload.code || !payload.title || payload.levels.length === 0) {
			return ctx.badRequest("Course code, title, and at least one level are required.");
		}

		const duplicate = await strapi.db.query("api::course.course").findOne({
			where: {
				code: payload.code,
				college: college.id,
				status: { $ne: "archived" },
				id: { $ne: existing.id },
			},
		});

		if (duplicate?.id) {
			return ctx.conflict?.("Another course with this code already exists in this college.") ??
				ctx.badRequest("Another course with this code already exists in this college.");
		}

		const departmentId = await resolveDepartment(college.id, payload.department);
		const course = await strapi.db.query("api::course.course").update({
			where: { id: existing.id },
			data: {
				code: payload.code,
				title: payload.title,
				description: payload.description,
				type: payload.type,
				creditUnits: payload.units,
				level: mapLevelNumber(payload.levels),
				levels: payload.levels,
				semester: payload.semester,
				mode: payload.mode,
				schedule: payload.schedule,
				lecturer: payload.lecturer,
				approvalStatus: payload.status,
				approvalNote: payload.approvalNote,
				department: departmentId,
			},
			populate: { department: true, college: true },
		});

		await createAuditLog({
			collegeId: college.id,
			action: "course.updated",
			entityId: String(existing.id),
			summary: `Updated course ${payload.code}`,
			metadata: { collegeSlug, code: payload.code },
		});

		ctx.body = { course: mapCourse(course as Record<string, unknown>) };
	},

	async delete(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Course catalogue access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const courseId = asString(ctx.params?.id);
		const college = await findCollegeBySlug(collegeSlug);

		if (!college?.id || !courseId) {
			return ctx.badRequest("College slug and course id are required.");
		}

		const existing = await findCourseForCollege(courseId, college.id);

		if (!existing?.id) {
			return ctx.notFound?.("Course could not be found for this college.") ??
				ctx.badRequest("Course could not be found for this college.");
		}

		await strapi.db.query("api::course.course").update({
			where: { id: existing.id },
			data: { status: "archived" },
		});

		await createAuditLog({
			collegeId: college.id,
			action: "course.deleted",
			entityId: String(existing.id),
			summary: `Deleted course ${asString(existing.code)}`,
			metadata: { collegeSlug, code: asString(existing.code) },
		});

		ctx.status = 204;
		ctx.body = null;
	},
};
