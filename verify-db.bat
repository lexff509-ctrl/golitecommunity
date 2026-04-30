@echo off
echo ==========================================
echo Verification de la base de donnees
echo ==========================================
echo.

npx tsx src/scripts/check-schema.ts

echo.
echo ==========================================
echo Appuyez sur une touche pour continuer...
pause >nul
