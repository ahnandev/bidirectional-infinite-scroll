import { execFileSync, spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')
const version = process.argv[2]

if (!version) {
  console.error('Usage: npm run demo:react -- <16|17|18|19>')
  process.exit(1)
}

const output = execFileSync(
  'node',
  ['./scripts/prepare-demo-react-version.mjs', version],
  {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'inherit'],
  },
)

process.stdout.write(output)

const match = output.match(/Prepared demo for React \d+ in: (.+)/)
if (!match) {
  console.error('Could not determine prepared demo directory')
  process.exit(1)
}

const targetDir = match[1].trim()
const child = spawn('npm', ['run', 'dev'], {
  cwd: targetDir,
  stdio: 'inherit',
})

child.on('exit', code => {
  process.exit(code ?? 0)
})
