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

async function hasColumns(knex, db, tableName, columns) {
  for (const column of columns) {
    if (!(await schemaBuilder(knex, db).hasColumn(tableName, column))) {
      return false;
    }
  }

  return true;
}

function qualifiedTableName(knex, db, name) {
  const schema = db.getSchemaName?.();
  if (!schema || knex.client.config.client === 'sqlite') {
    return name;
  }

  return `${schema}.${name}`;
}

async function dropActiveStudentIndex(knex, db) {
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

  try {
    await schemaBuilder(knex, db).alterTable(HOSTEL_ALLOCATIONS_TABLE, (table) => {
      table.dropIndex(['student_identifier', 'status'], ACTIVE_STUDENT_ALLOCATION_INDEX);
    });
  } catch (error) {
    if (!String(error).includes(ACTIVE_STUDENT_ALLOCATION_INDEX)) {
      throw error;
    }
  }
}

module.exports = {
  async up(knex, db) {
    if (
      !(await hasTable(knex, db, HOSTEL_ALLOCATIONS_TABLE)) ||
      !(await hasColumns(knex, db, HOSTEL_ALLOCATIONS_TABLE, [
        'college_id',
        'student_identifier',
        'status',
      ]))
    ) {
      return;
    }

    const client = knex.client.config.client;
    const tableName = qualifiedTableName(knex, db, HOSTEL_ALLOCATIONS_TABLE);

    await dropActiveStudentIndex(knex, db);

    if (client === 'pg' || client === 'postgres' || client === 'sqlite') {
      await knex.raw(
        `
          CREATE UNIQUE INDEX IF NOT EXISTS ?? ON ??
            (college_id, LOWER(student_identifier))
          WHERE college_id IS NOT NULL
            AND student_identifier IS NOT NULL
            AND status IN ('reserved', 'allocated')
        `,
        [ACTIVE_STUDENT_ALLOCATION_INDEX, tableName],
      );
      return;
    }

    await knex.raw('CREATE INDEX ?? ON ?? (college_id, student_identifier, status)', [
      ACTIVE_STUDENT_ALLOCATION_INDEX,
      tableName,
    ]);
  },

  async down(knex, db) {
    if (!(await hasTable(knex, db, HOSTEL_ALLOCATIONS_TABLE))) {
      return;
    }

    const client = knex.client.config.client;
    const tableName = qualifiedTableName(knex, db, HOSTEL_ALLOCATIONS_TABLE);

    await dropActiveStudentIndex(knex, db);

    if (
      (client === 'pg' || client === 'postgres' || client === 'sqlite') &&
      (await hasColumns(knex, db, HOSTEL_ALLOCATIONS_TABLE, [
        'student_identifier',
        'status',
      ]))
    ) {
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

    if (await hasColumns(knex, db, HOSTEL_ALLOCATIONS_TABLE, [
      'student_identifier',
      'status',
    ])) {
      await knex.raw('CREATE INDEX ?? ON ?? (student_identifier, status)', [
        ACTIVE_STUDENT_ALLOCATION_INDEX,
        tableName,
      ]);
    }
  },
};
