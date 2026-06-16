'use strict';

const LINK_TABLE = 'audit_logs_actor_lnk';
const AUDIT_LOGS_TABLE = 'audit_logs';
const USERS_TABLE = 'up_users';

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

async function deleteOrphanedLinks(knex, db, columnName, targetTable) {
  if (
    !(await hasColumn(knex, db, LINK_TABLE, columnName)) ||
    !(await hasTable(knex, db, targetTable))
  ) {
    return;
  }

  await table(knex, db, LINK_TABLE).whereNull(columnName).delete();
  await table(knex, db, LINK_TABLE)
    .whereNotIn(columnName, table(knex, db, targetTable).select('id'))
    .delete();
}

module.exports = {
  async up(knex, db) {
    await deleteOrphanedLinks(knex, db, 'audit_log_id', AUDIT_LOGS_TABLE);
    await deleteOrphanedLinks(knex, db, 'user_id', USERS_TABLE);
    await deleteOrphanedLinks(knex, db, 'actor_id', USERS_TABLE);
  },

  async down() {},
};
