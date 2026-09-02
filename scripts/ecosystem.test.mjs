import assert from 'node:assert/strict'
import test from 'node:test'

import { loadManifest, renderProfile, validateManifest } from './ecosystem.mjs'

const manifest = validateManifest(loadManifest())

test('profile output includes an accessible route map', () => {
  const output = renderProfile(manifest)

  assert.match(output, /```mermaid/)
  assert.match(output, /accTitle: AI engineering ecosystem map/)
  assert.match(output, /accDescr: Five routes connect the ecosystem hub to all sixteen projects/)
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
