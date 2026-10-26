@echo off
cd /d "%~dp0"
call npm --prefix frontend ci
if errorlevel 1 goto error
call npm run build
if errorlevel 1 goto error
echo Pagina actualizada. Sube los cambios a GitHub.
pause
exit /b 0
:error
echo No se completo la compilacion. Revisa el mensaje anterior.
pause
exit /b 1
