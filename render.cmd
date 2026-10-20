@echo off
setlocal
chcp 65001 >nul
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\render.ps1" %*
set "PV_STATUS=%ERRORLEVEL%"
if not defined PV_RENDER_NO_PAUSE pause
exit /b %PV_STATUS%
