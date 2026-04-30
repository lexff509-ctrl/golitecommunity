@echo off
cls
echo ========================================
echo   DIAGNOSTIC GOLITE COMMUNITY
echo ========================================
echo.
echo Verification de l'etat du projet...
echo.

echo [1/4] Verification de Node.js...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR: Node.js n'est pas installe
    pause
    exit /b 1
)
echo OK
echo.

echo [2/4] Verification des dependances...
if not exist "node_modules" (
    echo ATTENTION: node_modules manquant
    echo Installation des dependances...
    call npm install
)
echo OK
echo.

echo [3/4] Verification TypeScript...
call npm run typecheck
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR: Problemes TypeScript detectes
) else (
    echo OK - Aucune erreur TypeScript
)
echo.

echo [4/4] Verification du schema de la base de donnees...
echo.
call npx tsx src/scripts/check-schema.ts
echo.

echo ========================================
echo   DIAGNOSTIC TERMINE
echo ========================================
echo.
echo Consultez URGENT-FIX.md pour les solutions
echo.
pause
