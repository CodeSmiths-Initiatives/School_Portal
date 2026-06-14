'use strict';

const HOSTEL_ALLOCATIONS_TABLE = 'hostel_allocations';
const ACTIVE_STUDENT_ALLOCATION_INDEX = 'hostel_allocations_active_student_uidx';

const schemaBuilder = (knex, db) => {
  const schema = db.getSchemaName?.();
  return schema ? knex.schema.withSchema(schema) : knex.schema;
};

async function hasTable(knex, db, tableName) {
  return schemaBuilder(knex, db).hasTable(tableName);
}

function qualifiedTableName(knex, db, name) {
  const schema = db.getSchemaName?.();
  if (!schema || knex.client.config.client === 'sqlite') {
    return name;
  }

  return `${schema}.${name}`;
}

module.exports = {
  async up(knex, db) {
    if (!(await hasTable(knex, db, HOSTEL_ALLOCATIONS_TABLE))) {
      return;
    }

    const client = knex.client.config.client;
    const tableName = qualifiedTableName(knex, db, HOSTEL_ALLOCATIONS_TABLE);

    if (client === 'pg' || client === 'postgres' || client === 'sqlite') {
      await knex.raw(
        `
          CREATE UNIQUE INDEX IF NOT EXISTS ?? ON ??
            (LOWER(student_identifier))
          WHERE student_identifier IS NOT NULL
            AND status IN ('reserved', 'allocated')
        `,
        [ACTIVE_STUDENT_ALLOCATION_INDEX, tableName],
      );
      return;
    }

    if (client === 'mysql' || client === 'mysql2') {
      await knex.raw(
        'CREATE INDEX ?? ON ?? (student_identifier, status)',
        [ACTIVE_STUDENT_ALLOCATION_INDEX, tableName],
      );
      return;
    }

    await knex.raw(
      'CREATE INDEX ?? ON ?? (student_identifier, status)',
      [ACTIVE_STUDENT_ALLOCATION_INDEX, tableName],
    );
  },

  async down(knex, db) {
    if (!(await hasTable(knex, db, HOSTEL_ALLOCATIONS_TABLE))) {
      return;
    }

    const client = knex.client.config.client;

    if (client === 'pg' || client === 'postgres') {
      const schema = db.getSchemaName?.();
      const indexName = schema
        ? `${schema}.${ACTIVE_STUDENT_ALLOCATION_INDEX}`
        : ACTIVE_STUDENT_ALLOCATION_INDEX;

      await knex.raw('DROP INDEX IF EXISTS ??', [indexName]);
      return;
    }

    if (client === 'sqlite') {
      await knex.raw('DROP INDEX IF EXISTS ??', [ACTIVE_STUDENT_ALLOCATION_INDEX]);
      return;
    }

    await schemaBuilder(knex, db).alterTable(HOSTEL_ALLOCATIONS_TABLE, (table) => {
      table.dropIndex(['student_identifier', 'status'], ACTIVE_STUDENT_ALLOCATION_INDEX);
    });
  },
};
