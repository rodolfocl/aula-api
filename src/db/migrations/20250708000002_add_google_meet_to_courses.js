export async function up(knex) {
  await knex.schema.alterTable('courses', (t) => {
    t.string('google_event_id').nullable();
    t.string('google_meet_link').nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('courses', (t) => {
    t.dropColumn('google_event_id');
    t.dropColumn('google_meet_link');
  });
}
