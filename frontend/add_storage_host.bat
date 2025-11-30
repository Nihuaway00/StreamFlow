@echo off
set HOSTS_FILE=%SystemRoot%\System32\drivers\etc\hosts

echo Проверка существующей записи...
findstr /C:"storage" "%HOSTS_FILE%" >nul
if %ERRORLEVEL%==0 (
    echo Запись уже существует.
    pause
    exit /b
)

echo Добавляю запись...
echo 127.0.0.1    storage>>"%HOSTS_FILE%"

echo Готово!
pause
