import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')
const shouldVerifyDemoBuild = process.argv.includes('--demo-build')

const reactMatrix = [
  { label: '16', react: '16.14.0', reactDom: '16.14.0' },
  { label: '17', react: '17.0.2', reactDom: '17.0.2' },
  { label: '18', react: '18.3.1', reactDom: '18.3.1' },
  { label: '19', react: '19.2.0', reactDom: '19.2.0' },
]

function getDemoMainSource(versionLabel) {
  if (versionLabel === '16' || versionLabel === '17') {
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

function createTarball() {
  const packDir = mkdtempSync(join(tmpdir(), 'bidir-scroll-pack-'))
  const tarballName = runOutput('npm', ['pack', '--pack-destination', packDir], repoRoot)
  return { tarball: join(packDir, tarballName), packDir }
}

function writeSmokeScript(targetDir) {
  writeFileSync(
    join(targetDir, 'smoke.mjs'),
    `import { Window } from 'happy-dom'
import React, { useState } from 'react'
import * as ReactDOMLegacy from 'react-dom'
import { FetchMore, useBidirectionalScroll } from '@ahnandev/bidirectional-infinite-scroll/react'

const window = new Window({ url: 'http://localhost' })
const { document } = window
globalThis.window = window
globalThis.document = document
globalThis.HTMLElement = window.HTMLElement
globalThis.Element = window.Element
globalThis.Node = window.Node
globalThis.Event = window.Event
globalThis.MouseEvent = window.MouseEvent
Object.defineProperty(globalThis, 'navigator', {
  value: window.navigator,
  configurable: true,
})
globalThis.requestAnimationFrame = cb => setTimeout(() => cb(Date.now()), 0)
globalThis.cancelAnimationFrame = id => clearTimeout(id)

const scrollCalls = []
HTMLElement.prototype.scrollIntoView = function scrollIntoView() {
  scrollCalls.push(this.textContent ?? this.id ?? 'unknown')
}

class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback
    this.elements = new Set()
  }

  observe(target) {
    this.elements.add(target)
  }

  unobserve(target) {
    this.elements.delete(target)
  }

  disconnect() {
    this.elements.clear()
  }

  takeRecords() {
    return []
  }
}

globalThis.IntersectionObserver = MockIntersectionObserver

function CombinedRefItem({ id, isFirst, isEntry, firstItemRef, anchorRef }) {
  return React.createElement(
    'div',
    {
      ref: el => {
        if (isFirst) firstItemRef(el)
        if (isEntry) anchorRef(el)
      },
    },
    id,
  )
}

function App() {
  const [items, setItems] = useState(['entry', 'b', 'c'])
  const { anchorRef, firstItemRef } = useBidirectionalScroll({ safariCorrection: false })

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(FetchMore, { hasMore: false, onIntersect: () => {} }),
    items.map((id, index) =>
      React.createElement(CombinedRefItem, {
        key: id,
        id,
        isFirst: index === 0,
        isEntry: id === 'entry',
        firstItemRef,
        anchorRef,
      }),
    ),
    React.createElement(
      'button',
      {
        id: 'prepend',
        onClick: () => setItems(prev => ['new', ...prev]),
      },
      'prepend',
    ),
  )
}

async function mountWithCompatibleRoot(container, node) {
  try {
    const clientEntry = 'react-dom/client'
    const { createRoot } = await import(clientEntry)
    const root = createRoot(container)
    root.render(node)
    return () => root.unmount()
  } catch {
    ReactDOMLegacy.render(node, container)
    return () => ReactDOMLegacy.unmountComponentAtNode(container)
  }
}

async function waitForPaint() {
  await new Promise(resolve => setTimeout(resolve, 0))
  await new Promise(resolve => setTimeout(resolve, 0))
}

const container = document.createElement('div')
document.body.appendChild(container)

const unmount = await mountWithCompatibleRoot(container, React.createElement(App))
await waitForPaint()

if (scrollCalls.length < 1) {
  throw new Error('Expected initial entry anchoring to call scrollIntoView')
}

document.getElementById('prepend').dispatchEvent(new MouseEvent('click', { bubbles: true }))
await waitForPaint()

if (scrollCalls.length < 2) {
  throw new Error('Expected prepend anchoring to call scrollIntoView again')
}

unmount()
console.log('React compatibility smoke test passed')
`,
  )
}

function verifyLibraryCompat(versionConfig, tarball) {
  const targetDir = mkdtempSync(join(tmpdir(), `bidir-scroll-react-${versionConfig.label}-`))
  writeFileSync(
    join(targetDir, 'package.json'),
    JSON.stringify(
      {
        name: `react-compat-${versionConfig.label}`,
        private: true,
        type: 'module',
      },
      null,
      2,
    ),
  )

  run(
    'npm',
    [
      'install',
      '--no-package-lock',
      tarball,
      `react@${versionConfig.react}`,
      `react-dom@${versionConfig.reactDom}`,
      'happy-dom@20.8.9',
    ],
    targetDir,
  )

  writeSmokeScript(targetDir)
  run('node', ['smoke.mjs'], targetDir)
  rmSync(targetDir, { recursive: true, force: true })
}

function verifyDemoBuild(versionConfig, tarball) {
  const targetDir = mkdtempSync(join(tmpdir(), `bidir-scroll-demo-${versionConfig.label}-`))
  cpSync(join(repoRoot, 'demo'), targetDir, { recursive: true })
  writeFileSync(join(targetDir, 'src/main.tsx'), getDemoMainSource(versionConfig.label))

  const tempPackageJson = {
    name: `demo-react-${versionConfig.label}`,
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
      react: versionConfig.react,
      'react-dom': versionConfig.reactDom,
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
  }

  writeFileSync(join(targetDir, 'package.json'), JSON.stringify(tempPackageJson, null, 2))
  rmSync(join(targetDir, 'package-lock.json'), { force: true })

  run('npm', ['install'], targetDir)
  run('npm', ['run', 'build'], targetDir)
  rmSync(targetDir, { recursive: true, force: true })
}

run('npm', ['run', 'build'], repoRoot)
const { tarball, packDir } = createTarball()

try {
  for (const versionConfig of reactMatrix) {
    console.log(`\n== React ${versionConfig.label} library smoke ==`)
    verifyLibraryCompat(versionConfig, tarball)
  }

  if (shouldVerifyDemoBuild) {
    for (const versionConfig of reactMatrix) {
      console.log(`\n== React ${versionConfig.label} demo build ==`)
      verifyDemoBuild(versionConfig, tarball)
    }
  }
} finally {
  rmSync(packDir, { recursive: true, force: true })
}
