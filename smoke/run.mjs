// `npm run smoke`: bring the stack up, run the journey, tear the stack down — whatever the result.
// Extra arguments go to Playwright, e.g. `npm run smoke -- --project=desktop`.
// SMOKE_KEEP=1 leaves the stack running afterwards (to look at the backend log or the database).
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const compose = ['compose', '-f', 'docker-compose.smoke.yml'];
const playwrightCli = createRequire(import.meta.url).resolve('@playwright/test/cli');

// No shell: arguments reach the command as they were given, spaces included, on every platform.
function run(command, args) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  return spawnSync(command, args, { stdio: 'inherit' }).status ?? 1;
}

// A stack left over from an interrupted or kept run still has its data, and the seeded people are
// one-shot, so every run starts from nothing.
run('docker', [...compose, 'down', '-v']);

if (run('docker', [...compose, 'up', '--build', '--wait']) !== 0) {
  console.error('\nThe smoke stack did not come up. Backend log:');
  run('docker', [...compose, 'logs', '--tail', '80', 'backend']);
  run('docker', [...compose, 'down', '-v']);
  process.exit(1);
}

const status = run(process.execPath, [playwrightCli, 'test', ...process.argv.slice(2)]);

if (process.env.SMOKE_KEEP !== '1') {
  run('docker', [...compose, 'down', '-v']);
}
if (status !== 0) {
  console.error('\nThe journey failed. Report: npx playwright show-report');
}
process.exit(status);
