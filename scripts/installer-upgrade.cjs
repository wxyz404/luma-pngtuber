const fs = require('node:fs');
const path = require('node:path');

// These templates are intentionally tied to the pinned electron-builder version.
// Fail the build if its upgrade protocol changes instead of silently shipping it.
function upgradeTemplate(template) {
  const matches = [...template.matchAll(/^Function uninstallOldVersion\r?\n[\s\S]*?^FunctionEnd/gm)];
  if (matches.length !== 1 || !matches[0][0].includes('old-uninstaller.exe')) {
    throw new Error('Unsupported electron-builder uninstall template; review upgrade integration.');
  }
  return template.replace(matches[0][0], `Function uninstallOldVersion
  Var /GLOBAL sproutUpgradeRoot
  Var /GLOBAL sproutPreviousDirectory
  Pop $sproutUpgradeRoot
  !insertmacro readReg $sproutPreviousDirectory "$sproutUpgradeRoot" "\${INSTALL_REGISTRY_KEY}" InstallLocation
  \${if} $sproutPreviousDirectory == ""
    !insertmacro readReg $R1 "$sproutUpgradeRoot" "\${UNINSTALL_REGISTRY_KEY}" UninstallString
    !insertmacro GetInQuotes $R1 "$R1"
    \${if} $R1 != ""
      Push $R1
      Call GetFileParent
      Pop $sproutPreviousDirectory
    \${endif}
  \${endif}

  \${if} $sproutPreviousDirectory != ""
    \${if} $sproutUpgradeRoot == "HKEY_CURRENT_USER"
      MessageBox MB_OK|MB_ICONEXCLAMATION "A per-user copy of Sprout is already installed. Keep the current-user installation option to update it. Changing installation scope requires uninstalling that copy first; saved avatars are kept." /SD IDOK
      SetErrorLevel 2
      Quit
    \${endif}
    GetFullPathName $sproutPreviousDirectory "$sproutPreviousDirectory"
    GetFullPathName $R0 "$INSTDIR"
    \${if} $sproutPreviousDirectory != $R0
      MessageBox MB_OK|MB_ICONEXCLAMATION "Sprout is already installed in:$\\r$\\n$sproutPreviousDirectory$\\r$\\n$\\r$\\nChoose that same folder to update it. To move Sprout, uninstall the previous copy first; saved avatars are kept." /SD IDOK
      SetErrorLevel 2
      Quit
    \${endif}
  \${endif}
  # Replace program files in place. Never execute the previous uninstaller:
  # its --updated rename-to-TEMP step can fail before installing the new app.
  # Standard extraction, new uninstaller, registry and shortcuts still follow.
  StrCpy $R0 0
  ClearErrors
FunctionEnd`);
}

function payloadFiles(directory) {
  const files = [];
  function walk(dir, relative = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Unexpected link in packaged runtime: ${name}`);
      if (entry.isDirectory()) walk(path.join(dir, entry.name), name);
      else if (entry.isFile()) files.push(name);
    }
  }
  walk(directory);
  if (!files.includes('Sprout.exe') || !files.includes('resources/app.asar')) {
    throw new Error('Incomplete Sprout runtime; refusing to build an unchecked installer.');
  }
  return files.sort();
}

function preflightMacro(files) {
  const checks = [...new Set([...files, 'Luma.exe'])].map(file => {
    if (file.startsWith('/') || /^[A-Za-z]:/.test(file) || file.split(/[\\/]/).includes('..') || /[$"\r\n]/.test(file)) {
      throw new Error(`Unsafe packaged path: ${file}`);
    }
    return `  !insertmacro sproutCheckWritable "${file.replaceAll('/', '\\')}"`;
  }).join('\n');
  return `!macro sproutCheckPayload\n${checks}\n!macroend\n`;
}

module.exports = { upgradeTemplate, payloadFiles, preflightMacro };
