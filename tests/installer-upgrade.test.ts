import { expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { upgradeTemplate, payloadFiles, preflightMacro } = require('../scripts/installer-upgrade.cjs');
const builder = createRequire(require.resolve('electron-builder'));
const lib = path.dirname(builder.resolve('app-builder-lib/package.json'));

it('adapts the actual builder template without executing the broken old uninstaller', () => {
  const template = readFileSync(path.join(lib, 'templates/nsis/include/installUtil.nsh'), 'utf8');
  const result = upgradeTemplate(template);
  const body = result.match(/^Function uninstallOldVersion\n[\s\S]*?^FunctionEnd/m)![0];
  expect(body).not.toMatch(/ExecWait|DeleteReg|RMDir|Rename|old-uninstaller\.exe/);
  expect(body).toContain('Pop $sproutUpgradeRoot');
  expect(body).toContain('${INSTALL_REGISTRY_KEY}');
  expect(body).toContain('GetFullPathName');
  expect(body).toContain('Choose that same folder');
  expect(body).toContain('Changing installation scope requires uninstalling');
  expect(body).toContain('ClearErrors');
  expect(result.slice(0,result.indexOf('Function uninstallOldVersion'))).toBe(template.slice(0,template.indexOf('Function uninstallOldVersion')));
  expect(() => upgradeTemplate('Function uninstallOldVersion\nFunctionEnd')).toThrow();
  expect(() => upgradeTemplate(template + template)).toThrow();
});

it('preflights every shipped file and the legacy launcher, rejecting incomplete payloads and unsafe paths', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'sprout-payload-test-'));
  try {
    expect(() => payloadFiles(dir)).toThrow('Incomplete');
    mkdirSync(path.join(dir,'resources'));
    for (const file of ['Sprout.exe', 'resources/app.asar','resources/custom.png']) writeFileSync(path.join(dir,file), 'fixture');
    const files = payloadFiles(dir);
    expect(files).toEqual(['Sprout.exe','resources/app.asar','resources/custom.png']);
    const macro = preflightMacro(files);
    for (const name of [...files,'Luma.exe']) expect(macro).toContain(`"${name.replaceAll('/','\\')}"`);
    for (const name of ['../outside', 'C:/outside', 'bad$INSTDIR', 'bad"path', 'bad\npath']) expect(() => preflightMacro([name])).toThrow('Unsafe');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
