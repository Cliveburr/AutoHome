set DIRBASE=%~dp0

"%DIRBASE%\rethinkdb.exe" -d "%DIRBASE%\..\DataDebug"

pause

set DIRBASE=