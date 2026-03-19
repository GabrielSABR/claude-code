@echo off
echo.
echo ========================================
echo   Salvando e enviando para o GitHub...
echo ========================================
echo.

cd /d "%~dp0"

git add .

set /p msg="Descricao do que voce fez hoje: "

git commit -m "%msg%"

git push

echo.
echo ========================================
echo   Pronto! Arquivos enviados com sucesso!
echo ========================================
echo.
pause
