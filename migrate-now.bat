@echo off
cls
echo ========================================
echo   MIGRATION IMMEDIATE - GOLITE
echo ========================================
echo.
echo Cette migration va:
echo - Ajouter les nouvelles tables et colonnes
echo - Preserver TOUTES vos donnees existantes
echo - Copier automatiquement les donnees
echo.
echo DATABASE: Neon PostgreSQL
echo HOST: ep-winter-haze-am26hwo3-pooler.c-5.us-east-1.aws.neon.tech
echo.
echo ========================================
echo.
echo IMPORTANT: Avez-vous fait une sauvegarde ? (O/N)
set /p backup="Reponse: "

if /i not "%backup%"=="O" (
    echo.
    echo ========================================
    echo   SAUVEGARDE REQUISE
    echo ========================================
    echo.
    echo Pour sauvegarder via Neon Console:
    echo 1. Allez sur https://console.neon.tech
    echo 2. Selectionnez votre projet
    echo 3. Onglet "Backups" ou "Settings"
    echo 4. Cliquez sur "Create backup"
    echo.
    echo OU exportez via pgAdmin si vous l'avez installe.
    echo.
    pause
    exit /b 0
)

echo.
echo ========================================
echo   APPLICATION DE LA MIGRATION
echo ========================================
echo.

REM Definir la DATABASE_URL
set DATABASE_URL=postgresql://neondb_owner:npg_DoKRA8U9WzQq@ep-winter-haze-am26hwo3-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require

REM Verifier psql
where psql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ATTENTION: psql n'est pas installe ou pas dans le PATH
    echo.
    echo OPTIONS:
    echo.
    echo 1. INSTALLER PostgreSQL CLIENT:
    echo    - Telechargez depuis: https://www.postgresql.org/download/windows/
    echo    - OU installez via Chocolatey: choco install postgresql
    echo.
    echo 2. UTILISER NEON SQL EDITOR:
    echo    - Allez sur https://console.neon.tech
    echo    - Selectionnez votre base de donnees
    echo    - Onglet "SQL Editor"
    echo    - Copiez/collez le contenu de: migrations\SAFE_MIGRATION.sql
    echo    - Cliquez "Run"
    echo.
    echo 3. UTILISER pgAdmin (si installe):
    echo    - Ouvrez pgAdmin
    echo    - Connectez-vous a votre serveur Neon
    echo    - Query Tool ^> Open File ^> migrations\SAFE_MIGRATION.sql
    echo    - Execute (F5)
    echo.
    pause
    exit /b 1
)

echo Execution de la migration avec psql...
echo.
psql "%DATABASE_URL%" -f migrations\SAFE_MIGRATION.sql

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo   ERREUR LORS DE LA MIGRATION
    echo ========================================
    echo.
    echo Verifiez les erreurs ci-dessus.
    echo.
    echo SOLUTIONS:
    echo 1. Verifiez votre connexion internet
    echo 2. Verifiez que le mot de passe n'a pas change
    echo 3. Essayez via Neon SQL Editor (voir instructions ci-dessus)
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   MIGRATION REUSSIE
echo ========================================
echo.
echo Verification du schema...
call npx tsx src/scripts/check-schema.ts
echo.

echo ========================================
echo   PROCHAINES ETAPES
echo ========================================
echo.
echo 1. Testez l'application:
echo    npm run dev
echo.
echo 2. Verifiez la connexion avec un utilisateur existant
echo.
echo 3. Verifiez que le compte a rebours est visible
echo.
echo 4. Verifiez que vos donnees sont intactes
echo.
pause
