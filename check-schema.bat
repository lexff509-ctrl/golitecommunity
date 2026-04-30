@echo off
set DATABASE_URL=postgresql://neondb_owner:npg_DoKRA8U9WzQq@ep-winter-haze-am26hwo3-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require
cd /d c:\Users\ronal\Golitecommunity
node --loader tsx src\scripts\check-schema.ts