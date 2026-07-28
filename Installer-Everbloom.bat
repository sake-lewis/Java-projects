@echo off
title Installation d'EVERBLOOM Catalogues
cd /d "%~dp0"
echo ============================================
echo   EVERBLOOM Catalogues - Installation
echo ============================================
echo.
rem --- 1. Verifier Node.js ---
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js n'est pas installe sur ce PC.
  echo Tentative d'installation automatique via winget...
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
  if errorlevel 1 (
    echo.
    echo Installation automatique impossible. La page de telechargement va s'ouvrir :
    echo installe Node.js LTS puis relance Installer-Everbloom.bat
    start https://nodejs.org/fr
    pause
    exit /b 1
  )
  echo.
  echo Node.js installe. FERME cette fenetre et RELANCE Installer-Everbloom.bat
  pause
  exit /b 0
)
echo [1/3] Node.js : OK
rem --- 2. Dependances ---
if not exist node_modules (
  echo [2/3] Installation des dependances (quelques minutes la premiere fois)...
  call npm install
) else (
  echo [2/3] Dependances : OK
)
rem --- 3. Raccourci bureau ---
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop')+'\Everbloom.lnk');$s.TargetPath='%~dp0Lancer-Everbloom.bat';$s.WorkingDirectory='%~dp0';$s.IconLocation='%~dp0everbloom.ico';$s.Description='EVERBLOOM Catalogues';$s.Save()"
echo [3/3] Raccourci 'Everbloom' cree sur le Bureau.
echo.
echo Installation terminee ! Lancement...
start "" "%~dp0Lancer-Everbloom.bat"
exit /b 0
