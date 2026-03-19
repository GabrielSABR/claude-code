@echo off
echo.
echo ========================================
echo   Salvando tudo na pasta...
echo ========================================
echo.

cd /d "C:\Users\alves\OneDrive\Documentos\Claude Code"

:: Copia historico de conversas do Claude Code
if not exist "conversas" mkdir "conversas"
xcopy /Y /Q "C:\Users\alves\.claude\projects\C--Users-alves-OneDrive-Documentos-Claude-Code\*" "conversas\" 2>nul

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
