@echo off
title DevMatch AI - Spring Boot Backend
echo ========================================================
echo Starting DevMatch AI Backend (Spring Boot 3 + MongoDB)
echo ========================================================
cd backend
.\gradlew.bat bootRun --no-daemon
pause

