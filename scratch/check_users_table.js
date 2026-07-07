import db from '../db.js';

async function run() {
  try {
    console.log('Querying schema of users table...');
    const schemaRes = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users'
    `);
    console.table(schemaRes.recordset);

    console.log('Querying all rows in users...');
    const dataRes = await db.query(`SELECT * FROM dbo.users`);
    console.table(dataRes.recordset);

    process.exit(0);
  } catch (err) {
    console.error('QUERY FAILED:', err);
    process.exit(1);
  }
}

run();
