# 登入後常駐 Claude Code Remote Control（spawn same-dir），程序結束就 10 秒後重啟。
# 停止：直接關掉這個視窗。登入自動啟動由工作排程器「JapaneseSpeedRun Remote Control」負責。
$ErrorActionPreference = 'Continue'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo
$Host.UI.RawUI.WindowTitle = 'JapaneseSpeedRun Remote Control'
while ($true) {
    & "$env:USERPROFILE\.local\bin\claude.exe" remote-control --name '日文vault' --spawn same-dir --permission-mode bypassPermissions
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] remote-control 結束（exit $LASTEXITCODE），10 秒後重啟…"
    Start-Sleep -Seconds 10
}
