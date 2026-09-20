import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const text=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Windows installer is self-contained and provides uninstall support',async()=>{
  const [setup,launch,stop,pack,workflow]=await Promise.all([
    text('installer/SS220Binding.iss'),
    text('installer/scripts/launch-installed.ps1'),
    text('installer/scripts/stop-installed.ps1'),
    text('scripts/package-windows.ps1'),
    text('.github/workflows/release-windows.yml'),
  ]);
  assert.match(setup,/PrivilegesRequired=lowest/);
  assert.match(setup,/\[UninstallRun\]/);
  assert.match(setup,/Удалить SS220 Binding/);
  assert.match(launch,/runtime\\node\.exe/);
  assert.match(launch,/server\/index\.js','--production/);
  assert.match(launch,/foreach \(\$candidate in 3141\.\.3150\)/);
  assert.match(launch,/\$env:PORT = \[string\]\$port/);
  assert.match(launch,/param\(\[switch\]\$NoBrowser\)/);
  assert.match(stop,/ExecutablePath.+-ieq \$runtime/);
  assert.match(pack,/SHASUMS256\.txt/);
  assert.match(workflow,/gh release (?:create|upload)/);
});
