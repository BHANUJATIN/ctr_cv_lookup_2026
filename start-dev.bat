@echo off
echo Starting CV Submission Tracker...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd server && npm run dev"

timeout /t 2 /nobreak > nul

echo Starting Frontend Client...
start "Frontend Client" cmd /k "cd client && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
