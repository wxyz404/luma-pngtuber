; Check the exact files we will replace. No CIM dependency, broad process-prefix
; matching, taskkill, or forced termination of another application is needed.
!macro sproutCheckWritable RELATIVE_PATH
  ${if} $R8 == ""
    ${if} ${FileExists} "$INSTDIR\${RELATIVE_PATH}"
      System::Call 'kernel32::CreateFileW(w "$INSTDIR\${RELATIVE_PATH}", i 0x40000000, i 7, p 0, i 3, i 0x80, p 0) p.r7'
      ${if} $7 == -1
        StrCpy $R8 "$INSTDIR\${RELATIVE_PATH}"
      ${else}
        System::Call 'kernel32::CloseHandle(p r7)'
      ${endif}
    ${endif}
  ${endif}
!macroend

!macro customCheckAppRunning
  Push $7
  Push $R8
  sproutRetryFiles:
    StrCpy $R8 ""
    !insertmacro sproutCheckPayload
    !ifndef BUILD_UNINSTALLER
      !insertmacro sproutCheckWritable "Uninstall Sprout.exe"
      !insertmacro sproutCheckWritable "Uninstall Luma.exe"
    !endif
    ${if} $R8 != ""
      DetailPrint "Cannot replace application file: $R8"
      MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "Sprout cannot replace this application file:$\r$\n$R8$\r$\n$\r$\nSave your avatar and close Sprout (including any remaining Sprout processes in Task Manager), then Retry. If it is already closed, check folder permissions or restart Windows. Your saved avatars have not been removed." /SD IDCANCEL IDRETRY sproutRetryFiles
      SetErrorLevel 2
      Quit
    ${endif}
  Pop $R8
  Pop $7
!macroend

!macro customInstall
  ; Remove only obsolete launchers from the Luma rename after new files exist.
  Delete "$INSTDIR\Luma.exe"
  Delete "$INSTDIR\Uninstall Luma.exe"
!macroend
