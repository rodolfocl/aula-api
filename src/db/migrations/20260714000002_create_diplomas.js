export async function up(knex) {
  await knex.schema.createTable('diplomas', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('enrollment_id').notNullable().references('id').inTable('enrollments').onDelete('CASCADE');
    t.text('drive_file_id');
    t.text('drive_url');
    t.timestamp('generated_at').defaultTo(knex.fn.now());
    t.unique(['enrollment_id']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('diplomas');
}
