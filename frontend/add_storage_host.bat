@echo off

REM Проверка прав администратора
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Требуются права администратора!
    echo Запустите от имени администратора
    pause
    exit /b 1
)

set HOSTS_FILE=%SystemRoot%\System32\drivers\etc\hosts

echo Проверка существующей записи storage...
findstr /C:"storage" "%HOSTS_FILE%" >nul
if %ERRORLEVEL%==0 (
    echo ✅ Запись storage уже существует.
) else (
    echo 📝 Добавляю запись storage...
    echo 127.0.0.1    storage>>"%HOSTS_FILE%"
    echo ✅ Запись добавлена!
)

echo.
echo Проверка существующей записи localhost (порт 80)...
findstr /C:"localhost" "%HOSTS_FILE%" >nul
if %ERRORLEVEL%==0 (
    echo ✅ Запись localhost существует.
) else (
    echo 📝 Добавляю запись localhost...
    echo 127.0.0.1    localhost>>"%HOSTS_FILE%"
    echo ✅ Запись добавлена!
)

echo.
echo 📋 Проверка записей в hosts файле:
echo =================================
type "%HOSTS_FILE%" | findstr /C:"127.0.0.1"
echo =================================
echo.
echo ✅ Готово! Не забудь пересобрать Docker Compose!
pause