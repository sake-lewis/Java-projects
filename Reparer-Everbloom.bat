@echo off
title Reparation d'EVERBLOOM Catalogues
cd /d "%~dp0"
echo ==================================================
echo   EVERBLOOM - Reparation de l'installation
echo ==================================================
echo.
echo Cette operation reinstalle proprement les dependances
echo (quelques minutes selon ta connexion).
echo.
echo IMPORTANT : ferme d'abord toutes les fenetres Everbloom
echo ouvertes, sinon des fichiers restent verrouilles.
echo.
pause
echo.

rem --- 1. Arreter les serveurs Node encore actifs ---
echo [1/5] Arret des serveurs Node encore actifs...
taskkill /F /IM node.exe >nul 2>nul

rem --- 2. Supprimer l'ancienne installation ---
echo [2/5] Suppression de l'ancien dossier node_modules...
if exist node_modules rmdir /s /q node_modules
if exist .next rmdir /s /q .next

rem --- 3. Vider le cache npm (c'est lui qui a servi la mauvaise version) ---
echo [3/5] Nettoyage du cache npm...
call npm cache clean --force

rem --- 4. Reinstallation exacte d'apres package-lock.json ---
echo [4/5] Reinstallation des dependances...
call npm ci
if errorlevel 1 (
  echo.
  echo npm ci a echoue, nouvelle tentative avec npm install...
  call npm install
)

rem --- 5. Verification ---
echo.
echo [5/5] Verification de la version de Next.js installee :
call npx next --version
echo.
echo ==================================================
echo   Si la ligne ci-dessus affiche 16.x : c'est bon.
echo   Si elle affiche 9.x ou une erreur : previens-moi.
echo ==================================================
echo.
pause
