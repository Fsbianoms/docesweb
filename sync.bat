@echo off
echo Sincronizando dados da planilha Excel...
.\.venv\Scripts\python.exe parse_data.py
if %ERRORLEVEL% EQU 0 (
    echo [OK] Dados atualizados com sucesso! O site agora reflete sua planilha.
) else (
    echo [ERRO] Ocorreu um erro ao ler o Excel. Verifique se o arquivo esta aberto ou se o nome mudou.
)
pause
