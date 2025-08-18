@echo off
echo Agregando todos los cambios al area de preparacion (staging)...
git add .

echo.
set /p commit_message="Introduce el mensaje para el commit y presiona Enter: "

echo.
echo Creando el commit con tu mensaje...
git commit -m "%commit_message%"

echo.
echo Subiendo los cambios a GitHub...
git push

echo.
echo --- 
echo Proceso completado. Tus cambios han sido subidos.
pause
