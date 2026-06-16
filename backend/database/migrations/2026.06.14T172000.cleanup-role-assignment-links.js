'use strict';

const LINK_CLEANUPS = [
  ['role_assignments_user_lnk', 'role_assignment_id', 'role_assignments'],
  ['role_assignments_user_lnk', 'user_id', 'up_users'],
  ['role_assignments_role_lnk', 'role_assignment_id', 'role_assignments'],
  ['role_assignments_role_lnk', 'role_id', 'portal_roles'],
  ['role_assignments_role_lnk', 'portal_role_id', 'portal_roles'],
  ['role_assignments_college_lnk', 'role_assignment_id', 'role_assignments'],
  ['role_assignments_college_lnk', 'college_id', 'colleges'],
  ['role_assignments_faculty_lnk', 'role_assignment_id', 'role_assignments'],
  ['role_assignments_faculty_lnk', 'faculty_id', 'faculties'],
  ['role_assignments_department_lnk', 'role_assignment_id', 'role_assignments'],
  ['role_assignments_department_lnk', 'department_id', 'departments'],
  ['role_assignments_course_lnk', 'role_assignment_id', 'role_assignments'],
  ['role_assignments_course_lnk', 'course_id', 'courses'],
];

const table = (knex, db, tableName) => {
  const schema = db.getSchemaName?.();
  const query = knex(tableName);
  return schema ? query.withSchema(schema) : query;
};

const schemaBuilder = (knex, db) => {
  const schema = db.getSchemaName?.();
  return schema ? knex.schema.withSchema(schema) : knex.schema;
};

async function hasTable(knex, db, tableName) {
  return schemaBuilder(knex, db).hasTable(tableName);
}

async function hasColumn(knex, db, tableName, columnName) {
  if (!(await hasTable(knex, db, tableName))) {
    return false;
  }

  const columns = await table(knex, db, tableName).columnInfo();
  return Object.prototype.hasOwnProperty.call(columns, columnName);
}

async function deleteOrphanedLinks(knex, db, linkTable, columnName, targetTable) {
  if (
    !(await hasColumn(knex, db, linkTable, columnName)) ||
    !(await hasTable(knex, db, targetTable))
  ) {
    return;
  }

  await table(knex, db, linkTable).whereNull(columnName).delete();
  await table(knex, db, linkTable)
    .whereNotIn(columnName, table(knex, db, targetTable).select('id'))
    .delete();
}

module.exports = {
  async up(knex, db) {
    for (const [linkTable, columnName, targetTable] of LINK_CLEANUPS) {
      await deleteOrphanedLinks(knex, db, linkTable, columnName, targetTable);
    }
  },

  async down() {},
};
