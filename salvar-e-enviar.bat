@echo off
echo.
echo ========================================
echo   Salvando tudo na pasta...
echo ========================================
echo.

cd /d "C:\Users\alves\OneDrive\Documentos\Claude Code"

:: Converte todas as conversas para markdown legivel
powershell -ExecutionPolicy Bypass -File "%~dp0converter-conversas.ps1"

git add .

set /p msg="Descricao do que voce fez hoje: "

git commit -m "%msg%"

git push

echo.
echo ========================================
echo   Pronto! Tudo salvo e enviado!
echo ========================================
echo.
pause
