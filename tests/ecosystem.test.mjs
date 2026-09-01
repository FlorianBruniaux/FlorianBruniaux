import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { loadManifest, validateManifest } from '../scripts/ecosystem.mjs'

const root = new URL('../', import.meta.url)

function runCli(...args) {
  return spawnSync(process.execPath, ['scripts/ecosystem.mjs', ...args], {
    cwd: root,
    encoding: 'utf8',
  })
}

test('validate accepts the canonical 16-project galaxy', () => {
  const result = runCli('validate')

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /16 projects across 5 routes are valid/)
})

test('validate rejects broken identities, routes, relations, and RTK ownership', () => {
  const cases = [
    {
      name: 'duplicate route id',
      mutate: (manifest) => { manifest.routes[1].id = manifest.routes[0].id },
      error: /duplicate or missing route id/,
    },
    {
      name: 'duplicate project id',
      mutate: (manifest) => { manifest.projects[1].id = manifest.projects[0].id },
      error: /duplicate or missing project id/,
    },
    {
      name: 'unknown primary route',
      mutate: (manifest) => { manifest.projects[0].route = 'missing-route' },
      error: /unknown route/,
    },
    {
      name: 'more than three tags',
      mutate: (manifest) => { manifest.projects[0].tags.push('extra') },
      error: /at most 3 tags/,
    },
    {
      name: 'more than four relations',
      mutate: (manifest) => { manifest.projects[0].relations.push({ project: 'flow-lean', label: 'Use with', reason: 'extra' }) },
      error: /at most 4 relations/,
    },
    {
      name: 'unknown relation target',
      mutate: (manifest) => { manifest.projects[0].relations[0].project = 'missing-project' },
      error: /unknown project/,
    },
    {
      name: 'self relation',
      mutate: (manifest) => { manifest.projects[0].relations[0].project = manifest.projects[0].id },
      error: /cannot relate to itself/,
    },
    {
      name: 'duplicate relation',
      mutate: (manifest) => { manifest.projects[0].relations[1].project = manifest.projects[0].relations[0].project },
      error: /repeats relation/,
    },
    {
      name: 'managed project without GitHub URL',
      mutate: (manifest) => { manifest.projects[0].github = null },
      error: /needs a GitHub URL/,
    },
    {
      name: 'wrong RTK GitHub URL',
      mutate: (manifest) => { manifest.projects.find((project) => project.id === 'rtk').github = 'https://github.com/FlorianBruniaux/rtk' },
      error: /RTK GitHub URL must be/,
    },
    {
      name: 'wrong RTK website URL',
      mutate: (manifest) => { manifest.projects.find((project) => project.id === 'rtk').website = 'https://rtk.example.com/' },
      error: /RTK website URL must be/,
    },
    {
      name: 'managed RTK README',
      mutate: (manifest) => { manifest.projects.find((project) => project.id === 'rtk').managed_readme = true },
      error: /RTK README must remain unmanaged/,
    },
  ]

  for (const scenario of cases) {
    const manifest = structuredClone(loadManifest())
    scenario.mutate(manifest)
    assert.throws(() => validateManifest(manifest), scenario.error, scenario.name)
  }
})

test('profile command replaces only the marked section with five route tables', () => {
  const directory = mkdtempSync(join(tmpdir(), 'ecosystem-profile-'))
  const file = join(directory, 'README.md')
  writeFileSync(file, [
    '# Profile',
    '',
    'keep before',
    '<!-- BEGIN GENERATED OPEN SOURCE GALAXY -->',
    'old catalog',
    '<!-- END GENERATED OPEN SOURCE GALAXY -->',
    'keep after',
    '',
  ].join('\n'))

  try {
    const result = runCli('profile', '--file', file, '--write')
    assert.equal(result.status, 0, result.stderr)

    const rendered = readFileSync(file, 'utf8')
    assert.match(rendered, /keep before/)
    assert.match(rendered, /keep after/)
    assert.doesNotMatch(rendered, /old catalog/)
    assert.match(rendered, /## Open-source galaxy/)
    assert.match(rendered, /### Build & Run/)
    assert.match(rendered, /### Observe & Improve/)
    assert.match(rendered, /### Secure & Validate/)
    assert.match(rendered, /### Learn & Adopt/)
    assert.match(rendered, /### Research, Discover & Grow/)
    assert.match(rendered, /\[Research, Discover & Grow\]\(#research-discover--grow\)/)
    assert.doesNotMatch(rendered, /#research,-discover/)
    assert.match(rendered, /\| Project \| Use it when \| Format \|/)
    assert.doesNotMatch(rendered, /\| Link \|/)
    assert.match(rendered, /https:\/\/github\.com\/rtk-ai\/rtk/)
    assert.match(rendered, /https:\/\/www\.rtk-ai\.app\//)
    assert.match(rendered, /<sub>token efficiency · CLI · Rust<\/sub>/)

    const projectRows = rendered.match(/^\| \*\*\[[^\n]+$/gm) ?? []
    assert.equal(projectRows.length, 16)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

function readmeFixture(directory, content = 'old related links') {
  const file = join(directory, 'README.md')
  writeFileSync(file, [
    '# Project',
    '',
    '<!-- BEGIN GENERATED RELATED PROJECTS -->',
    content,
    '<!-- END GENERATED RELATED PROJECTS -->',
    '',
    '## License',
    '',
  ].join('\n'))
  return file
}

test('readme command renders a bounded English neighborhood', () => {
  const directory = mkdtempSync(join(tmpdir(), 'ecosystem-readme-'))
  const file = readmeFixture(directory)

  try {
    const result = runCli('readme', '--project', 'flow-lean', '--file', file, '--write')
    assert.equal(result.status, 0, result.stderr)

    const rendered = readFileSync(file, 'utf8')
    assert.match(rendered, /Source: https:\/\/github\.com\/FlorianBruniaux\/FlorianBruniaux\/blob\/main\/ecosystem\/projects\.json; project: flow-lean/)
    assert.match(rendered, /## Explore the ecosystem/)
    assert.match(rendered, /Measure with \[cc-skill-usage\]/)
    assert.match(rendered, /Optimize with \[RTK\]\(https:\/\/github\.com\/rtk-ai\/rtk\)/)
    assert.match(rendered, /Learn with \[Claude Code Ultimate Guide\]/)
    assert.match(rendered, /Browse the complete open-source galaxy/)
    assert.doesNotMatch(rendered, /old related links/)
    assert.equal((rendered.match(/^- \*\*/gm) ?? []).length, 3)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('readme command renders the Cowork relation in French', () => {
  const directory = mkdtempSync(join(tmpdir(), 'ecosystem-readme-fr-'))
  const file = readmeFixture(directory)

  try {
    const result = runCli('readme', '--project', 'claude-cowork-guide', '--file', file, '--locale', 'fr', '--write')
    assert.equal(result.status, 0, result.stderr)

    const rendered = readFileSync(file, 'utf8')
    assert.match(rendered, /## Explorer l’écosystème/)
    assert.match(rendered, /Continuer avec \[Claude Code Ultimate Guide\]/)
    assert.match(rendered, /passer aux workflows de développement/)
    assert.match(rendered, /Parcourir toute la galaxie open source/)
    assert.equal((rendered.match(/^- \*\*/gm) ?? []).length, 1)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('readme command refuses to write the organization-owned RTK README', () => {
  const directory = mkdtempSync(join(tmpdir(), 'ecosystem-readme-rtk-'))
  const file = readmeFixture(directory)
  const before = readFileSync(file, 'utf8')

  try {
    const result = runCli('readme', '--project', 'rtk', '--file', file, '--write')
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /RTK README is not managed/)
    assert.equal(readFileSync(file, 'utf8'), before)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('readme command refuses a target without generation markers', () => {
  const directory = mkdtempSync(join(tmpdir(), 'ecosystem-readme-markers-'))
  const file = join(directory, 'README.md')
  writeFileSync(file, '# Project\n\nNo generated section.\n')

  try {
    const result = runCli('readme', '--project', 'starmapper', '--file', file, '--write')
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /target must contain.*GENERATED RELATED PROJECTS/)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('landing command writes five routes and 16 projects from the manifest', () => {
  const directory = mkdtempSync(join(tmpdir(), 'ecosystem-landing-'))
  const file = join(directory, 'personal-projects.generated.ts')

  try {
    const result = runCli('landing', '--file', file, '--write')
    assert.equal(result.status, 0, result.stderr)

    const rendered = readFileSync(file, 'utf8')
    assert.match(rendered, /This file is generated from the FlorianBruniaux profile manifest/)
    assert.match(rendered, /export const PERSONAL_PROJECT_ROUTES =/)
    assert.match(rendered, /export const PERSONAL_PROJECTS =/)
    assert.match(rendered, /"title": "Build & Run"/)
    assert.match(rendered, /"title": "Research, Discover & Grow"/)
    assert.match(rendered, /"github": "https:\/\/github\.com\/rtk-ai\/rtk"/)
    assert.match(rendered, /"website": "https:\/\/www\.rtk-ai\.app\/"/)
    assert.equal((rendered.match(/^    "id":/gm) ?? []).length, 21)
    assert.equal((rendered.match(/"featured": true/g) ?? []).length, 3)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
