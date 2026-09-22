import assert from 'node:assert/strict'
import test from 'node:test'

import { loadManifest, renderProfile, validateManifest } from './ecosystem.mjs'

const manifest = validateManifest(loadManifest())

test('a growing catalog validates and updates its accessible project count', () => {
  const expanded = structuredClone(manifest)
  expanded.projects.push({
    ...expanded.projects.find((project) => project.id === 'yt-insights'),
    id: 'additional-research-tool',
    name: 'Additional Research Tool',
    github: 'https://github.com/example/additional-research-tool',
    managed_readme: false,
    relations: [],
  })

  assert.doesNotThrow(() => validateManifest(expanded))
  const output = renderProfile(expanded)
  assert.ok(output.includes(`all ${expanded.projects.length} projects`))
  assert.match(output, /Additional Research Tool/)
})

test('an empty project catalog is rejected', () => {
  const empty = { ...manifest, projects: [] }

  assert.throws(() => validateManifest(empty), /at least one project/)
})

test('profile output includes an accessible route map', () => {
  const output = renderProfile(manifest)

  assert.match(output, /```mermaid/)
  assert.match(output, /accTitle: AI engineering ecosystem map/)
  assert.ok(output.includes(`accDescr: Five routes connect the ecosystem hub to all ${manifest.projects.length} projects`))
  assert.match(output, /AI engineering ecosystem/)
  assert.match(output, /Observe & Improve.*CCBoard.*CC-Sessions.*cc-skill-usage/s)
})

test('profile output renders controlled facets as badges', () => {
  const output = renderProfile(manifest)

  assert.match(output, /<kbd>Context Engineering<\/kbd>/)
  assert.match(output, /<kbd>Harness<\/kbd>/)
  assert.match(output, /<kbd>Skill Analytics<\/kbd>/)
  assert.doesNotMatch(output, /<kbd>AI<\/kbd>/)
})

test('profile output spotlights cc-skill-usage', () => {
  const output = renderProfile(manifest)

  assert.match(output, /Project spotlight: \[cc-skill-usage\]/)
  assert.match(output, /real Skill tool calls from local transcripts/)
})
