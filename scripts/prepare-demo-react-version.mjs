import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')
const version = process.argv[2]

const versions = {
  '16': { react: '16.14.0', reactDom: '16.14.0' },
  '17': { react: '17.0.2', reactDom: '17.0.2' },
  '18': { react: '18.3.1', reactDom: '18.3.1' },
  '19': { react: '19.2.0', reactDom: '19.2.0' },
}

function getDemoMainSource(version: string) {
  if (version === '16' || version === '17') {
    return `import { StrictMode } from 'react'
import * as ReactDOM from 'react-dom'
import App from './App'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Missing root element')
}

;(ReactDOM as typeof ReactDOM & {
  render: (node: unknown, target: Element) => void
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
  container,
)
`
  }

  return `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Missing root element')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`
}

if (!version || !versions[version]) {
  console.error('Usage: npm run demo:prepare-react -- <16|17|18|19>')
  process.exit(1)
}

function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      npm_config_cache: join(tmpdir(), 'bidir-scroll-npm-cache'),
    },
  })
}

function runOutput(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      npm_config_cache: join(tmpdir(), 'bidir-scroll-npm-cache'),
    },
  }).trim()
}

run('npm', ['run', 'build'], repoRoot)

const packDir = mkdtempSync(join(tmpdir(), 'bidir-scroll-pack-'))
const tarballName = runOutput('npm', ['pack', '--pack-destination', packDir], repoRoot)
const tarball = join(packDir, tarballName)

const targetDir = mkdtempSync(join(tmpdir(), `bidir-scroll-demo-react-${version}-`))
cpSync(join(repoRoot, 'demo'), targetDir, { recursive: true })
rmSync(join(targetDir, 'package-lock.json'), { force: true })
writeFileSync(join(targetDir, 'src/main.tsx'), getDemoMainSource(version))

writeFileSync(
  join(targetDir, 'package.json'),
  JSON.stringify(
    {
      name: `demo-react-${version}`,
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc -b && vite build',
        preview: 'vite preview',
      },
      dependencies: {
        '@ahnandev/bidirectional-infinite-scroll': tarball,
        react: versions[version].react,
        'react-dom': versions[version].reactDom,
      },
      devDependencies: {
        '@eslint/js': '^9.39.4',
        '@types/node': '^24.12.2',
        '@types/react': '^19.2.14',
        '@types/react-dom': '^19.2.3',
        '@vitejs/plugin-react': '^6.0.1',
        eslint: '^9.39.4',
        'eslint-plugin-react-hooks': '^7.0.1',
        'eslint-plugin-react-refresh': '^0.5.2',
        globals: '^17.4.0',
        typescript: '~6.0.2',
        'typescript-eslint': '^8.58.0',
        vite: '^8.0.4',
      },
    },
    null,
    2,
  ),
)

run('npm', ['install'], targetDir)

console.log(`Prepared demo for React ${version} in: ${targetDir}`)
console.log(`Run: cd ${targetDir} && npm run dev`)
