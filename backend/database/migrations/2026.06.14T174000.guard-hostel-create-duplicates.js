'use strict';

const HOSTELS_TABLE = 'hostels';
const HOSTEL_ROOMS_TABLE = 'hostel_rooms';
const HOSTEL_CODE_INDEX = 'hostels_active_college_code_uidx';
const HOSTEL_ROOM_INDEX = 'hostel_rooms_active_hostel_number_uidx';

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

async function hasDuplicateHostels(knex, db) {
  const rows = await knex(qualifiedTableName(knex, db, HOSTELS_TABLE))
    .select('college_id')
    .whereNot('status', 'archived')
    .whereNotNull('college_id')
    .whereNotNull('code')
    .groupBy('college_id')
    .groupByRaw('LOWER(code)')
    .havingRaw('COUNT(*) > 1')
    .limit(1);

  return rows.length > 0;
}

async function hasDuplicateRooms(knex, db) {
  const rows = await knex(qualifiedTableName(knex, db, HOSTEL_ROOMS_TABLE))
    .select('college_id', 'hostel_id')
    .whereNot('status', 'archived')
    .whereNotNull('college_id')
    .whereNotNull('hostel_id')
    .whereNotNull('room_number')
    .groupBy('college_id')
    .groupBy('hostel_id')
    .groupByRaw('LOWER(room_number)')
    .havingRaw('COUNT(*) > 1')
    .limit(1);

  return rows.length > 0;
}

module.exports = {
  async up(knex, db) {
    const client = knex.client.config.client;

    if (
      (client === 'pg' || client === 'postgres' || client === 'sqlite') &&
      (await hasTable(knex, db, HOSTELS_TABLE)) &&
      (await hasColumns(knex, db, HOSTELS_TABLE, ['college_id', 'code', 'status'])) &&
      !(await hasDuplicateHostels(knex, db))
    ) {
      await knex.raw(
        `
          CREATE UNIQUE INDEX IF NOT EXISTS ?? ON ??
            (college_id, LOWER(code))
          WHERE college_id IS NOT NULL
            AND code IS NOT NULL
            AND status <> 'archived'
        `,
        [HOSTEL_CODE_INDEX, qualifiedTableName(knex, db, HOSTELS_TABLE)],
      );
    }

    if (
      (client === 'pg' || client === 'postgres' || client === 'sqlite') &&
      (await hasTable(knex, db, HOSTEL_ROOMS_TABLE)) &&
      (await hasColumns(knex, db, HOSTEL_ROOMS_TABLE, [
        'college_id',
        'hostel_id',
        'room_number',
        'status',
      ])) &&
      !(await hasDuplicateRooms(knex, db))
    ) {
      await knex.raw(
        `
          CREATE UNIQUE INDEX IF NOT EXISTS ?? ON ??
            (college_id, hostel_id, LOWER(room_number))
          WHERE college_id IS NOT NULL
            AND hostel_id IS NOT NULL
            AND room_number IS NOT NULL
            AND status <> 'archived'
        `,
        [HOSTEL_ROOM_INDEX, qualifiedTableName(knex, db, HOSTEL_ROOMS_TABLE)],
      );
    }

    if (client === 'mysql' || client === 'mysql2') {
      if (
        (await hasTable(knex, db, HOSTELS_TABLE)) &&
        (await hasColumns(knex, db, HOSTELS_TABLE, ['college_id', 'code', 'status']))
      ) {
        await knex.raw('CREATE INDEX ?? ON ?? (college_id, code, status)', [
          HOSTEL_CODE_INDEX,
          qualifiedTableName(knex, db, HOSTELS_TABLE),
        ]);
      }

      if (
        (await hasTable(knex, db, HOSTEL_ROOMS_TABLE)) &&
        (await hasColumns(knex, db, HOSTEL_ROOMS_TABLE, [
          'college_id',
          'hostel_id',
          'room_number',
          'status',
        ]))
      ) {
        await knex.raw('CREATE INDEX ?? ON ?? (college_id, hostel_id, room_number, status)', [
          HOSTEL_ROOM_INDEX,
          qualifiedTableName(knex, db, HOSTEL_ROOMS_TABLE),
        ]);
      }
    }
  },

  async down(knex, db) {
    const client = knex.client.config.client;

    if (client === 'pg' || client === 'postgres') {
      const schema = db.getSchemaName?.();
      const hostelIndexName = schema ? `${schema}.${HOSTEL_CODE_INDEX}` : HOSTEL_CODE_INDEX;
      const roomIndexName = schema ? `${schema}.${HOSTEL_ROOM_INDEX}` : HOSTEL_ROOM_INDEX;

      await knex.raw('DROP INDEX IF EXISTS ??', [hostelIndexName]);
      await knex.raw('DROP INDEX IF EXISTS ??', [roomIndexName]);
      return;
    }

    if (client === 'sqlite') {
      await knex.raw('DROP INDEX IF EXISTS ??', [HOSTEL_CODE_INDEX]);
      await knex.raw('DROP INDEX IF EXISTS ??', [HOSTEL_ROOM_INDEX]);
      return;
    }

    if (await hasTable(knex, db, HOSTELS_TABLE)) {
      await schemaBuilder(knex, db).alterTable(HOSTELS_TABLE, (table) => {
        table.dropIndex(['college_id', 'code', 'status'], HOSTEL_CODE_INDEX);
      });
    }

    if (await hasTable(knex, db, HOSTEL_ROOMS_TABLE)) {
      await schemaBuilder(knex, db).alterTable(HOSTEL_ROOMS_TABLE, (table) => {
        table.dropIndex(
          ['college_id', 'hostel_id', 'room_number', 'status'],
          HOSTEL_ROOM_INDEX,
        );
      });
    }
  },
};
