const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DoKRA8U9WzQq@ep-winter-haze-am26hwo3-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require",
});

async function main() {
  const result = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users'
    ORDER BY ordinal_position
  `);
  
  console.log("=== USERS TABLE SCHEMA ===");
  result.rows.forEach((row: { column_name: string; data_type: string }) => console.log(row.column_name, "-", row.data_type));
  
  await pool.end();
}

main().catch(console.error);