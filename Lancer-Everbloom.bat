@echo off
title EVERBLOOM Catalogues
cd /d "%~dp0"
if not exist node_modules (
  echo Premiere utilisation : installation des dependances, patiente...
  call npm install
)
echo Demarrage d'Everbloom... le navigateur va s'ouvrir automatiquement.
start "" /min cmd /c "timeout /t 6 >nul & start http://localhost:3000"
call npm run dev
