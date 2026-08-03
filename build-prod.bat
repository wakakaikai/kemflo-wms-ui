@echo off
setlocal

chcp 65001 >nul
title WMS 前端生产环境打包

REM 切换到脚本所在目录，确保从项目根目录执行
cd /d "%~dp0"

echo ==========================================
echo   WMS 前端生产环境打包
echo ==========================================
echo.

REM 设置 Node.js 最大堆内存为 8GB
set "NODE_OPTIONS=--max-old-space-size=8192"

echo 当前目录：%CD%
echo Node 版本：
node -v
if errorlevel 1 (
    echo.
    echo [错误] 未找到 Node.js，请先安装或配置 Node.js 环境变量。
    pause
    exit /b 1
)

echo.
echo npm 版本：
call npm -v
if errorlevel 1 (
    echo.
    echo [错误] 未找到 npm，请检查 Node.js/npm 安装。
    pause
    exit /b 1
)

echo.
echo Node 内存参数：%NODE_OPTIONS%
echo 开始执行生产环境打包...
echo.

call npm run build:prod

if errorlevel 1 (
    echo.
    echo ==========================================
    echo   [失败] 打包失败，请查看上方错误信息
    echo ==========================================
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   [成功] 打包完成
echo   输出目录：%CD%\dist
echo ==========================================
pause

endlocal