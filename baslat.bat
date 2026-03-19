@echo off
chcp 65001 >nul
echo.
echo ================================================
echo   BusScanner - Kurulum ve Başlat
echo ================================================
echo.

where python >nul 2>&1
if errorlevel 1 (
    echo HATA: Python bulunamadı!
    echo Python indirin: https://www.python.org/downloads/
    echo Kurulumda "Add Python to PATH" seçeneğini işaretleyin.
    pause
    exit /b 1
)

echo Python bulundu.
echo.
echo Gerekli paketler yükleniyor...
python -m pip install -r requirements.txt --quiet

echo.
echo Sunucu başlatılıyor...
echo Tarayıcıda açın: http://localhost:3000
echo Kapatmak için bu pencereyi kapatın.
echo.

start "" "http://localhost:3000"
python app.py
pause
