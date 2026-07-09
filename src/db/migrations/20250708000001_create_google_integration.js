export async function up(knex) {
  await knex.schema.createTable('google_integration', (t) => {
    t.increments('id').primary();
    t.text('refresh_token_encrypted').notNullable();
    t.string('connected_email').notNullable();
    t.timestamp('connected_at').notNullable().defaultTo(knex.fn.now());
    t.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('google_integration');
}
