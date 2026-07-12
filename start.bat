@echo off
title HR Rezerv Tizimi
cd /d "%~dp0"

echo ===================================
echo   HR Rezerv Tizimi ishga tushmoqda
echo ===================================
echo.

:: Start backend server
cd backend
start "" /B node server.js
timeout /t 3 /nobreak >nul

:: Check if running
node -e "http=require('http');http.get('http://localhost:3001/api/health',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log('Server:',JSON.parse(d).status))}).on('error',()=>console.log('Server xatosi'))" 2>nul

echo.
echo ===================================
echo   Tizim ishga tushdi!
echo   http://localhost:3001
echo   Login: admin / admin123
echo ===================================
echo.
echo Brauzer ochilmoqda...
start http://localhost:3001
echo.
echo Tizimni to'xtatish uchun oynani yoping
pause >nul

:: Clean up
taskkill /f /im node.exe >nul 2>&1
