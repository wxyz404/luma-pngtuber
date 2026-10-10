const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const { upgradeTemplate, payloadFiles, preflightMacro } = require('./installer-upgrade.cjs');

async function main() {
  const root = path.resolve(__dirname, '..');
  const builderPath = require.resolve('electron-builder');
  const builder = require(builderPath);
  const builderRequire = createRequire(builderPath);
  const lib = path.dirname(builderRequire.resolve('app-builder-lib/package.json'));
  if (JSON.parse(fs.readFileSync(path.join(lib, 'package.json'))).version !== '26.15.3') {
    throw new Error('Installer integration requires electron-builder 26.15.3.');
  }
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'sprout-installer-'));
  const utilPath = path.join(stage, 'installUtil.nsh');
  fs.writeFileSync(utilPath, upgradeTemplate(fs.readFileSync(path.join(lib, 'templates/nsis/include/installUtil.nsh'), 'utf8')));
  let runtime = process.env.SPROUT_PREPACKAGED ? path.resolve(process.env.SPROUT_PREPACKAGED) : undefined;
  const { NsisTarget } = require(path.join(lib, 'out/targets/nsis/NsisTarget.js'));
  const original = NsisTarget.prototype.executeMakensis;
  NsisTarget.prototype.executeMakensis = async function(defines, commands, script, options) {
    if (!runtime) throw new Error('Packaged runtime missing; cannot generate file preflight.');
    const needle = '!include "installUtil.nsh"';
    if (script.split(needle).length !== 2) throw new Error('Unsupported installer script.');
    const adapted = preflightMacro(payloadFiles(runtime)) + script.replace(needle, `!include "${utilPath}"`);
    return original.call(this, defines, commands, adapted, options);
  };
  try {
    await builder.build({
      projectDir: root, win: ['nsis'], x64: true,
      ...(runtime ? { prepackaged: runtime } : {}),
      config: { afterPack: context => { runtime = context.appOutDir; } },
    });
  } finally {
    NsisTarget.prototype.executeMakensis = original;
    // Only remove the directory created by mkdtemp above, never a supplied path.
    fs.rmSync(stage, { recursive: true, force: true });
  }
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { main };
