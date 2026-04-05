const { existsSync } = require('node:fs');
const { spawnSync } = require('node:child_process');

const [entryName, ...entryArgs] = process.argv.slice(2);

if (!entryName) {
  console.error('Missing entry name. Usage: node scripts/run-dist-entry.js <main|cli> [args...]');
  process.exit(1);
}

const candidates = [`dist/src/${entryName}.js`, `dist/${entryName}.js`];
const entryPath = candidates.find((candidate) => existsSync(candidate));

if (!entryPath) {
  console.error(
    `Cannot find built entry for "${entryName}". Checked: ${candidates.join(', ')}. Run "pnpm --filter api build" first.`,
  );
  process.exit(1);
}

const child = spawnSync(process.execPath, [entryPath, ...entryArgs], {
  stdio: 'inherit',
});

if (child.error) {
  console.error(child.error.message);
  process.exit(1);
}

process.exit(child.status ?? 0);
