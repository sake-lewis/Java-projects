@echo off
title EVERBLOOM Catalogues
cd /d "%~dp0"

if not exist node_modules (
  echo Premiere utilisation : installation des dependances, patiente...
  call npm install
)

echo ==================================================
echo   Demarrage d'EVERBLOOM Catalogues
echo ==================================================
echo.
echo Le navigateur va s'ouvrir automatiquement.
echo NE FERME PAS cette fenetre : elle fait tourner l'application.
echo.
start "" /min cmd /c "timeout /t 8 >nul & start http://localhost:3000"
call npm run dev

rem On n'arrive ici que si le serveur s'est arrete (volontairement ou sur erreur).
echo.
echo ==================================================
echo   Le serveur Everbloom s'est arrete.
echo ==================================================
echo.
echo Si des messages d'erreur apparaissent au-dessus, lis les
echo dernieres lignes : elles disent ce qui bloque.
echo Dans le doute, lance Reparer-Everbloom.bat puis reessaie.
echo.
pause
