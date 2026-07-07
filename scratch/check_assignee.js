import db from '../db.js';

async function run() {
  try {
    console.log('Querying sample assignee group values from xSummary...');
    const res = await db.query(`
      SELECT TOP 5 Servername, PrimaryAssigneeGroup, PrimaryAssigneeManagerName, PrimaryAssigneeGroupEmail 
      FROM dbo.xSummary 
      WHERE PrimaryAssigneeGroup IS NOT NULL AND PrimaryAssigneeGroup <> ''
    `);
    
    console.log('Querying all support_groups entries...');
    const groups = await db.query("SELECT * FROM dbo.support_groups");

    console.log('--------------------------------------------------');
    console.log('xSummary values:');
    console.log(JSON.stringify(res.recordset, null, 2));
    console.log('Support Groups:');
    console.log(JSON.stringify(groups.recordset, null, 2));
    console.log('--------------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('QUERY FAILED:', err);
    process.exit(1);
  }
}

run();
