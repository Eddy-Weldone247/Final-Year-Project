/* Local development database: a zero-install embedded PostgreSQL on :5432.
   Keeps running until terminated. Data persists in backend/.localdb. */
const path = require('node:path');
const fs = require('node:fs');

const PgMod = require('embedded-postgres');
const EmbeddedPostgres = PgMod.default || PgMod;

const dataDir = path.join(__dirname, '.localdb');
const fresh = !fs.existsSync(dataDir);
const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'postgres',
  password: 'postgres',
  port: 5432,
  persistent: true,
});

async function main() {
  if (fresh) {
    await pg.initialise();
  }
  await pg.start();
  try {
    await pg.createDatabase('expensee');
  } catch {
    // database already exists
  }
  console.log('[localdb] PostgreSQL ready on postgresql://postgres:postgres@localhost:5432/expensee');
}

const shutdown = async () => {
  try {
    await pg.stop();
  } catch {
    // ignore
  }
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main()
  .then(() => setInterval(() => {}, 1 << 30))
  .catch((e) => {
    console.error('[localdb]', e);
    process.exit(1);
  });
