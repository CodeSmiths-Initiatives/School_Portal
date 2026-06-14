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

function qualifiedName(knex, db, name) {
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
    const indexName = qualifiedName(knex, db, ACTIVE_STUDENT_ALLOCATION_INDEX);
    const tableName = qualifiedName(knex, db, HOSTEL_ALLOCATIONS_TABLE);

    if (client === 'pg' || client === 'postgres' || client === 'sqlite') {
      await knex.raw(
        `
          CREATE UNIQUE INDEX IF NOT EXISTS ?? ON ??
            (LOWER(student_identifier))
          WHERE student_identifier IS NOT NULL
            AND status IN ('reserved', 'allocated')
        `,
        [indexName, tableName],
      );
      return;
    }

    if (client === 'mysql' || client === 'mysql2') {
      await knex.raw(
        'CREATE INDEX ?? ON ?? (student_identifier, status)',
        [indexName, tableName],
      );
      return;
    }

    await knex.raw(
      'CREATE INDEX ?? ON ?? (student_identifier, status)',
      [indexName, tableName],
    );
  },

  async down(knex, db) {
    if (!(await hasTable(knex, db, HOSTEL_ALLOCATIONS_TABLE))) {
      return;
    }

    const client = knex.client.config.client;

    if (client === 'pg' || client === 'postgres') {
      await knex.raw('DROP INDEX IF EXISTS ??', [
        qualifiedName(knex, db, ACTIVE_STUDENT_ALLOCATION_INDEX),
      ]);
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
