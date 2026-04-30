@echo off
echo ========================================
echo  GoLite Community - Git Push Script
echo ========================================
echo.

REM Vérifier si git est initialisé
if not exist ".git" (
    echo Initialisation de Git...
    git init
    echo.
)

REM Ajouter tous les fichiers
echo Ajout des fichiers...
git add .
echo.

REM Demander le message de commit
set /p commit_msg="Message de commit (par defaut: 'Fix: Correction complete du projet'): "
if "%commit_msg%"=="" set commit_msg=Fix: Correction complete du projet

REM Faire le commit
echo Commit des changements...
git commit -m "%commit_msg%"
echo.

REM Demander l'URL du repository
set /p repo_url="URL du repository GitHub (ou Enter pour utiliser l'existant): "

REM Si une URL est fournie, configurer l'origin
if not "%repo_url%"=="" (
    echo Configuration du remote origin...
    git remote remove origin 2>nul
    git remote add origin %repo_url%
    echo.
)

REM Vérifier la branche
echo Verification de la branche...
git branch -M main
echo.

REM Push vers GitHub
echo Push vers GitHub...
git push -u origin main
echo.

echo ========================================
echo  Push termine avec succes!
echo ========================================
echo.
pause
