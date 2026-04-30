@echo off
cls
echo ========================================
echo   MIGRATION SECURISEE - GOLITE
echo ========================================
echo.
echo ATTENTION: Cette migration est SAFE
echo - Aucune suppression de donnees
echo - Uniquement des AJOUTS
echo - Rollback possible
echo.
echo ========================================
pause
echo.

echo [1/5] Verification de l'environnement...
if not exist "migrations\SAFE_MIGRATION.sql" (
    echo ERREUR: Fichier migrations\SAFE_MIGRATION.sql introuvable
    pause
    exit /b 1
)
echo OK - Fichier de migration present
echo.

echo [2/5] Verification de la connexion DATABASE_URL...
if not defined DATABASE_URL (
    echo ERREUR: DATABASE_URL non definie
    echo.
    echo Definissez DATABASE_URL dans votre environnement:
    echo set DATABASE_URL=postgresql://user:password@host:port/database
    echo.
    pause
    exit /b 1
)
echo OK - DATABASE_URL definie
echo.

echo [3/5] SAUVEGARDE RECOMMANDEE
echo.
echo Avant de continuer, assurez-vous d'avoir fait une sauvegarde:
echo   pg_dump -U user -d database ^> backup.sql
echo.
set /p backup="Avez-vous fait une sauvegarde ? (O/N): "
if /i not "%backup%"=="O" (
    echo.
    echo Migration annulee. Faites d'abord une sauvegarde !
    pause
    exit /b 0
)
echo.

echo [4/5] APPLICATION DE LA MIGRATION...
echo.
echo Execution de migrations\SAFE_MIGRATION.sql...
echo.

psql %DATABASE_URL% -f migrations\SAFE_MIGRATION.sql

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo   ERREUR LORS DE LA MIGRATION
    echo ========================================
    echo.
    echo Verifiez:
    echo - Votre connexion DATABASE_URL
    echo - Les permissions de votre utilisateur
    echo - Les logs d'erreur ci-dessus
    echo.
    echo Vos donnees sont INTACTES (la transaction a ete annulee)
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   MIGRATION APPLIQUEE AVEC SUCCES
echo ========================================
echo.

echo [5/5] VERIFICATION POST-MIGRATION...
echo.
echo Verification du schema...
call npx tsx src/scripts/check-schema.ts
echo.

echo ========================================
echo   MIGRATION TERMINEE
echo ========================================
echo.
echo Prochaines etapes:
echo 1. Tester l'application: npm run dev
echo 2. Verifier la connexion
echo 3. Verifier que les donnees sont intactes
echo.
echo En cas de probleme, restaurez la sauvegarde:
echo   psql %%DATABASE_URL%% ^< backup.sql
echo.
pause
