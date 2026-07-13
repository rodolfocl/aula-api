export async function up(knex) {
  await knex.schema.alterTable('courses', (t) => {
    t.string('drive_folder_id').nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('courses', (t) => {
    t.dropColumn('drive_folder_id');
  });
}