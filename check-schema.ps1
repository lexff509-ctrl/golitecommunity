$env:DATABASE_URL = "postgresql://neondb_owner:npg_DoKRA8U9WzQq@ep-winter-haze-am26hwo3-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"
Set-Location "c:\Users\ronal\Golitecommunity"

# Check users table schema
$query = @"
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;
"@

npx tsx -e "
import { pool } from './src/db/index.ts';
const result = await pool.query(`$query`);
console.log('=== USERS TABLE SCHEMA ===');
result.rows.forEach(row => console.log(row.column_name, '-', row.data_type));
"