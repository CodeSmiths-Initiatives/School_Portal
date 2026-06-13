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
type StoredTimetableLevel = "Level100" | "Level200" | "Level300" | "Level400";
type CourseType = "Core" | "Elective" | "Required" | "Borrowed" | "Carryover";
type CourseStatus = "Pending" | "Approved" | "Rejected";
type CourseMode = "On-Site" | "Online" | "Hybrid";

const DEV_INTERNAL_SECRET =
	"iums-local-registration-secret-change-before-production";
const LEVELS: Level[] = ["100L", "200L", "300L", "400L"];
const TIMETABLE_LEVEL_STORAGE: Record<Level, StoredTimetableLevel> = {
	"100L": "Level100",
	"200L": "Level200",
	"300L": "Level300",
	"400L": "Level400",
};
const TIMETABLE_LEVEL_LABELS = Object.fromEntries(
	Object.entries(TIMETABLE_LEVEL_STORAGE).map(([label, stored]) => [stored, label]),
) as Record<StoredTimetableLevel, Level>;
const COURSE_TYPES: CourseType[] = [
	"Core",
	"Elective",
	"Required",
	"Borrowed",
	"Carryover",
];
const COURSE_STATUSES: CourseStatus[] = ["Pending", "Approved", "Rejected"];
const COURSE_MODES: CourseMode[] = ["On-Site", "Online", "Hybrid"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
type TimetableDay = (typeof DAYS)[number];

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

function normalizeTimetableLevel(value: unknown): Level | null {
	const directLevel = normalizeLevel(value);
	if (directLevel) return directLevel;

	const storedLevel = asString(value);
	return TIMETABLE_LEVEL_LABELS[storedLevel as StoredTimetableLevel] ?? null;
}

function mapTimetableLevelForStorage(level: Level) {
	return TIMETABLE_LEVEL_STORAGE[level];
}

function getTimetableLevelLookup(level: Level) {
	return [level, mapTimetableLevelForStorage(level)];
}

function normalizeLevels(value: unknown): Level[] {
	const values = Array.isArray(value) ? value : [value];
	const levels = values
		.map((item) => normalizeLevel(item))
		.filter((item): item is Level => Boolean(item));

	return Array.from(new Set(levels));
}

function addLevel(levels: Level[], level: Level) {
	return Array.from(new Set([...levels, level]));
}

function removeLevel(levels: Level[], level: Level) {
	return levels.filter((item) => item !== level);
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
	const legacyLevel = normalizeLevel(`${asNumber(course.level, 100)}L`);
	const levels = Array.isArray(course.levels)
		? rawLevels
		: rawLevels.length
			? rawLevels
			: legacyLevel
				? [legacyLevel]
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

function normalizeDay(value: unknown): TimetableDay | null {
	const text = asString(value);
	return DAYS.includes(text as TimetableDay) ? (text as TimetableDay) : null;
}

function normalizeTime(value: unknown) {
	return asString(value).replace(/\s/g, "").replace(/â€“|â€”/g, "-");
}

function mapTimetableSlot(slot: Record<string, unknown>) {
	const course = asRecord(slot.course);

	return {
		id: getCourseId(slot),
		documentId: asString(slot.documentId) || undefined,
		numericId: typeof slot.id === "number" ? slot.id : undefined,
		code: normalizeCode(course.code),
		course: asString(course.title),
		courseId: getCourseId(course) || undefined,
		day: normalizeDay(slot.day) ?? "Monday",
		time: normalizeTime(slot.time),
		room: asString(slot.room),
		mode: normalizeEnum(slot.mode, COURSE_MODES, "On-Site"),
		level: normalizeTimetableLevel(slot.level) ?? "100L",
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

async function findCourseForTimetable(
	input: { courseId?: string; code?: string },
	collegeId: number,
) {
	const courseId = asString(input.courseId);
	const code = normalizeCode(input.code);
	const identifiers = [
		...(courseId ? [{ documentId: courseId }, { id: asNumber(courseId) }] : []),
		...(code ? [{ code }] : []),
	];

	if (identifiers.length === 0) return null;

	return strapi.db.query("api::course.course").findOne({
		where: {
			$or: identifiers,
			college: collegeId,
			status: { $ne: "archived" },
		},
		populate: { department: true, college: true },
	});
}

async function findTimetableSlotForCollege(slotId: string, collegeId: number) {
	return strapi.db.query("api::course-timetable-slot.course-timetable-slot").findOne({
		where: {
			$or: [{ documentId: slotId }, { id: asNumber(slotId) }],
			college: collegeId,
			status: { $ne: "archived" },
		},
		populate: { course: true, college: true },
	});
}

async function updateCourseLevels(
	course: Record<string, unknown>,
	levels: Level[],
) {
	return strapi.db.query("api::course.course").update({
		where: { id: course.id },
		data: {
			levels,
			level: mapLevelNumber(levels),
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
	entityType?: string;
	action: string;
	entityId?: string;
	summary: string;
	metadata?: Record<string, unknown>;
}) {
	try {
		await strapi.db.query("api::audit-log.audit-log").create({
			data: {
				action: input.action,
				entityType: input.entityType ?? "course",
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

function parseCourseStatusPayload(body: unknown) {
	const payload = asRecord(body);

	return {
		status: normalizeEnum(payload.status, COURSE_STATUSES, "Pending"),
		approvalNote: asString(payload.approvalNote),
	};
}

function parseAllocationPayload(body: unknown) {
	const payload = asRecord(body);
	const level = normalizeLevel(payload.level);
	const nextLevel = normalizeLevel(payload.nextLevel);

	return {
		courseId: asString(payload.courseId),
		level,
		nextCourseId: asString(payload.nextCourseId),
		nextLevel,
	};
}

function parseTimetablePayload(body: unknown) {
	const payload = asRecord(body);

	return {
		courseId: asString(payload.courseId),
		code: normalizeCode(payload.code),
		day: normalizeDay(payload.day),
		time: normalizeTime(payload.time),
		room: asString(payload.room),
		mode: normalizeEnum(payload.mode, COURSE_MODES, "On-Site"),
		level: normalizeLevel(payload.level),
	};
}

function getCourseLevels(course: Record<string, unknown>) {
	const levels = normalizeLevels(course.levels);

	if (Array.isArray(course.levels)) return levels;
	if (levels.length) return levels;

	const fallback = normalizeLevel(`${asNumber(course.level, 100)}L`);
	return fallback ? [fallback] : [];
}

function isApprovedActiveCourse(course: Record<string, unknown>) {
	return (
		normalizeEnum(course.approvalStatus, COURSE_STATUSES, "Pending") ===
			"Approved" &&
		asString(course.status, "active") !== "archived"
	);
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

	async updateStatus(ctx: StrapiContext) {
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

		const payload = parseCourseStatusPayload(ctx.request.body);
		const course = await strapi.db.query("api::course.course").update({
			where: { id: existing.id },
			data: {
				approvalStatus: payload.status,
				approvalNote: payload.approvalNote,
			},
			populate: { department: true, college: true },
		});
		const action = payload.status === "Approved" ? "course.approved" : "course.rejected";

		await createAuditLog({
			collegeId: college.id,
			action,
			entityId: String(existing.id),
			summary: `${payload.status} course ${asString(existing.code)}`,
			metadata: {
				collegeSlug,
				courseId,
				code: asString(existing.code),
				approvalNote: payload.approvalNote,
			},
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

	async listTimetable(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Course timetable access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const college = await findCollegeBySlug(collegeSlug);

		if (!college?.id) {
			return ctx.notFound?.("College could not be found.") ?? ctx.badRequest("College could not be found.");
		}

		const slots = await strapi.db.query("api::course-timetable-slot.course-timetable-slot").findMany({
			where: { college: college.id, status: { $ne: "archived" } },
			populate: { course: true, college: true },
			orderBy: [{ day: "asc" }, { time: "asc" }, { level: "asc" }],
			limit: 1000,
		});
		const mappedSlots = (slots as Record<string, unknown>[]).map(mapTimetableSlot);

		ctx.body = {
			college: {
				id: college.id,
				name: college.name,
				slug: college.slug,
				code: college.code,
			},
			slots: mappedSlots,
			count: mappedSlots.length,
			generatedAt: new Date().toISOString(),
		};
	},

	async createTimetableSlot(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Course timetable access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const college = await findCollegeBySlug(collegeSlug);
		const payload = parseTimetablePayload(ctx.request.body);

		if (!college?.id || !payload.day || !payload.time || !payload.room || !payload.level) {
			return ctx.badRequest("College, course, day, time, room, and level are required.");
		}

		const course = (await findCourseForTimetable(
			{ courseId: payload.courseId, code: payload.code },
			college.id,
		)) as Record<string, unknown> | null;

		if (!course?.id) {
			return ctx.notFound?.("Course could not be found for this college.") ??
				ctx.badRequest("Course could not be found for this college.");
		}

		const storedLevel = mapTimetableLevelForStorage(payload.level);
		const duplicate = await strapi.db.query("api::course-timetable-slot.course-timetable-slot").findOne({
			where: {
				college: college.id,
				course: course.id,
				day: payload.day,
				time: payload.time,
				level: { $in: getTimetableLevelLookup(payload.level) },
				status: { $ne: "archived" },
			},
		});

		if (duplicate?.id) {
			return ctx.conflict?.("This course already has a matching timetable slot.") ??
				ctx.badRequest("This course already has a matching timetable slot.");
		}

		const slot = await strapi.db.query("api::course-timetable-slot.course-timetable-slot").create({
			data: {
				day: payload.day,
				time: payload.time,
				room: payload.room,
				mode: payload.mode,
				level: storedLevel,
				status: "active",
				college: college.id,
				course: course.id,
			},
			populate: { course: true, college: true },
		});

		await createAuditLog({
			collegeId: college.id,
			entityType: "course-timetable-slot",
			action: "course-timetable.created",
			entityId: String(slot.id),
			summary: `Created timetable slot for ${asString(course.code)}`,
			metadata: { collegeSlug, courseId: getCourseId(course), day: payload.day, time: payload.time, level: payload.level },
		});

		ctx.status = 201;
		ctx.body = { slot: mapTimetableSlot(slot as Record<string, unknown>) };
	},

	async updateTimetableSlot(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Course timetable access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const slotId = asString(ctx.params?.id);
		const college = await findCollegeBySlug(collegeSlug);
		const payload = parseTimetablePayload(ctx.request.body);

		if (!college?.id || !slotId || !payload.day || !payload.time || !payload.room || !payload.level) {
			return ctx.badRequest("College, timetable slot, course, day, time, room, and level are required.");
		}

		const existing = await findTimetableSlotForCollege(slotId, college.id);

		if (!existing?.id) {
			return ctx.notFound?.("Timetable slot could not be found for this college.") ??
				ctx.badRequest("Timetable slot could not be found for this college.");
		}

		const course = (await findCourseForTimetable(
			{ courseId: payload.courseId, code: payload.code },
			college.id,
		)) as Record<string, unknown> | null;

		if (!course?.id) {
			return ctx.notFound?.("Course could not be found for this college.") ??
				ctx.badRequest("Course could not be found for this college.");
		}

		const storedLevel = mapTimetableLevelForStorage(payload.level);
		const duplicate = await strapi.db.query("api::course-timetable-slot.course-timetable-slot").findOne({
			where: {
				college: college.id,
				course: course.id,
				day: payload.day,
				time: payload.time,
				level: { $in: getTimetableLevelLookup(payload.level) },
				status: { $ne: "archived" },
				id: { $ne: existing.id },
			},
		});

		if (duplicate?.id) {
			return ctx.conflict?.("This course already has a matching timetable slot.") ??
				ctx.badRequest("This course already has a matching timetable slot.");
		}

		const slot = await strapi.db.query("api::course-timetable-slot.course-timetable-slot").update({
			where: { id: existing.id },
			data: {
				day: payload.day,
				time: payload.time,
				room: payload.room,
				mode: payload.mode,
				level: storedLevel,
				course: course.id,
			},
			populate: { course: true, college: true },
		});

		await createAuditLog({
			collegeId: college.id,
			entityType: "course-timetable-slot",
			action: "course-timetable.updated",
			entityId: String(existing.id),
			summary: `Updated timetable slot for ${asString(course.code)}`,
			metadata: { collegeSlug, courseId: getCourseId(course), day: payload.day, time: payload.time, level: payload.level },
		});

		ctx.body = { slot: mapTimetableSlot(slot as Record<string, unknown>) };
	},

	async deleteTimetableSlot(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Course timetable access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const slotId = asString(ctx.params?.id);
		const college = await findCollegeBySlug(collegeSlug);

		if (!college?.id || !slotId) {
			return ctx.badRequest("College slug and timetable slot id are required.");
		}

		const existing = await findTimetableSlotForCollege(slotId, college.id);

		if (!existing?.id) {
			return ctx.notFound?.("Timetable slot could not be found for this college.") ??
				ctx.badRequest("Timetable slot could not be found for this college.");
		}

		await strapi.db.query("api::course-timetable-slot.course-timetable-slot").update({
			where: { id: existing.id },
			data: { status: "archived" },
		});

		await createAuditLog({
			collegeId: college.id,
			entityType: "course-timetable-slot",
			action: "course-timetable.deleted",
			entityId: String(existing.id),
			summary: `Deleted timetable slot ${slotId}`,
			metadata: { collegeSlug, slotId },
		});

		ctx.status = 204;
		ctx.body = null;
	},

	async createAllocation(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Course allocation access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const college = await findCollegeBySlug(collegeSlug);
		const payload = parseAllocationPayload(ctx.request.body);

		if (!college?.id || !payload.courseId || !payload.level) {
			return ctx.badRequest("College slug, course id, and level are required.");
		}

		const course = (await findCourseForCollege(
			payload.courseId,
			college.id,
		)) as Record<string, unknown> | null;

		if (!course?.id) {
			return ctx.notFound?.("Course could not be found for this college.") ??
				ctx.badRequest("Course could not be found for this college.");
		}

		if (!isApprovedActiveCourse(course)) {
			return ctx.badRequest("Only approved active courses can be allocated.");
		}

		const nextLevels = addLevel(getCourseLevels(course), payload.level);
		const updatedCourse = await updateCourseLevels(course, nextLevels);

		await createAuditLog({
			collegeId: college.id,
			action: "course-allocation.created",
			entityId: String(course.id),
			summary: `Allocated ${asString(course.code)} to ${payload.level}`,
			metadata: { collegeSlug, courseId: payload.courseId, level: payload.level },
		});

		ctx.status = 201;
		ctx.body = { course: mapCourse(updatedCourse as Record<string, unknown>) };
	},

	async updateAllocation(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Course allocation access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const college = await findCollegeBySlug(collegeSlug);
		const payload = parseAllocationPayload(ctx.request.body);

		if (
			!college?.id ||
			!payload.courseId ||
			!payload.level ||
			!payload.nextCourseId ||
			!payload.nextLevel
		) {
			return ctx.badRequest(
				"College slug, current allocation, and next allocation are required.",
			);
		}

		const currentCourse = (await findCourseForCollege(
			payload.courseId,
			college.id,
		)) as Record<string, unknown> | null;
		const nextCourse = (await findCourseForCollege(
			payload.nextCourseId,
			college.id,
		)) as Record<string, unknown> | null;

		if (!currentCourse?.id || !nextCourse?.id) {
			return ctx.notFound?.("Course allocation could not be found for this college.") ??
				ctx.badRequest("Course allocation could not be found for this college.");
		}

		const currentLevels = getCourseLevels(currentCourse);
		if (!currentLevels.includes(payload.level)) {
			return ctx.notFound?.("Course allocation could not be found.") ??
				ctx.badRequest("Course allocation could not be found.");
		}

		if (!isApprovedActiveCourse(nextCourse)) {
			return ctx.badRequest("Only approved active courses can be allocated.");
		}

		if (
			(payload.courseId !== payload.nextCourseId ||
				payload.level !== payload.nextLevel) &&
			getCourseLevels(nextCourse).includes(payload.nextLevel)
		) {
			return ctx.conflict?.("This allocation already exists.") ??
				ctx.badRequest("This allocation already exists.");
		}

		let updatedCurrentCourse: unknown = currentCourse;
		let updatedNextCourse: unknown = nextCourse;

		if (payload.courseId === payload.nextCourseId) {
			const nextLevels = addLevel(
				removeLevel(currentLevels, payload.level),
				payload.nextLevel,
			);
			updatedCurrentCourse = await updateCourseLevels(currentCourse, nextLevels);
			updatedNextCourse = updatedCurrentCourse;
		} else {
			updatedCurrentCourse = await updateCourseLevels(
				currentCourse,
				removeLevel(currentLevels, payload.level),
			);
			updatedNextCourse = await updateCourseLevels(
				nextCourse,
				addLevel(getCourseLevels(nextCourse), payload.nextLevel),
			);
		}

		await createAuditLog({
			collegeId: college.id,
			action: "course-allocation.updated",
			entityId: String(currentCourse.id),
			summary: `Moved allocation from ${asString(currentCourse.code)} ${payload.level} to ${asString(nextCourse.code)} ${payload.nextLevel}`,
			metadata: {
				collegeSlug,
				courseId: payload.courseId,
				level: payload.level,
				nextCourseId: payload.nextCourseId,
				nextLevel: payload.nextLevel,
			},
		});

		ctx.body = {
			courses: [
				mapCourse(updatedCurrentCourse as Record<string, unknown>),
				...(payload.courseId === payload.nextCourseId
					? []
					: [mapCourse(updatedNextCourse as Record<string, unknown>)]),
			],
		};
	},

	async deleteAllocation(ctx: StrapiContext) {
		if (!authorize(ctx)) {
			return ctx.unauthorized("Course allocation access is not authorized.");
		}

		const collegeSlug = asString(ctx.request.query?.collegeSlug);
		const college = await findCollegeBySlug(collegeSlug);
		const courseId = asString(ctx.request.query?.courseId);
		const level = normalizeLevel(ctx.request.query?.level);

		if (!college?.id || !courseId || !level) {
			return ctx.badRequest("College slug, course id, and level are required.");
		}

		const course = (await findCourseForCollege(
			courseId,
			college.id,
		)) as Record<string, unknown> | null;

		if (!course?.id) {
			return ctx.notFound?.("Course could not be found for this college.") ??
				ctx.badRequest("Course could not be found for this college.");
		}

		const currentLevels = getCourseLevels(course);
		if (!currentLevels.includes(level)) {
			return ctx.notFound?.("Course allocation could not be found.") ??
				ctx.badRequest("Course allocation could not be found.");
		}

		const updatedCourse = await updateCourseLevels(
			course,
			removeLevel(currentLevels, level),
		);

		await createAuditLog({
			collegeId: college.id,
			action: "course-allocation.deleted",
			entityId: String(course.id),
			summary: `Removed allocation ${asString(course.code)} from ${level}`,
			metadata: { collegeSlug, courseId, level },
		});

		ctx.body = { course: mapCourse(updatedCourse as Record<string, unknown>) };
	},
};
