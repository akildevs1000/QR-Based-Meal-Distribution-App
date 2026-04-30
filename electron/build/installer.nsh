; Custom NSIS hooks for QR Meal Server installer.
; Adds a Windows Firewall inbound rule for port 8000 on install,
; removes it on uninstall.

!macro customInstall
  DetailPrint "Adding Windows Firewall rule for port 8000…"
  nsExec::Exec 'netsh advfirewall firewall delete rule name="QR Meal Server"'
  nsExec::Exec 'netsh advfirewall firewall add rule name="QR Meal Server" dir=in action=allow protocol=TCP localport=8000 profile=domain,private description="QR Meal distribution backend"'
!macroend

!macro customUnInstall
  DetailPrint "Removing Windows Firewall rule for QR Meal Server…"
  nsExec::Exec 'netsh advfirewall firewall delete rule name="QR Meal Server"'
!macroend
