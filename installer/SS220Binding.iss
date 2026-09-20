#ifndef MyAppVersion
  #define MyAppVersion "1.0.0"
#endif

#define MyAppName "SS220 Binding"
#define MyAppPublisher "SS220"
#define MyAppExeName "scripts\launch-installed.ps1"

[Setup]
AppId={{D2BF642B-A0DB-4D53-8F8E-53F4E3C798B6}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={localappdata}\Programs\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=..\release
OutputBaseFilename=SS220-Binding-Setup-{#MyAppVersion}
SetupIconFile=.stage\binding-deck.ico
UninstallDisplayIcon={app}\binding-deck.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
CloseApplications=no
RestartApplications=no
ChangesAssociations=no
VersionInfoVersion={#MyAppVersion}
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}

[Languages]
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"

[Tasks]
Name: "desktopicon"; Description: "Создать ярлык на рабочем столе"; GroupDescription: "Дополнительные ярлыки:"; Flags: checkedonce

[Files]
Source: ".stage\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\SS220 Binding"; Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\{#MyAppExeName}"""; WorkingDir: "{app}"; IconFilename: "{app}\binding-deck.ico"; Comment: "Запустить SS220 Binding"
Name: "{group}\Остановить SS220 Binding"; Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\scripts\stop-installed.ps1"""; WorkingDir: "{app}"; IconFilename: "{app}\binding-deck.ico"; Comment: "Остановить локальный сервер SS220 Binding"
Name: "{group}\Удалить SS220 Binding"; Filename: "{uninstallexe}"; Comment: "Удалить SS220 Binding с компьютера"
Name: "{autodesktop}\SS220 Binding"; Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\{#MyAppExeName}"""; WorkingDir: "{app}"; IconFilename: "{app}\binding-deck.ico"; Tasks: desktopicon

[Run]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\{#MyAppExeName}"""; Description: "Запустить SS220 Binding"; Flags: nowait postinstall skipifsilent runhidden

[UninstallRun]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\scripts\stop-installed.ps1"" -Silent"; Flags: runhidden waituntilterminated; RunOnceId: "StopSS220Binding"

[UninstallDelete]
Type: filesandordirs; Name: "{localappdata}\SS220 Binding"

[Code]
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
  StopScript: String;
begin
  Result := '';
  StopScript := ExpandConstant('{app}\scripts\stop-installed.ps1');
  if FileExists(StopScript) then
    Exec('powershell.exe', '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + StopScript + '" -Silent', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;
