@echo off
echo ========================================
echo   CONFIGURATION DATABASE_URL
echo ========================================
echo.
echo Votre DATABASE_URL:
echo postgresql://neondb_owner:npg_DoKRA8U9WzQq@ep-winter-haze-am26hwo3-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require
echo.
echo Cette variable sera definie pour cette session uniquement.
echo.
pause

set DATABASE_URL=postgresql://neondb_owner:npg_DoKRA8U9WzQq@ep-winter-haze-am26hwo3-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require

echo.
echo ========================================
echo   DATABASE_URL DEFINIE
echo ========================================
echo.
echo Vous pouvez maintenant executer:
echo   apply-safe-migration.bat
echo.
echo OU directement:
echo   psql "%DATABASE_URL%" -f migrations\SAFE_MIGRATION.sql
echo.
pause

REM Lancer directement la migration
echo.
echo Voulez-vous appliquer la migration maintenant ? (O/N)
set /p apply="Reponse: "

if /i "%apply%"=="O" (
    echo.
    echo Application de la migration...
    call apply-safe-migration.bat
) else (
    echo.
    echo Migration annulee. Pour l'appliquer plus tard:
    echo 1. Ouvrez une nouvelle console
    echo 2. Tapez: set DATABASE_URL=postgresql://neondb_owner:npg_DoKRA8U9WzQq@ep-winter-haze-am26hwo3-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require
    echo 3. Puis: apply-safe-migration.bat
    echo.
)

pause
