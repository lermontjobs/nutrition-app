@echo off
set DATABASE_URL=file:./dev.db
set NEXTAUTH_SECRET=nutrition-app-secret-key-2024
set NEXTAUTH_URL=http://localhost:4000
set OPENAI_API_KEY=sk-placeholder
set NODE_ENV=development
cd /d "C:\Users\yigal\AppData\Roaming\Genspark Claw\users\55a5c202-b16f-495b-94e9-6156314cf13b\workspace\nutrition-app"
"C:\Users\yigal\AppData\Roaming\Genspark Claw\users\55a5c202-b16f-495b-94e9-6156314cf13b\workspace\nutrition-app\node_modules\.bin\next.cmd" dev -p 4000
pause
